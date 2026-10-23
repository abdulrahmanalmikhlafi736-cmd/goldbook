package com.almekhlafi.FPRO

import android.annotation.SuppressLint
import android.app.PictureInPictureParams
import android.app.DownloadManager
import android.content.ActivityNotFoundException
import android.content.Intent
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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.platform.ComposeView
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import kotlinx.coroutines.delay
import org.json.JSONArray

class MainActivity : ComponentActivity() {
    private lateinit var prefs: Preferences
    private lateinit var downloads: DownloadStore
    private lateinit var web: WebView
    private var settings by mutableStateOf(false)
    private var downloadPanel by mutableStateOf(false)
    private var loadingProgress by mutableIntStateOf(0)
    private var revision by mutableIntStateOf(0)
    private var splash by mutableStateOf(true)
    private var pip by mutableStateOf(false)
    private var pageSequence by mutableIntStateOf(0)
    private var pageConfirmed = false
    private var enhancementsInstalled = false
    private var loadState by mutableStateOf("تهيئة محرك الويب")
    private var failure by mutableStateOf<String?>(null)
    private var media by mutableStateOf<Pair<String,String>?>(null)
    private var pageColor by mutableStateOf(Color(0xFF1877F2))
    private var fullView: View? = null
    private var fullCallback: WebChromeClient.CustomViewCallback? = null
    private var fileCallback: ValueCallback<Array<Uri>>? = null
    private val filePicker = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        fileCallback?.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result.resultCode, result.data)); fileCallback = null
    }
    private val mobileAgent by lazy { WebSettings.getDefaultUserAgent(this) }
    private val script by lazy { assets.open("facebook.js").bufferedReader().use { it.readText() } }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        prefs = Preferences(this); downloads = DownloadStore(this)
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
                                FilledTonalIconButton(
                                    onClick = { settings = true },
                                    modifier = Modifier.align(Alignment.TopEnd).padding(8.dp).size(44.dp)
                                ) { Text("⚙", style = MaterialTheme.typography.headlineSmall) }
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
                            if (settings && !pip) Surface(Modifier.fillMaxSize()) {
                                SettingsPanel(prefs, change = { revision++; applySettings(true) }, close = { settings = false }, whatsapp = { external("https://wa.me/967781764759") }, downloads = { downloadPanel = true }, diagnostics = diagnostics(),
                                    reload = { settings = false; web.loadUrl("https://m.facebook.com/") },
                                    testDisplay = { settings = false; showDisplayTest() },
                                    copyDiagnostics = {
                                        getSystemService(android.content.ClipboardManager::class.java).setPrimaryClip(android.content.ClipData.newPlainText("FPRO diagnostics", diagnostics()))
                                        toast("تم نسخ التشخيص دون كوكيز أو كلمات مرور")
                                    })
                            }
                            if (splash && !pip) Splash()
                        }
                        if (downloadPanel && !pip) DownloadDialog()
                        media?.let { request ->
                            AlertDialog(onDismissRequest = { media = null }, title = { Text("تنزيل الفيديو") }, text = {
                                Text("يمكن تنزيل المصدر المباشر إن أتاحه الموقع. المشاركة إلى التطبيق المحدد تفتح ذلك التطبيق خارج FPRO. استخدم المحتوى الذي تملك إذناً بتنزيله فقط.")
                            }, confirmButton = {
                                TextButton(onClick = {
                                    media = null
                                    if (!request.first.startsWith("https://")) toast("المصدر مجزأ أو محمي؛ لا يتوفر رابط تنزيل مباشر")
                                    else try { downloads.enqueue(request.first, web.settings.userAgentString); downloadPanel = true } catch (_: Exception) { toast("تعذّر بدء التنزيل") }
                                }) { Text("تنزيل داخلي") }
                            }, dismissButton = {
                                TextButton(onClick = { media = null; share(request.second) }) { Text("مشاركة الرابط خارجياً") }
                            })
                        }
                        BackHandler { smartBack() }
                        LaunchedEffect(Unit) {
                            delay(1800)
                            splash = false
                            web.post {
                                if (savedInstanceState == null || web.restoreState(savedInstanceState) == null) {
                                    web.loadUrl("https://m.facebook.com/")
                                }
                            }
                        }
                        // Native watchdog: it must NOT wait for a JavaScript callback to
                        // report a stalled renderer, or depend on onPageStarted firing.
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
                pageConfirmed = false
                enhancementsInstalled = false
                pageSequence++
                loadState = "بدء تحميل: $url"
            }
            override fun onPageFinished(view: WebView, url: String?) {
                CookieManager.getInstance().flush()
                loadState = "انتهى التحميل: $url"
                // Do not probe or mutate the DOM while Facebook's bootstrap is
                // still initializing. The independent watchdog reads it later.
                val engineMajor = Regex("Chrome/(\\d+)").find(mobileAgent)?.groupValues?.get(1)?.toIntOrNull()
                if (Navigation.isFacebook(url.orEmpty()) && engineMajor != null && engineMajor < 80) {
                    failure = "محرك Android System WebView قديم (Chromium $engineMajor) ولا يدعم صياغة JavaScript الحديثة. حدّث WebView أو Chrome من متجر التطبيقات ثم أعد فتح FPRO.\n${diagnostics()}"
                }
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
        setDownloadListener { url, _, _, _, _ -> media = url to (this.url ?: "https://m.facebook.com/") }
    }

    private fun route(uri: Uri, mainFrame: Boolean): Boolean {
        if (uri.scheme == "fpro") {
            if (mainFrame && Navigation.isFacebook(web.url ?: "") && uri.host == "download") {
                media = (uri.getQueryParameter("media") ?: "") to (uri.getQueryParameter("link") ?: web.url.orEmpty())
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

    private fun share(url: String) {
        if (!Navigation.isFacebook(url)) { toast("يلزم رابط منشور على فيسبوك"); return }
        val intent = Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, url)
        val pkg = prefs.text("package").trim()
        try {
            if (pkg.isNotBlank()) startActivity(intent.setPackage(pkg))
            else startActivity(Intent.createChooser(intent, "مشاركة رابط الفيديو"))
        } catch (_: ActivityNotFoundException) { toast("التطبيق المحدد غير مثبت أو لا يدعم مشاركة الروابط") }
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
        if (reloadDesktop && (changed || cookiesChanged)) web.reload() else inject()
    }

    private fun diagnostics(): String {
        val provider = if (Build.VERSION.SDK_INT >= 26) WebView.getCurrentWebViewPackage()?.let { "${it.packageName} ${it.versionName}" } else null
        return "FPRO code 7 / Android ${Build.VERSION.RELEASE}\n${provider ?: mobileAgent}\n$loadState\nURL: ${web.url}\nProgress: $loadingProgress / Size: ${web.width}x${web.height} / Attached: ${web.isAttachedToWindow}\nSoftware: ${prefs.flag("software")}"
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
        // A clean Facebook session must not run our DOM observer or rewrite any
        // styles until the user explicitly opts in to page modifications.
        if (!prefs.flag("pageEnhancements")) {
            if (enhancementsInstalled) {
                enhancementsInstalled = false
                web.reload() // restore the original page and remove all old hooks
            }
            return
        }
        if (!Navigation.isFacebook(web.url ?: "")) return
        enhancementsInstalled = true
        web.evaluateJavascript(script.replace("__CONFIG__", prefs.scriptConfig()), null)
        if (prefs.flag("liveColor")) web.evaluateJavascript("document.querySelector('meta[name=\"theme-color\"]')?.content || getComputedStyle(document.body).backgroundColor") { result ->
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
            downloadPanel -> downloadPanel = false
            media != null -> media = null
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
    override fun onUserLeaveHint() {
        super.onUserLeaveHint()
        if (Build.VERSION.SDK_INT >= 26 && prefs.flag("pip") && !settings && !downloadPanel) {
            web.evaluateJavascript("Array.from(document.querySelectorAll('video')).some(v=>!v.paused&&!v.ended)") { playing ->
                if (playing == "true" && !isFinishing && !isDestroyed) try {
                    enterPictureInPictureMode(PictureInPictureParams.Builder().setAspectRatio(Rational(16,9)).build())
                } catch (_: IllegalStateException) { toast("الصورة داخل صورة غير متاحة") }
            }
        }
    }
    override fun onPictureInPictureModeChanged(isInPictureInPictureMode: Boolean, newConfig: Configuration) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig); pip = isInPictureInPictureMode
    }
    override fun onResume() { super.onResume(); if (::web.isInitialized) web.onResume() }
    override fun onStop() { if (!pip) web.onPause(); super.onStop() }
    override fun onSaveInstanceState(outState: Bundle) { web.saveState(outState); super.onSaveInstanceState(outState) }
    override fun onDestroy() {
        closeFullscreen(); fileCallback?.onReceiveValue(null); fileCallback = null
        (web.parent as? ViewGroup)?.removeView(web); web.stopLoading(); web.destroy(); super.onDestroy()
    }
    private fun toast(message: String) { Toast.makeText(this, message, Toast.LENGTH_LONG).show() }

    @Composable
    private fun DownloadDialog() {
        var items by remember { mutableStateOf(emptyList<DownloadStore.Item>()) }
        LaunchedEffect(Unit) { while (true) { items = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) { downloads.list() }; delay(1000) } }
        AlertDialog(onDismissRequest = { downloadPanel = false }, title = { Text("التنزيلات الداخلية") }, text = {
            androidx.compose.foundation.lazy.LazyColumn(Modifier.heightIn(max = 440.dp)) {
                if (items.isEmpty()) item { Text("لا توجد تنزيلات. اضغط ↓ على فيديو لبدء التنزيل.") }
                items(items.size, key = { items[it].id }) { index ->
                    val item = items[index]
                    Column(Modifier.padding(vertical = 8.dp)) {
                        Text(item.title)
                        val status = when(item.status) {
                            DownloadManager.STATUS_SUCCESSFUL -> "اكتمل"
                            DownloadManager.STATUS_FAILED -> "فشل: المصدر منتهي الصلاحية أو غير مدعوم"
                            DownloadManager.STATUS_PAUSED -> "متوقف مؤقتاً بواسطة النظام"
                            else -> "${item.progress}%"
                        }
                        Text(status, style = MaterialTheme.typography.bodySmall)
                        LinearProgressIndicator(progress = { item.progress / 100f }, modifier = Modifier.fillMaxWidth())
                        Row {
                            if (item.status == DownloadManager.STATUS_SUCCESSFUL) TextButton(onClick = { try { downloads.open(item.id) } catch (_: Exception) { toast("لا يوجد مشغل متاح") } }) { Text("فتح") }
                            TextButton(onClick = { downloads.remove(item.id) }) { Text("حذف / إلغاء") }
                        }
                    }
                }
            }
        }, confirmButton = { TextButton(onClick = { downloadPanel = false }) { Text("إغلاق") } })
    }
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
