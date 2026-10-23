package com.almekhlafi.FPRO

/** Debug-only baseline: no Compose, injection, UA override or custom routing. */
class PlainWebActivity : android.app.Activity() {
    private lateinit var browser: android.webkit.WebView
    @android.annotation.SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(state: android.os.Bundle?) {
        super.onCreate(state)
        val accessibility = getSystemService(android.view.accessibility.AccessibilityManager::class.java)
        android.util.Log.i("FPRO_EVIDENCE", "BASELINE_ACCESSIBILITY=" + accessibility.isEnabled)
        browser = android.webkit.WebView(this)
        setContentView(browser)
        browser.settings.javaScriptEnabled = true
        browser.settings.domStorageEnabled = true
        browser.webViewClient = android.webkit.WebViewClient()
        browser.loadUrl("https://www.facebook.com/")
    }
    override fun onDestroy() { browser.destroy(); super.onDestroy() }
}
