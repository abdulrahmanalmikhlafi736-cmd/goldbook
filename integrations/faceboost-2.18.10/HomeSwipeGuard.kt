package com.almekhlafi.materialbook.utils

import android.webkit.WebView
import androidx.webkit.ScriptHandler
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import com.almekhlafi.materialbook.R

/** One document-start registration per WebView. No global references or reload. */
object HomeSwipeGuard {
    fun stateScript(enabled: Boolean): String =
        "window.__fproHomeSwipeEnabled=$enabled;" +
            "if(window.__fproHomeSwipeGuard)window.__fproHomeSwipeGuard.setEnabled($enabled);\n"

    fun install(webView: WebView, enabled: Boolean = true) {
        (webView.getTag(R.id.fpro_home_swipe_registration) as? ScriptHandler)?.remove()
        webView.setTag(R.id.fpro_home_swipe_registration, null)
        if (!WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) return
        val script = webView.context.assets.open("home-swipe-guard.js")
            .bufferedReader().use { it.readText() }
        val registration = WebViewCompat.addDocumentStartJavaScript(
            webView,
            "window.__fproHomeSwipeAtStart=true;\n" + stateScript(enabled) + script,
            setOf("https://facebook.com", "https://*.facebook.com")
        )
        webView.setTag(R.id.fpro_home_swipe_registration, registration)
    }

    fun update(webView: WebView, enabled: Boolean) {
        install(webView, enabled)
        webView.evaluateJavascript(stateScript(enabled), null)
    }
}
