package com.almekhlafi.materialbook.utils

import android.webkit.WebView
import androidx.webkit.ScriptHandler
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import com.almekhlafi.materialbook.R

/** Registration is owned by its WebView, not a global map retaining Activities. */
object HomeSwipeGuard {
    private data class Registration(val enabled: Boolean, val handler: ScriptHandler?)

    fun install(webView: WebView, enabled: Boolean = true) {
        val previous = webView.getTag(R.id.fpro_home_swipe_registration) as? Registration
        if (previous == null || previous.enabled != enabled) {
            previous?.handler?.remove()
            val handler = if (WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
                val script = webView.context.assets.open("home-swipe-guard.js")
                    .bufferedReader().use { it.readText() }
                WebViewCompat.addDocumentStartJavaScript(
                    webView,
                    "window.__fproHomeSwipeNative=true;window.__fproHomeSwipeEnabled=$enabled;window.__fproHomeSwipeAtStart=true;\n" + script,
                    setOf("https://facebook.com", "https://*.facebook.com")
                )
            } else null
            webView.setTag(R.id.fpro_home_swipe_registration, Registration(enabled, handler))
        }
        // Apply to the current document as well as future document-start injections.
        webView.evaluateJavascript(
            "window.__fproHomeSwipeNative=true;window.__fproHomeSwipeEnabled=$enabled;if(window.__fproHomeSwipeGuard)window.__fproHomeSwipeGuard.setEnabled($enabled);",
            null
        )
    }
}
