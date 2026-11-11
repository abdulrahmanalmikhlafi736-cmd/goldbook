package com.almekhlafi.materialbook.utils

import android.webkit.WebView
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature

/** Main-WebView only. No navigation replacement or native touch interception. */
object HomeSwipeGuard {
    fun install(webView: WebView) {
        if (!WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) return
        val script = webView.context.assets.open("home-swipe-guard.js")
            .bufferedReader().use { it.readText() }
        WebViewCompat.addDocumentStartJavaScript(
            webView,
            "window.__fproHomeSwipeAtStart=true;\n" + script,
            setOf("https://facebook.com", "https://*.facebook.com")
        )
    }
}
