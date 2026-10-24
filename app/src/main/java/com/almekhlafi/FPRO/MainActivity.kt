package com.almekhlafi.FPRO

import android.annotation.SuppressLint
import android.app.PictureInPictureParams
import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.ComponentName
import android.content.res.Configuration
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.util.Rational
import android.view.View
import android.view.ViewGroup
import android.webkit.*
import android.widget.FrameLayout
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.AbsoluteAlignment
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import kotlinx.coroutines.delay
import org.json.JSONArray

class MainActivity : ComponentActivity() {
    private lateinit var prefs: Preferences
    private lateinit var web: WebView
    private var settings by mutableStateOf(false)
    private var homeControls by mutableStateOf(false)
    private var gearX by mutableFloatStateOf(0f)
    private var gearY by mutableFloatStateOf(0f)
    private var loadingProgress by mutableIntStateOf(0)
    private var revision by mutableIntStateOf(0)
    private var splash by mutableStateOf(true)
    private var pip by mutableStateOf(false)
    private var pageSequence by mutableIntStateOf(0)
    private var pageConfirmed = false
    private var enhancementsInstalled = false
    private var mediaPlaying = false
    private var pipRequested = false
    private var externalHandoff = false
    private var loadState by mutableStateOf("تهيئة محرك الويب")
    private var failure by mutableStateOf<String?>(null)
    private var pageColor by mutableStateOf(Color(0xFF1877F2))
    private var fullView: View? = null
    private var fullCallback: WebChromeClient.CustomViewCallback? = null
    private var fileCallback: ValueCallback<Array<Uri>>? = null
    private val filePicker = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        fileCallback?.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result.resultCode, result.data)); fileCallback = null
    }
    private val mobileAgent by lazy { WebSettings.getDefaultUserAgent(this) }
    private val pageInfoScript by lazy { assets.open("page-info.js").bufferedReader().use { it.readText() } }
    private val pageInfoQuery by lazy {
        "(window.__fproPageInfo ? JSON.stringify(window.__fproPageInfo()) : " + pageInfoScript.trim().removeSuffix(";") + ")"
    }
    private val script by lazy { assets.open("reference-engines.js").bufferedReader().use { it.readText() } + "\n" + assets.open("facebook.js").bufferedReader().use { it.readText() } }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        prefs = Preferences(this)
        web = createWebView()
        WindowCompat.setDecorFitsSystemWindows(window, true)
        applySettings(false)
        // Keep Chromium in a real native view hierarchy, matching the working
        // browser baseline. Compose draws only transparent controls above it;
        // no AndroidView render-node interop is involved in website painting.
        val controls = ComposeView(this)
        setContentView(FrameLayout(this).apply {
            addView(web, FrameLayout.LayoutParams(-1, -1))
            addView(controls, FrameLayout.LayoutParams(-1, -1))
        })
        controls.setContent {
            val dark = prefs.flag("dark")
            val scheme = when {
                prefs.flag("dynamic") && Build.VERSION.SDK_INT >= 31 -> if (dark) dynamicDarkColorScheme(this) else dynamicLightColorScheme(this)
                dark -> darkColorScheme(primary = Color(0xFFD4AF37), background = if (prefs.flag("amoled")) Color.Black else Color(0xFF18191A))
                else -> lightColorScheme(primary = Color(0xFF1877F2))
            }
            // Reading revision forces a settings refresh without rebuilding the WebView.
            @Suppress("UNUSED_VARIABLE") val currentRevision = revision
            MaterialTheme(colorScheme = scheme) {
                CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
                    Box(Modifier.fillMaxSize()) {
                        Box(Modifier.fillMaxSize()) {
                            // The website owns the whole viewport; no replacement Facebook toolbar.
                            // RTL belongs to native Arabic controls, not the browser viewport.
                            // Let Facebook's own HTML dir/CSS control its text direction.
                            if (!pip) {
                                if (loadingProgress in 1..99) LinearProgressIndicator(
                                    progress = { loadingProgress / 100f },
                                    modifier = Modifier.fillMaxWidth().align(Alignment.TopCenter)
                                )
                                if (homeControls) IconButton(
                                    onClick = {
                                        web.clearFocus()
                                        WindowInsetsControllerCompat(window, window.decorView).hide(WindowInsetsCompat.Type.ime())
                                        settings = true
                                    },
                                    modifier = Modifier.align(AbsoluteAlignment.TopLeft).absoluteOffset {
                                        IntOffset((gearX - 22.dp.toPx()).toInt().coerceAtLeast(0), (gearY - 22.dp.toPx()).toInt().coerceAtLeast(0))
                                    }.size(44.dp).semantics { contentDescription = "الإعدادات" }
                                ) { Text("⚙️", style = MaterialTheme.typography.headlineSmall) }
                                failure?.let { message ->
                                    Card(Modifier.align(Alignment.BottomCenter).fillMaxWidth().padding(12.dp)) {
                                        Column(Modifier.padding(16.dp)) {
                                            Text(message)
                                            Text(diagnostics(), style = MaterialTheme.typography.bodySmall)
                                            Row {
                                                TextButton(onClick = { failure = null; web.reload() }) { Text("إعادة المحاولة") }
                                                TextButton(onClick = { failure = null; web.loadUrl("https://m.facebook.com/") }) { Text("الصفحة الرئيسية") }
                                            }
                                        }
                                    }
                                }
                            }
                            if (settings && !pip) Dialog(
                                onDismissRequest = { settings = false },
                                properties = DialogProperties(usePlatformDefaultWidth = false)
                            ) {
                                Surface(Modifier.fillMaxSize()) {
                                SettingsPanel(prefs, change = { revision++; applySettings(true) }, close = { settings = false }, whatsapp = { external("https://wa.me/967781764759") }, diagnostics = diagnostics(),
                                    reload = { settings = false; web.loadUrl("https://m.facebook.com/") },
                                    testDisplay = { settings = false; showDisplayTest() },
                                    copyColorDiagnostics = {
                                        web.evaluateJavascript("window.__fpro ? JSON.stringify(window.__fpro.colorReport()) : null") { result ->
                                            try {
                                                val report = JSONArray("[$result]").getString(0)
                                                if (report == "null") toast("انتظر اكتمال تحميل فيسبوك ثم أعد المحاولة")
                                                else {
                                                    getSystemService(android.content.ClipboardManager::class.java).setPrimaryClip(android.content.ClipData.newPlainText("FPRO color report", report))
                                                    toast("تم نسخ وصف تقني للألوان فقط؛ دون نصوص أو صور أو روابط الحساب")
                                                }
                                            } catch (_: Exception) { toast("تعذر قراءة تشخيص التلوين؛ أعد فتح الصفحة") }
                                        }
                                    },
                                    copyDiagnostics = {
                                        getSystemService(android.content.ClipboardManager::class.java).setPrimaryClip(android.content.ClipData.newPlainText("FPRO diagnostics", diagnostics()))
                                        toast("تم نسخ التشخيص دون كوكيز أو كلمات مرور")
                                    })
                                }
                            }
                            if (splash && !pip) Splash()
                        }
                        BackHandler { smartBack() }
                        LaunchedEffect(Unit) {
                            // Begin network/bootstrap immediately, underneath the splash.
                            web.post {
                                if (savedInstanceState == null || web.restoreState(savedInstanceState) == null) {
                                    web.loadUrl("https://m.facebook.com/")
                                }
                            }
                        }
                        LaunchedEffect(Unit) {
                            delay(600)
                            splash = false
                        }
                        LaunchedEffect(Unit) {
                            delay(1200)
                            while (true) {
                                if (!settings && web.hasWindowFocus() && Navigation.isFacebook(web.url.orEmpty())) {
                                    web.evaluateJavascript(pageInfoQuery) { updateHomeControls(it) }
                                } else homeControls = false
                                // Player routes do not need frequent header-logo queries.
                                delay(if (homeControls) 650 else 1200)
                            }
                        }
                        // Native watchdog: it must NOT wait for a JavaScript callback to
                        // report a stalled renderer, or depend on onPageStarted firing.
                        LaunchedEffect(settings, revision) { configurePictureInPicture() }
                        LaunchedEffect(pageSequence) {
                            delay(24_000)
                            if (!pageConfirmed) web.evaluateJavascript("(function(){return !!document.body && document.body.innerText.replace(/\\s/g,'').length > 30;})()") { result -> pageConfirmed = result == "true" }
                            delay(1_000)
                            if (!pageConfirmed && failure == null) failure = "لم يؤكد محرك الويب عرض محتوى الصفحة. افتح الإعدادات ثم اختبار العرض لتمييز خلل المحرك من اتصال فيسبوك.\n${diagnostics()}"
                        }
                    }
                }
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun createWebView(): WebView = WebView(this).apply {
        layoutDirection = View.LAYOUT_DIRECTION_LTR
        setOnScrollChangeListener { _, _, y, _, _ -> if (y >= 4) homeControls = false }
        isLongClickable = true // Preserve WebView native text-selection ActionMode.
        // Boolean-only playback hint; never exposes files, text, cookies or intents.
        addJavascriptInterface(object {
            @JavascriptInterface fun playing(value: Boolean) {
                runOnUiThread {
                    if (!isDestroyed && Navigation.isFacebook(this@apply.url.orEmpty())) updatePlaybackState(value)
                }
            }
        }, "FproPlayback")
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.allowFileAccess = false
        settings.allowContentAccess = false
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
        settings.mediaPlaybackRequiresUserGesture = true
        settings.setSupportMultipleWindows(false)
        CookieManager.getInstance().setAcceptCookie(true)
        webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean = route(request.url, request.isForMainFrame)
            @Deprecated("Required for Android 6")
            override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean = route(Uri.parse(url), true)
            override fun onPageStarted(view: WebView, url: String?, favicon: Bitmap?) {
                failure = null
                homeControls = false
                updatePlaybackState(false)
                pageConfirmed = false
                loadingProgress = 1
                enhancementsInstalled = false
                pageSequence++
                loadState = "بدء تحميل: $url"
            }
            override fun onPageCommitVisible(view: WebView, url: String?) {
                // Install lightweight filters once real content has committed;
                // do not wait for all Facebook resources or reload the player.
                if (Navigation.isFacebook(url.orEmpty())) inject()
            }
            override fun onPageFinished(view: WebView, url: String?) {
                CookieManager.getInstance().flush()
                loadingProgress = 100
                loadState = "انتهى التحميل: $url"
                // Do not probe or mutate the DOM while Facebook's bootstrap is
                // still initializing. The independent watchdog reads it later.
                val engineMajor = Regex("Chrome/(\\d+)").find(mobileAgent)?.groupValues?.get(1)?.toIntOrNull()
                if (Navigation.isFacebook(url.orEmpty()) && engineMajor != null && engineMajor < 80) {
                    failure = "محرك Android System WebView قديم (Chromium $engineMajor) ولا يدعم صياغة JavaScript الحديثة. حدّث WebView أو Chrome من متجر التطبيقات ثم أعد فتح FPRO.\n${diagnostics()}"
                }
                web.evaluateJavascript(pageInfoScript) { updateHomeControls(it) }
                inject()
            }
            override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
                if (request.isForMainFrame) failure = "تعذّر تحميل الصفحة: ${error.description} (رمز ${error.errorCode}). تحقق من الاتصال وحدّث Android System WebView."
            }
            override fun onReceivedHttpError(view: WebView, request: WebResourceRequest, response: WebResourceResponse) {
                if (request.isForMainFrame) failure = "استجاب الموقع بخطأ ${response.statusCode}"
            }
            override fun onReceivedSslError(view: WebView, handler: SslErrorHandler, error: android.net.http.SslError) {
                handler.cancel()
                failure = "تعذّر التحقق من شهادة الاتصال الآمن (${error.primaryError}). تحقق من تاريخ الجهاز والشبكة؛ لن يتم تجاوز حماية TLS."
            }
        }
        webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView, newProgress: Int) { this@MainActivity.loadingProgress = newProgress }
            override fun onShowFileChooser(view: WebView, callback: ValueCallback<Array<Uri>>, params: FileChooserParams): Boolean {
                fileCallback?.onReceiveValue(null); fileCallback = callback
                return try { filePicker.launch(params.createIntent()); true } catch (_: ActivityNotFoundException) { fileCallback = null; false }
            }
            override fun onPermissionRequest(request: PermissionRequest) { request.deny() }
            override fun onShowCustomView(view: View, callback: CustomViewCallback) {
                if (fullView != null) { callback.onCustomViewHidden(); return }
                web.evaluateJavascript("window.__fproNativeFullscreen=true", null)
                fullView = view; fullCallback = callback
                (window.decorView as ViewGroup).addView(view, FrameLayout.LayoutParams(-1,-1))
                systemBars(true)
            }
            override fun onHideCustomView() { closeFullscreen() }
            override fun onCreateWindow(view: WebView, isDialog: Boolean, isUserGesture: Boolean, resultMsg: android.os.Message): Boolean {
                if (!isUserGesture) return false
                val child = WebView(this@MainActivity)
                child.webViewClient = object : WebViewClient() {
                    @Deprecated("Popup compatibility")
                    override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean {
                        if (Navigation.isFacebook(url)) web.loadUrl(url) else external(url)
                        child.destroy(); return true
                    }
                }
                (resultMsg.obj as WebView.WebViewTransport).webView = child
                resultMsg.sendToTarget(); return true
            }
        }
        setDownloadListener { url, _, _, _, _ -> sendToDownloader(url, this.url.orEmpty()) }
    }

    private fun route(uri: Uri, mainFrame: Boolean): Boolean {
        if (uri.scheme == "fpro") {
            if (mainFrame && Navigation.isFacebook(web.url ?: "") && uri.host == "fullscreen-error") {
                toast("تعذّر فتح ملء الشاشة؛ جرّب زر ملء الشاشة الأصلي للفيديو")
            }
            if (mainFrame && Navigation.isFacebook(web.url ?: "") && uri.host == "download") {
                sendToDownloader(uri.getQueryParameter("media").orEmpty(), uri.getQueryParameter("link").orEmpty())
            }
            return true
        }
        // Subframes are part of the page, not user navigation. Blocking non-Facebook
        // HTTPS frames breaks embedded authentication/media supplied by other hosts.
        if (!mainFrame) return !Navigation.allowEmbedded(uri.toString())
        if (Navigation.isFacebook(uri.toString())) return false
        external(uri.toString())
        return true
    }

    private fun external(url: String) {
        val uri = Uri.parse(url)
        if (uri.scheme !in listOf("https", "http", "mailto", "tel")) { toast("نوع رابط غير مدعوم"); return }
        try { startActivity(Intent(Intent.ACTION_VIEW, uri).addCategory(Intent.CATEGORY_BROWSABLE)) }
        catch (_: ActivityNotFoundException) { toast("لا يوجد تطبيق مناسب لفتح الرابط") }
    }

    private fun sendToDownloader(mediaUrl: String, pageUrl: String) {
        if (!Navigation.isFacebook(web.url.orEmpty())) { toast("يلزم فتح الفيديو في فيسبوك"); return }
        val pkg = prefs.text("package", "com.junkfood.seal").trim()
        if (pkg.isBlank()) {
            toast("حدّد حزمة تطبيق التنزيل أولاً في الإعدادات")
            settings = true
            return
        }
        if (!Regex("[A-Za-z_][A-Za-z0-9_]*(\\.[A-Za-z_][A-Za-z0-9_]*)+").matches(pkg)) {
            toast("اسم حزمة تطبيق التنزيل غير صحيح")
            return
        }
        // A package-targeted handoff: no internal downloader and no chooser.
        // The receiving app owns its window; this does not embed its UI in FPRO.
        // Send an available media URL, otherwise let the downloader parse the
        // Facebook permalink. Never export browser cookies or login credentials.
        val source = Navigation.downloadSource(mediaUrl, pageUrl)
        if (source == null) {
            toast("لم يتوفر رابط موثوق للفيديو الحالي بعد؛ لن نستخدم رابط الفيديو الأول")
            return
        }
        val intent = Intent(Intent.ACTION_SEND).setType("text/plain")
            .putExtra(Intent.EXTRA_TEXT, source).setPackage(pkg)
            .addFlags(Intent.FLAG_ACTIVITY_NO_USER_ACTION) // The quick dialog is not a Home/PiP request.
        // Seal exports both MainActivity and the floating quick-download UI.
        // Resolve its documented quick Activity explicitly, never its launcher.
        val receiver = if (pkg == "com.junkfood.seal") {
            val quick = ComponentName(pkg, "com.junkfood.seal.QuickDownloadActivity")
            try {
                val info = packageManager.getActivityInfo(quick, 0)
                if (info.exported && info.enabled && (info.applicationInfo?.enabled == true)) quick else null
            } catch (_: android.content.pm.PackageManager.NameNotFoundException) { null }
        } else intent.resolveActivity(packageManager)
        if (receiver == null || receiver.packageName != pkg) {
            toast("لا توجد واجهة تنزيل محددة لهذه الحزمة؛ يلزم التحقق من التطبيق وطريقة تكامله")
            return
        }
        intent.component = receiver // Never fall through to Android's share chooser.
        try { externalHandoff = true; configurePictureInPicture(); startActivity(intent) }
        catch (_: ActivityNotFoundException) { externalHandoff = false; configurePictureInPicture(); toast("التطبيق المحدد غير مثبت أو لا يدعم استقبال روابط التنزيل") }
        catch (_: SecurityException) { externalHandoff = false; configurePictureInPicture(); toast("تطبيق التنزيل لا يسمح بفتح هذه الواجهة") }
    }

    private fun updateHomeControls(result: String?) {
        try {
            if (result == null || result == "null") { homeControls = false; return }
            val data = org.json.JSONObject(JSONArray("[$result]").getString(0))
            homeControls = data.optBoolean("gearVisible", data.optBoolean("home")) && web.scrollY < 4
            val scale = web.width / data.optDouble("width", 1.0).coerceAtLeast(1.0)
            gearX = (data.optDouble("x") * scale).toFloat().coerceIn(0f, web.width.toFloat())
            gearY = (data.optDouble("y") * scale).toFloat().coerceAtLeast(0f)
        } catch (_: Exception) { homeControls = false }
    }

    private fun applySettings(reloadDesktop: Boolean) {
        web.setLayerType(if (prefs.flag("software")) View.LAYER_TYPE_SOFTWARE else View.LAYER_TYPE_NONE, null)
        val compatibleAgent = if (prefs.flag("browserAgent")) Navigation.browserAgent(mobileAgent) else mobileAgent
        val agent = if (prefs.flag("desktop")) "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" else compatibleAgent
        val cookieManager = CookieManager.getInstance()
        val allowEmbeddedCookies = prefs.flag("thirdPartyCookies", true)
        val cookiesChanged = cookieManager.acceptThirdPartyCookies(web) != allowEmbeddedCookies
        cookieManager.setAcceptThirdPartyCookies(web, allowEmbeddedCookies)
        val changed = web.settings.userAgentString != agent
        web.settings.userAgentString = agent
        web.settings.setSupportZoom(prefs.flag("zoom"))
        web.settings.builtInZoomControls = prefs.flag("zoom")
        web.settings.displayZoomControls = false
        // Mobile pages need a device-width viewport, not a scaled desktop canvas.
        web.settings.useWideViewPort = prefs.flag("desktop")
        web.settings.loadWithOverviewMode = prefs.flag("desktop")
        systemBars(prefs.flag("immersive"))
        configurePictureInPicture()
        if (reloadDesktop && (changed || cookiesChanged)) web.reload() else inject()
    }

    private fun diagnostics(): String {
        val provider = if (Build.VERSION.SDK_INT >= 26) WebView.getCurrentWebViewPackage()?.let { "${it.packageName} ${it.versionName}" } else null
        return "FPRO code 24 / Android ${Build.VERSION.RELEASE}\n${provider ?: mobileAgent}\n$loadState\nURL: ${web.url}\nProgress: $loadingProgress / Size: ${web.width}x${web.height} / Attached: ${web.isAttachedToWindow}\nSoftware: ${prefs.flag("software")}"
    }

    private fun showDisplayTest() {
        web.stopLoading()
        failure = null
        pageConfirmed = false
        pageSequence++
        loadState = "اختبار محلي بلا إنترنت"
        web.loadDataWithBaseURL("https://fpro.invalid/", """
            <!doctype html><html dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
            <body style="margin:0;background:#14b450;color:#101010;font:22px sans-serif;padding:70px 24px;min-height:100vh;box-sizing:border-box">
            <h1>اختبار عرض WebView</h1><p>هذه صفحة تشخيص محلية وليست فيسبوك. ظهور الخلفية الخضراء وهذا النص يؤكد أن المحرك يرسم المحتوى.</p>
            <p id="js">JavaScript لم يعمل بعد</p><script>document.getElementById('js').textContent='JavaScript يعمل';document.body.dataset.ready='yes';</script>
            <a href="https://m.facebook.com/">فتح فيسبوك الحقيقي</a></body></html>
        """.trimIndent(), "text/html", "UTF-8", null)
    }

    private fun inject() {
        // The independent double-tap shortcut uses only delegated listeners.
        // DOM filters/styles still require the page-enhancement master switch.
        val enhance = prefs.flag("pageEnhancements")
        if (!enhance) {
            if (enhancementsInstalled) {
                enhancementsInstalled = false
                web.reload() // restore the original page and remove all old hooks
                return
            }
        }
        if (!Navigation.isFacebook(web.url ?: "")) return
        enhancementsInstalled = enhance
        web.evaluateJavascript(script.replace("__CONFIG__", prefs.scriptConfig()), null)
        if (enhance && prefs.flag("liveColor")) web.evaluateJavascript("document.querySelector('meta[name=\"theme-color\"]')?.content || getComputedStyle(document.body).backgroundColor") { result ->
            try {
                val value = JSONArray("[$result]").getString(0)
                val parsed = if (value.startsWith("rgb")) {
                    val parts = Regex("\\d+").findAll(value).map { it.value.toInt() }.toList()
                    android.graphics.Color.rgb(parts[0], parts[1], parts[2])
                } else android.graphics.Color.parseColor(value)
                pageColor = Color(parsed)
            } catch (_: Exception) { /* Keep safe default. */ }
        }
    }

    private fun smartBack() {
        when {
            settings -> settings = false
            fullView != null -> closeFullscreen()
            else -> web.evaluateJavascript("""
                (()=>{
                  if(document.fullscreenElement){document.exitFullscreen();return 'closed';}
                  const dialog=document.querySelector('[role="dialog"]');
                  const close=dialog?.querySelector('[aria-label="Close"],[aria-label="إغلاق"]');
                  if(close){close.click();return 'closed';}
                  if(window.scrollY>80){window.scrollTo({top:0,behavior:'smooth'});return 'scrolled';}
                  return 'back';
                })()
            """.trimIndent()) { result ->
                if (result == "\"back\"") {
                    if (web.url?.contains("/messages") == true) web.loadUrl("https://m.facebook.com/")
                    else if (web.canGoBack()) web.goBack() else finish()
                }
            }
        }
    }

    private fun closeFullscreen() {
        web.evaluateJavascript("window.__fproNativeFullscreen=false", null)
        fullView?.let { (it.parent as? ViewGroup)?.removeView(it) }; fullView = null
        fullCallback?.onCustomViewHidden(); fullCallback = null
        systemBars(prefs.flag("immersive"))
    }
    private fun systemBars(hide: Boolean) {
        WindowInsetsControllerCompat(window, window.decorView).apply {
            systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            if (hide) hide(WindowInsetsCompat.Type.systemBars()) else show(WindowInsetsCompat.Type.systemBars())
        }
    }
    private fun updatePlaybackState(playing: Boolean) {
        if (mediaPlaying == playing) return
        mediaPlaying = playing
        configurePictureInPicture()
    }
    private fun canEnterPip(): Boolean = Build.VERSION.SDK_INT >= 26 &&
        packageManager.hasSystemFeature(android.content.pm.PackageManager.FEATURE_PICTURE_IN_PICTURE) &&
        prefs.flag("pip") && mediaPlaying && !settings && !externalHandoff && !isFinishing && !isDestroyed

    private fun configurePictureInPicture() {
        if (Build.VERSION.SDK_INT < 26 || !packageManager.hasSystemFeature(android.content.pm.PackageManager.FEATURE_PICTURE_IN_PICTURE)) return
        try {
            val params = PictureInPictureParams.Builder().setAspectRatio(Rational(16, 9))
            if (Build.VERSION.SDK_INT >= 31) params.setAutoEnterEnabled(canEnterPip())
            setPictureInPictureParams(params.build())
        } catch (_: IllegalStateException) { /* Unsupported window state; normal playback remains. */ }
    }
    override fun onUserLeaveHint() {
        super.onUserLeaveHint()
        // Android12+ auto-entry is armed BEFORE Home. Older versions need a
        // synchronous request; querying JavaScript here races onStop/web.onPause.
        if (Build.VERSION.SDK_INT in 26..30 && canEnterPip()) try {
            pipRequested = enterPictureInPictureMode(PictureInPictureParams.Builder().setAspectRatio(Rational(16,9)).build())
        } catch (_: IllegalStateException) { pipRequested = false; toast("الصورة داخل صورة غير متاحة") }
    }
    override fun onPictureInPictureModeChanged(isInPictureInPictureMode: Boolean, newConfig: Configuration) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig)
        pip = isInPictureInPictureMode; pipRequested = false
        if (pip) web.onResume()
    }
    override fun onResume() {
        super.onResume()
        externalHandoff = false; pipRequested = false
        if (::web.isInitialized) { web.onResume(); configurePictureInPicture() }
    }
    override fun onStop() {
        if (!pip && !pipRequested && !(Build.VERSION.SDK_INT >= 26 && isInPictureInPictureMode)) web.onPause()
        super.onStop()
    }
    override fun onSaveInstanceState(outState: Bundle) { web.saveState(outState); super.onSaveInstanceState(outState) }
    override fun onDestroy() {
        closeFullscreen(); fileCallback?.onReceiveValue(null); fileCallback = null
        web.removeJavascriptInterface("FproPlayback")
        (web.parent as? ViewGroup)?.removeView(web); web.stopLoading(); web.destroy(); super.onDestroy()
    }
    private fun toast(message: String) { Toast.makeText(this, message, Toast.LENGTH_LONG).show() }


}

@Composable
private fun Splash() {
    val transition = rememberInfiniteTransition(label = "splash")
    val phase by transition.animateFloat(initialValue = 0f, targetValue = 5f, animationSpec = infiniteRepeatable(tween(900, easing = LinearEasing)), label = "dots")
    Column(Modifier.fillMaxSize().background(Color(0xFF101013)), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
        Text("F", color = Color(0xFFD4AF37), style = MaterialTheme.typography.displayLarge)
        Text("FPRO", color = Color(0xFFD4AF37), style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(30.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            repeat(5) { index -> Box(Modifier.size(9.dp).background(Color(0xFFD4AF37).copy(alpha = if (phase.toInt() == index) 1f else .25f), CircleShape)) }
        }
    }
}
