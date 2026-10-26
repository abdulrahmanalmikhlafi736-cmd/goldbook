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
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.withTimeoutOrNull
import kotlinx.coroutines.delay
import org.json.JSONArray

class MainActivity : ComponentActivity(), AudioPlaybackService.Controls {
    companion object { const val AUDIO_MODE = "com.almekhlafi.FPRO.AUDIO_MODE"; const val VIDEO_MODE = "com.almekhlafi.FPRO.VIDEO_MODE" }
    private var audioOnly = false
    private var audioRequested = false
    private var earlyScript: androidx.webkit.ScriptHandler? = null
    private val audioPermission = registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted -> if(granted)startAudioOnly() else toast("يلزم السماح بإشعار التحكم للتشغيل الصوتي") }
    private lateinit var prefs: Preferences
    private lateinit var web: WebView
    private lateinit var browserRoot: FrameLayout
    private var messageBridgeInstalled = false
    private val recoveryPolicy = RendererRecoveryPolicy()
    private var rendererRecoveries = 0
    private var lastGeometryAt = 0L
    private var pipRect: android.graphics.Rect? = null
    private var pipRatio = Rational(16, 9)
    private val headerQueries = SingleFlightQuery()
    private val readinessQueries = SingleFlightQuery()
    private val positionQueries = SingleFlightQuery()
    private lateinit var sessions: BrowsingSessionStore
    private var lastPosition: String? = null
    private var pendingPosition: String? = null
    private var resumeRestoreUntil = 0L
    private var sessionClosing = false
    private val positionScript by lazy { assets.open("browsing-position.js").bufferedReader().use { it.readText() } }
    private val readyScript by lazy { assets.open("page-ready.js").bufferedReader().use { it.readText() } }

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
    private var fullscreenSensorAvailable = false
    private var fullscreenLastAngle = android.view.OrientationEventListener.ORIENTATION_UNKNOWN
    private var fullscreenRotation: FullscreenRotationGate? = null
    private var fullscreenOrientationListener: android.view.OrientationEventListener? = null
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
    private val script by lazy { assets.open("reference-engines.js").bufferedReader().use { it.readText() } + "\n" + assets.open("audio-mode.js").bufferedReader().use { it.readText() } + "\n" + assets.open("facebook.js").bufferedReader().use { it.readText() } }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        prefs = Preferences(this)
        sessions = BrowsingSessionStore(this)
        // Draw a native first frame while async startup runs. No WebView API here.
        val waiting = android.widget.TextView(this).apply {
            text = "تهيئة محرك التصفح…"; gravity = android.view.Gravity.CENTER
            setTextColor(android.graphics.Color.WHITE); setBackgroundColor(android.graphics.Color.BLACK)
        }
        setContentView(waiting)
        lifecycleScope.launch {
            val outcome = withTimeoutOrNull(20_000) {
                (application as FproApplication).webViewStartup.filterNotNull().first()
            }
            if (outcome == "") initializeBrowser(savedInstanceState)
            else waiting.text = "تعذرت تهيئة محرك التصفح. حدّث Android System WebView ثم أعد فتح التطبيق."
        }
    }

    private fun initializeBrowser(savedInstanceState: Bundle?) {
        if (isDestroyed || isFinishing) return
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)
        web = createWebView()
        WindowCompat.setDecorFitsSystemWindows(window, true)
        applySettings(false)
        // Keep Chromium in a real native view hierarchy, matching the working
        // browser baseline. Compose draws only transparent controls above it;
        // no AndroidView render-node interop is involved in website painting.
        val controls = ComposeView(this)
        browserRoot = FrameLayout(this).apply {
            addView(web, FrameLayout.LayoutParams(-1, -1))
            addView(controls, FrameLayout.LayoutParams(-1, -1))
        }
        setContentView(browserRoot)
        // Navigation belongs to this Activity/WebView, never to a restartable
        // Compose effect. Reattaching/recomposing controls must not restore/reload.
        web.post {
            val remembered = if (prefs.flag("rememberPosition", true)) sessions.read() else null
            pendingPosition = if (prefs.flag("rememberPosition", true)) savedInstanceState?.getString("fpro.position") ?: remembered?.position else null
            lastPosition = pendingPosition
            val history = savedInstanceState ?: remembered?.history
            if (history == null || web.restoreState(history) == null) {
                web.loadUrl(remembered?.url ?: "https://m.facebook.com/")
            }
        }
        controls.setContent {
            @Suppress("UNUSED_VARIABLE") val themeRevision = revision
            val dark = prefs.flag("dark") || prefs.flag("amoled")
            val baseScheme = when {
                prefs.flag("dynamic") && Build.VERSION.SDK_INT >= 31 -> if (dark) dynamicDarkColorScheme(this) else dynamicLightColorScheme(this)
                dark -> darkColorScheme(primary = Color(0xFFD4AF37), background = if (prefs.flag("amoled")) Color.Black else Color(0xFF18191A))
                else -> lightColorScheme(primary = Color(0xFF1877F2))
            }
            val scheme = if(prefs.flag("amoled"))baseScheme.copy(surfaceTint=Color.Transparent, background=Color.Black, surface=Color.Black, surfaceDim=Color.Black, surfaceBright=Color.Black, surfaceContainer=Color.Black, surfaceContainerLow=Color.Black, surfaceContainerLowest=Color.Black, surfaceContainerHigh=Color.Black, surfaceContainerHighest=Color.Black) else baseScheme
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
                                // Diagnostic build: one explicit capture on the current Reel.
                                // No automatic recording, upload or account-content export.
                                if (!settings && !splash && prefs.flag("mediaDiagnostics")) FilledTonalButton(
                                    onClick = { copyMediaLayoutReport() },
                                    modifier = Modifier.align(Alignment.TopStart).padding(start = 8.dp, top = 64.dp)
                                ) { Text("نسخ تشخيص الشريط") }
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
                                SettingsPanel(prefs, audioOnly = { requestAudioOnly() }, change = { revision++; applySettings(true) }, close = { settings = false }, whatsapp = { external("https://wa.me/967781764759") }, diagnostics = diagnostics(),
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
                        LaunchedEffect(pageSequence) {
                            // Do not expose an empty Chromium surface after a fixed 600ms.
                            val started = android.os.SystemClock.elapsedRealtime()
                            while (splash) {
                                if (failure != null) { splash = false; break }
                                if (android.os.SystemClock.elapsedRealtime() - started > 25_000) {
                                    failure = "تأخر ظهور محتوى فيسبوك. تحقق من الاتصال ثم اختر إعادة المحاولة؛ لم نعد تحميل الصفحة تلقائيًا."
                                    splash = false; break
                                }
                                val readyTicket = readinessQueries.begin()
                                if (readyTicket != null) web.evaluateJavascript(readyScript) { ready ->
                                    if (!readinessQueries.complete(readyTicket)) return@evaluateJavascript
                                    if (ready == "true" && splash && !isDestroyed) {
                                        val sequence = pageSequence
                                        web.postVisualStateCallback(sequence.toLong(), object : WebView.VisualStateCallback() {
                                            override fun onComplete(requestId: Long) {
                                                if (!isDestroyed && sequence == pageSequence) { pageConfirmed = true; splash = false }
                                            }
                                        })
                                    }
                                }
                                delay(250)
                            }
                        }
                        LaunchedEffect(Unit) {
                            delay(1200)
                            while (true) {
                                if (!settings && web.hasWindowFocus() && Navigation.isFacebook(web.url.orEmpty())) {
                                    probePageInfo()
                                } else homeControls = false
                                // Player routes do not need frequent header-logo queries.
                                delay(if (homeControls) 650 else 1200)
                            }
                        }
                        LaunchedEffect(Unit) {
                            while (true) {
                                delay(15_000)
                                if (web.hasWindowFocus() && !splash) capturePosition(true)
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
    private inner class PlaybackWebView : WebView(this@MainActivity) {
        // A user-started foreground audio session must not be suspended merely
        // because Android hides this Activity's window (especially screen-off).
        override fun onWindowVisibilityChanged(visibility: Int) {
            super.onWindowVisibilityChanged(if(audioOnly) View.VISIBLE else visibility)
        }
        override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
            super.onSizeChanged(w, h, oldw, oldh)
            if (w > 0 && h > 0 && Navigation.isFacebook(url.orEmpty())) {
                evaluateJavascript(viewportScript(w, h) + "window.dispatchEvent(new Event('fproviewportchange'));", null)
            }
        }
        fun syncVisibility() { onWindowVisibilityChanged(windowVisibility) }
    }
    @SuppressLint("ClickableViewAccessibility")
    private fun createWebView(): WebView = PlaybackWebView().apply {
        layoutDirection = View.LAYOUT_DIRECTION_LTR
        // Observe without consuming gestures; a real touch cancels recovery.
        setOnTouchListener { _, event ->
            if (event.actionMasked == android.view.MotionEvent.ACTION_DOWN) {
                val cancellingRestore = resumeRestoreUntil > 0L || pendingPosition != null
                resumeRestoreUntil = 0L; pendingPosition = null
                if (cancellingRestore) evaluateJavascript("window.__fproPosition && window.__fproPosition.cancel()", null)
            }
            false
        }
        setOnScrollChangeListener { _, _, y, _, _ -> if (y >= 4) homeControls = false }
        isLongClickable = true // Preserve WebView native text-selection ActionMode.
        // No legacy interface fallback: unsupported providers use bounded page-info pulls.
        messageBridgeInstalled = androidx.webkit.WebViewFeature.isFeatureSupported(androidx.webkit.WebViewFeature.WEB_MESSAGE_LISTENER)
        if (messageBridgeInstalled) androidx.webkit.WebViewCompat.addWebMessageListener(
            this, "FproPlayback", setOf("https://facebook.com", "https://*.facebook.com", "https://messenger.com", "https://*.messenger.com")
        ) { sender, message, origin, mainFrame, _ ->
            if (mainFrame && origin.scheme == "https" && Navigation.isFacebook(origin.toString()) &&
                Navigation.isFacebook(sender.url.orEmpty()) && !isDestroyed && sender === web) {
                if (message.type == androidx.webkit.WebMessageCompat.TYPE_STRING) acceptPlaybackReport(message.data)
            }
        }
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
            override fun onRenderProcessGone(view: WebView, detail: RenderProcessGoneDetail): Boolean {
                recoverRenderer(view, detail.didCrash())
                return true
            }
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean = route(request.url, request.isForMainFrame)
            @Deprecated("Required for Android 6")
            override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean = route(Uri.parse(url), true)
            override fun onPageStarted(view: WebView, url: String?, favicon: Bitmap?) {
                headerQueries.invalidate(); readinessQueries.invalidate(); positionQueries.invalidate()
                failure = null
                pipRect = null; pipRatio = Rational(16, 9)
                if (Navigation.isFacebook(url.orEmpty()) && !BrowsingSessionStore.eligible(url.orEmpty())) {
                    lastPosition = null; pendingPosition = null; sessions.clear()
                } else if (resumeRestoreUntil > android.os.SystemClock.elapsedRealtime() && positionUrl(lastPosition) == url) {
                    pendingPosition = lastPosition
                }
                if (pendingPosition != null && positionUrl(pendingPosition) != url) pendingPosition = null
                homeControls = false
                if(audioOnly)stopAudioMode(true)
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
                // Start bounded position recovery at commit, not after every
                // remote image/tracker finishes; lazy content can arrive later.
                restorePosition()
            }
            override fun onPageFinished(view: WebView, url: String?) {
                CookieManager.getInstance().flush()
                restorePosition()
                loadingProgress = 100
                loadState = "انتهى التحميل: $url"
                // Do not probe or mutate the DOM while Facebook's bootstrap is
                // still initializing. The independent watchdog reads it later.
                val engineMajor = Regex("Chrome/(\\d+)").find(mobileAgent)?.groupValues?.get(1)?.toIntOrNull()
                if (Navigation.isFacebook(url.orEmpty()) && engineMajor != null && engineMajor < 80) {
                    failure = "محرك Android System WebView قديم (Chromium $engineMajor) ولا يدعم صياغة JavaScript الحديثة. حدّث WebView أو Chrome من متجر التطبيقات ثم أعد فتح FPRO.\n${diagnostics()}"
                }
                probePageInfo()
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
                startFullscreenRotation()
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
        if (!prefs.flag("rememberPosition", true)) {
            lastPosition = null; pendingPosition = null; resumeRestoreUntil = 0L; sessions.clear()
            web.evaluateJavascript("window.__fproPosition && window.__fproPosition.cancel()", null)
        }
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
        installEarlyScript()
        configurePictureInPicture()
        if (reloadDesktop && (changed || cookiesChanged)) web.reload() else inject()
    }

    private fun installEarlyScript() {
        earlyScript?.remove(); earlyScript = null
        if(androidx.webkit.WebViewFeature.isFeatureSupported(androidx.webkit.WebViewFeature.DOCUMENT_START_SCRIPT)) {
            val source = viewportScript(web.width, web.height) + script.replace("__CONFIG__", prefs.scriptConfig())
            val bootstrap = assets.open("early-start.js").bufferedReader().use { it.readText() }.replace("__FPRO_SOURCE__", source)
            earlyScript = androidx.webkit.WebViewCompat.addDocumentStartJavaScript(web, bootstrap, setOf("https://facebook.com", "https://*.facebook.com", "https://messenger.com", "https://*.messenger.com"))
        }
    }
    private fun requestAudioOnly() {
        if(Build.VERSION.SDK_INT >= 33 && checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) != android.content.pm.PackageManager.PERMISSION_GRANTED)audioPermission.launch(android.Manifest.permission.POST_NOTIFICATIONS) else startAudioOnly()
    }
    private fun startAudioOnly() {
        if(!Navigation.isFacebook(web.url.orEmpty())) { toast("افتح فيديو فيسبوك أولًا"); return }
        audioRequested = true
        web.settings.mediaPlaybackRequiresUserGesture = false // Explicit native audio action, not unrestricted page autoplay.
        web.evaluateJavascript("!!window.__fproAudio && window.__fproAudio.enable()") { enabled ->
            if(enabled != "true") { audioRequested = false; web.settings.mediaPlaybackRequiresUserGesture = true; web.evaluateJavascript("window.__fproAudio && window.__fproAudio.leavePip()", null); toast("شغّل الفيديو المطلوب أولًا ثم اختر الصوت فقط"); return@evaluateJavascript }
            audioOnly = true; audioRequested = false; web.evaluateJavascript("window.__fproAudio && window.__fproAudio.leavePip()", null); (web as PlaybackWebView).syncVisibility(); settings = false; AudioPlaybackService.controls = this
            val service = Intent(this, AudioPlaybackService::class.java).putExtra("playing", mediaPlaying)
            try {
                androidx.core.content.ContextCompat.startForegroundService(this, service)
                web.onResume(); configurePictureInPicture()
                web.post { moveTaskToBack(true) }
            } catch (_: RuntimeException) { stopAudioMode(false); toast("تعذر بدء خدمة الصوت؛ تحقق من أذونات النظام") }
        }
    }
    private fun stopAudioMode(pause: Boolean) {
        if(pause)mediaPlaying = false // Do not briefly re-arm PiP while JS pause is queued.
        audioOnly = false; audioRequested = false
        if(::web.isInitialized && !pip)web.settings.mediaPlaybackRequiresUserGesture = true
        if(::web.isInitialized)(web as PlaybackWebView).syncVisibility()
        if(::web.isInitialized)web.evaluateJavascript("window.__fproAudio && window.__fproAudio."+(if(pause)"stop()" else "disable()"), null)
        if(AudioPlaybackService.controls === this)AudioPlaybackService.controls = null
        stopService(Intent(this, AudioPlaybackService::class.java))
        configurePictureInPicture()
    }
    override fun playAudio() { web.evaluateJavascript("window.__fproAudio && window.__fproAudio.play()", null) }
    override fun pauseAudio() { web.evaluateJavascript("window.__fproAudio && window.__fproAudio.pause()", null) }
    override fun stopAudio() { stopAudioMode(true); if(!web.hasWindowFocus())web.onPause() }
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent); setIntent(intent)
        if (!::web.isInitialized) return
        when(intent.action) { AUDIO_MODE -> requestAudioOnly(); VIDEO_MODE, Intent.ACTION_MAIN -> if(audioOnly)stopAudioMode(false) }
    }
    @androidx.annotation.RequiresApi(26)
    private fun audioActions(): List<android.app.RemoteAction> {
        val pending = android.app.PendingIntent.getActivity(this, 25, Intent(this, MainActivity::class.java).setAction(AUDIO_MODE).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT), android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE)
        return listOf(android.app.RemoteAction(android.graphics.drawable.Icon.createWithResource(this, R.drawable.ic_headphones), "صوت فقط", "استمرار الصوت وإخفاء النافذة", pending))
    }

    private fun diagnostics(): String {
        val provider = if (Build.VERSION.SDK_INT >= 26) WebView.getCurrentWebViewPackage()?.let { "${it.packageName} ${it.versionName}" } else null
        val memory = android.os.Debug.MemoryInfo().also { android.os.Debug.getMemoryInfo(it) }
        val health = "Startup: ${(application as FproApplication).startupMillis}ms / Bridge: $messageBridgeInstalled / Renderer recoveries: $rendererRecoveries / App PSS: ${memory.totalPss} KiB (renderer excluded)"
        return "$health\nFPRO code ${BuildConfig.VERSION_CODE} / Android ${Build.VERSION.RELEASE}\n${provider ?: mobileAgent}\n$loadState\nURL: ${web.url}\nProgress: $loadingProgress / Size: ${web.width}x${web.height} / Attached: ${web.isAttachedToWindow}\nSoftware: ${prefs.flag("software")}\nPiP enabled: ${prefs.flag("pip")} / Playing: $mediaPlaying / Requested: $pipRequested / Active: $pip / Handoff: $externalHandoff / Audio: $audioOnly / Early: ${earlyScript != null} / Gesture required: ${web.settings.mediaPlaybackRequiresUserGesture} / Fullscreen: ${fullView != null} / Orientation request: $requestedOrientation / Sensor available: $fullscreenSensorAvailable / Last angle: $fullscreenLastAngle / Turn gate: ${fullscreenRotation != null} / Music active: ${getSystemService(android.media.AudioManager::class.java).isMusicActive}"
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

    // Physical WebView content bounds, not Android screen/status/navigation bars.
    private fun copyMediaLayoutReport() {
        if (!Navigation.isFacebook(web.url.orEmpty())) { toast("افتح الفيديو المطلوب أولًا"); return }
        val query = assets.open("media-layout-report.js").bufferedReader().use { it.readText() }
        web.evaluateJavascript(query) { result ->
            try {
                val encoded = JSONArray("[$result]").getString(0)
                val report = org.json.JSONObject(encoded)
                report.put("appCode", BuildConfig.VERSION_CODE)
                report.put("nativeContent", org.json.JSONObject().put("width", web.width).put("height", web.height))
                getSystemService(android.content.ClipboardManager::class.java).setPrimaryClip(
                    android.content.ClipData.newPlainText("FPRO media layout", report.toString())
                )
                toast("تم نسخ قياسات الشريط؛ الصقها في المحادثة — دون محتوى الحساب")
            } catch (_: Exception) { toast("تعذر أخذ القياسات؛ انتظر ظهور الفيديو ثم أعد الضغط") }
        }
    }

    private fun viewportScript(width: Int, height: Int) = "window.__fproViewport={width:$width,height:$height};"

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
        web.evaluateJavascript(viewportScript(web.width, web.height) + script.replace("__CONFIG__", prefs.scriptConfig()), null)
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

    private fun startFullscreenRotation() {
        stopFullscreenRotation()
        // Keep portrait on entry regardless of the first sensor pose. A real
        // subsequent turn releases the lock; Android then handles both axes.
        requestedOrientation = android.content.pm.ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
        fullscreenLastAngle = android.view.OrientationEventListener.ORIENTATION_UNKNOWN
        fullscreenRotation = FullscreenRotationGate()
        fullscreenOrientationListener = object : android.view.OrientationEventListener(this) {
            override fun onOrientationChanged(orientation: Int) {
                // Fullscreen custom views need not give the WebView window focus.
                // Lifetime/identity guards, not focus, delimit this listener.
                if (fullscreenOrientationListener === this) onFullscreenOrientation(orientation)
            }
        }.also { fullscreenSensorAvailable = it.canDetectOrientation(); if (fullscreenSensorAvailable) it.enable() }
    }
    internal fun onFullscreenOrientation(angle: Int) {
        if (fullView == null || isFinishing || isDestroyed) return
        fullscreenLastAngle = angle
        if (fullscreenRotation?.observe(angle) != true) return
        requestedOrientation = android.content.pm.ActivityInfo.SCREEN_ORIENTATION_SENSOR
        // Do not keep imposing landscape/portrait decisions over Android's own
        // sensor handling; this gate has completed its single purpose.
        stopFullscreenRotation()
    }
    private fun stopFullscreenRotation() {
        fullscreenOrientationListener?.disable(); fullscreenOrientationListener = null
        fullscreenRotation = null
    }
    private fun closeFullscreen() {
        stopFullscreenRotation()
        if (fullView != null && !isFinishing && !isDestroyed) requestedOrientation = android.content.pm.ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
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
        if(audioOnly)AudioPlaybackService.updatePlaying(playing)
        configurePictureInPicture()
    }
    private fun canEnterPip(): Boolean = Build.VERSION.SDK_INT >= 26 &&
        packageManager.hasSystemFeature(android.content.pm.PackageManager.FEATURE_PICTURE_IN_PICTURE) &&
        prefs.flag("pip") && !audioOnly && mediaPlaying && !settings && !externalHandoff && !isFinishing && !isDestroyed

    @androidx.annotation.RequiresApi(26)
    private fun pipParameters(): PictureInPictureParams.Builder {
        val params = PictureInPictureParams.Builder().setAspectRatio(pipRatio).setActions(audioActions())
        val fullscreen = fullView
        if (fullscreen != null) {
            val location = IntArray(2); fullscreen.getLocationOnScreen(location)
            if (fullscreen.width > 0 && fullscreen.height > 0)
                params.setSourceRectHint(android.graphics.Rect(location[0], location[1], location[0] + fullscreen.width, location[1] + fullscreen.height))
        } else pipRect?.let { params.setSourceRectHint(it) }
        if (Build.VERSION.SDK_INT >= 31) params.setSeamlessResizeEnabled(true)
        return params
    }

    private fun configurePictureInPicture() {
        if (!::web.isInitialized) return
        if (Build.VERSION.SDK_INT < 26 || !packageManager.hasSystemFeature(android.content.pm.PackageManager.FEATURE_PICTURE_IN_PICTURE)) return
        try {
            val params = pipParameters()
            if (Build.VERSION.SDK_INT >= 31) params.setAutoEnterEnabled(canEnterPip())
            setPictureInPictureParams(params.build())
        } catch (_: IllegalStateException) { /* Unsupported window state; normal playback remains. */ }
    }
    override fun onUserLeaveHint() {
        super.onUserLeaveHint()
        if(canEnterPip() && prefs.flag("pipSound", true)) {
            web.settings.mediaPlaybackRequiresUserGesture = false
            web.evaluateJavascript("window.__fproAudio && window.__fproAudio.preparePip()", null)
        }
        // Android12+ auto-entry is armed BEFORE Home. Older versions need a
        // synchronous request; querying JavaScript here races onStop/web.onPause.
        if (Build.VERSION.SDK_INT in 26..30 && canEnterPip()) try {
            pipRequested = enterPictureInPictureMode(pipParameters().build())
        } catch (_: IllegalStateException) { pipRequested = false; toast("الصورة داخل صورة غير متاحة") }
    }
    override fun onPictureInPictureModeChanged(isInPictureInPictureMode: Boolean, newConfig: Configuration) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig)
        pip = isInPictureInPictureMode; pipRequested = false
        if (pip) {
            web.onResume()
            if(prefs.flag("pipSound", true)) {
                web.settings.mediaPlaybackRequiresUserGesture = false
                web.evaluateJavascript("window.__fproAudio && window.__fproAudio.enterPip()", null)
            }
        } else {
            if(!audioOnly && !audioRequested)web.settings.mediaPlaybackRequiresUserGesture = true
            if(!audioRequested)web.evaluateJavascript("window.__fproAudio && window.__fproAudio.leavePip()", null)
        }
    }
    private fun positionUrl(value: String?): String? = try { value?.let { org.json.JSONObject(it).optString("url") } } catch (_: Exception) { null }
    private fun persistPosition() {
        if (!::web.isInitialized) return
        val position = lastPosition ?: return
        val url = web.url.orEmpty()
        if (!prefs.flag("rememberPosition", true) || positionUrl(position) != url || !BrowsingSessionStore.eligible(url)) return
        val history = Bundle()
        if (web.saveState(history) != null) sessions.write(history, position, url)
    }
    private fun probePageInfo() {
        val ticket = headerQueries.begin() ?: return
        web.evaluateJavascript(pageInfoQuery) { result ->
            if (headerQueries.complete(ticket) && !isDestroyed) {
                updateHomeControls(result)
                if (!messageBridgeInstalled) try {
                    acceptPlaybackReport(JSONArray("[$result]").getString(0))
                } catch (_: Exception) { /* Old provider: no unsafe bridge fallback. */ }
            }
        }
    }
    private fun capturePosition(persist: Boolean) {
        if (sessionClosing || !::web.isInitialized || !prefs.flag("rememberPosition", true) || !BrowsingSessionStore.eligible(web.url.orEmpty())) return
        val ticket = positionQueries.begin() ?: return
        web.evaluateJavascript(positionScript + "\nwindow.__fproPosition.capture()") { encoded ->
            if (!positionQueries.complete(ticket)) return@evaluateJavascript
            if (!sessionClosing && !isDestroyed && prefs.flag("rememberPosition", true)) try {
                val position = JSONArray("[$encoded]").optString(0)
                val data = org.json.JSONObject(position)
                if (data.optBoolean("login")) { lastPosition = null; pendingPosition = null; sessions.clear() }
                else if (data.optString("url") == web.url && position.length <= 32768 && position != lastPosition) {
                    lastPosition = position
                    if (persist) persistPosition()
                }
            } catch (_: Exception) { /* A checkpoint must not interrupt the page. */ }
        }
    }
    private fun restorePosition() {
        val position = pendingPosition ?: return
        if (!prefs.flag("rememberPosition", true) || positionUrl(position) != web.url) return
        pendingPosition = null
        web.evaluateJavascript(positionScript + "\nwindow.__fproPosition.restore(" + org.json.JSONObject.quote(position) + ")") { accepted ->
            if (accepted == "false" && !sessionClosing) { lastPosition = null; sessions.clear() }
        }
    }
    override fun onPause() {
        fullscreenOrientationListener?.disable()
        capturePosition(true)
        super.onPause()
    }
    override fun onResume() {
        super.onResume()
        fullscreenOrientationListener?.let { if (it.canDetectOrientation()) it.enable() }
        externalHandoff = false; pipRequested = false
        if (::web.isInitialized && prefs.flag("rememberPosition", true) && positionUrl(lastPosition) == web.url && lastPosition != null) {
            pendingPosition = lastPosition
            resumeRestoreUntil = android.os.SystemClock.elapsedRealtime() + 8_000
            web.post { if (!isDestroyed) restorePosition() }
        }
        if(::web.isInitialized && !audioOnly && !audioRequested && !pip)web.settings.mediaPlaybackRequiresUserGesture = true
        if (::web.isInitialized) { web.onResume(); configurePictureInPicture(); web.evaluateJavascript("window.__fproReportPlayback && window.__fproReportPlayback()", null) }
    }
    override fun onStop() {
        persistPosition()
        if (::web.isInitialized && !audioOnly && !pip && !pipRequested && !(Build.VERSION.SDK_INT >= 26 && isInPictureInPictureMode)) web.onPause()
        super.onStop()
    }
    override fun onSaveInstanceState(outState: Bundle) {
        if (::web.isInitialized) web.saveState(outState)
        if (prefs.flag("rememberPosition", true)) outState.putString("fpro.position", lastPosition)
        super.onSaveInstanceState(outState)
    }
    override fun onDestroy() {
        headerQueries.invalidate(); readinessQueries.invalidate(); positionQueries.invalidate()
        sessionClosing = true; sessions.close()
        earlyScript?.remove(); earlyScript = null
        if (!::web.isInitialized) { super.onDestroy(); return }
        stopAudioMode(true)
        closeFullscreen(); fileCallback?.onReceiveValue(null); fileCallback = null
        disposeWebView(web)
        super.onDestroy()
    }
    private fun acceptPlaybackReport(text: String?) {
        if (text == null || text.length > 2048) return
        try {
            val data = org.json.JSONObject(text)
            if (data.opt("playing") !is Boolean) return
            val playing = data.getBoolean("playing")
            val now = android.os.SystemClock.elapsedRealtime()
            // Bound geometry/layout work; never drop a changed playback state.
            if (playing == mediaPlaying && now - lastGeometryAt < 120) return
            lastGeometryAt = now
            pipRect = null
            val box = data.optJSONObject("video")
            if (playing && box != null && ::web.isInitialized) {
                val vw = box.optDouble("viewportWidth"); val vh = box.optDouble("viewportHeight")
                val x = box.optDouble("x"); val y = box.optDouble("y")
                val w = box.optDouble("w"); val h = box.optDouble("h")
                val iw = box.optDouble("mediaWidth"); val ih = box.optDouble("mediaHeight")
                if (listOf(vw, vh, x, y, w, h, iw, ih).all { it.isFinite() && kotlin.math.abs(it) <= 1_000_000 } &&
                    vw > 0 && vh > 0 && w > 0 && h > 0 && iw > 0 && ih > 0) {
                    val location = IntArray(2); web.getLocationOnScreen(location)
                    val scale = web.width / vw
                    val rect = android.graphics.Rect((location[0] + x * scale).toInt(), (location[1] + y * scale).toInt(),
                        (location[0] + (x + w) * scale).toInt(), (location[1] + (y + h) * scale).toInt())
                    val visible = android.graphics.Rect()
                    if (web.getLocalVisibleRect(visible)) {
                        visible.offset(location[0], location[1])
                        if (rect.intersect(visible) && !rect.isEmpty) pipRect = rect
                    }
                    pipRatio = Rational(((iw / ih).coerceIn(1.0 / 2.38, 2.38) * 10000).toInt(), 10000)
                }
            }
            updatePlaybackState(playing)
            configurePictureInPicture()
        } catch (_: Exception) { /* Malformed or stale webpage message has no native authority. */ }
    }

    private fun disposeWebView(view: WebView, rendererGone: Boolean = false) {
        if (messageBridgeInstalled) androidx.webkit.WebViewCompat.removeWebMessageListener(view, "FproPlayback")
        (view.parent as? ViewGroup)?.removeView(view)
        view.setOnTouchListener(null); view.setOnScrollChangeListener(null)
        if (!rendererGone) { view.stopLoading(); view.clearHistory() }
        view.webChromeClient = null; view.webViewClient = WebViewClient()
        view.destroy()
    }

    private fun recoverRenderer(dead: WebView, crashed: Boolean) {
        if (!::web.isInitialized || dead !== web || isDestroyed) { disposeWebView(dead); return }
        // Never ask the dead renderer for URL/state/JS. Use only the last native checkpoint.
        val destination = positionUrl(lastPosition)?.takeIf { BrowsingSessionStore.eligible(it) } ?: "https://m.facebook.com/"
        headerQueries.invalidate(); readinessQueries.invalidate(); positionQueries.invalidate()
        pageSequence++; pageConfirmed = false; homeControls = false; splash = true
        earlyScript?.remove(); earlyScript = null
        stopFullscreenRotation()
        fullView?.let { (it.parent as? ViewGroup)?.removeView(it) }; fullView = null
        fullCallback = null
        fileCallback?.onReceiveValue(null); fileCallback = null
        if (AudioPlaybackService.controls === this) AudioPlaybackService.controls = null
        stopService(Intent(this, AudioPlaybackService::class.java))
        audioOnly = false; audioRequested = false; mediaPlaying = false; pipRequested = false
        pipRect = null; pipRatio = Rational(16, 9)
        configurePictureInPicture()
        systemBars(false)
        disposeWebView(dead, rendererGone = true)
        web = createWebView()
        browserRoot.addView(web, 0, FrameLayout.LayoutParams(-1, -1))
        applySettings(false)
        rendererRecoveries++
        loadingProgress = 0; enhancementsInstalled = false
        pendingPosition = lastPosition?.takeIf { positionUrl(it) == destination }
        if (recoveryPolicy.allowAutomaticRecovery()) {
            failure = null; web.loadUrl(destination)
        } else {
            failure = "توقف محرك عرض الصفحة مرة أخرى. أوقفنا الاستعادة التلقائية لمنع حلقة أعطال. اختر الصفحة الرئيسية لإعادة المحاولة."
            splash = false
        }
        loadState = if (crashed) "تعافٍ من تعطل العارض" else "تعافٍ من إنهاء العارض بواسطة النظام"
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
        Text("جارٍ تحميل فيسبوك…", color = Color.White, style = MaterialTheme.typography.bodyMedium)
        Spacer(Modifier.height(30.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            repeat(5) { index -> Box(Modifier.size(9.dp).background(Color(0xFFD4AF37).copy(alpha = if (phase.toInt() == index) 1f else .25f), CircleShape)) }
        }
    }
}
