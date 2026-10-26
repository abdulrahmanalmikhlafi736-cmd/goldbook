package com.almekhlafi.FPRO

import android.app.Application
import android.os.SystemClock
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewOutcomeReceiver
import androidx.webkit.WebViewStartUpConfig
import androidx.webkit.WebViewStartUpResult
import androidx.webkit.WebViewStartupException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.concurrent.Executors

/** No Activity references and no WebView/UA/CookieManager calls before startup. */
class FproApplication : Application() {
    private val outcome = MutableStateFlow<String?>(null) // null=pending, empty=ready
    val webViewStartup = outcome.asStateFlow()
    var startupMillis = 0L
        private set
    override fun onCreate() {
        super.onCreate()
        val started = SystemClock.elapsedRealtime()
        val executor = Executors.newSingleThreadExecutor()
        fun complete(error: String) {
            startupMillis = SystemClock.elapsedRealtime() - started
            outcome.value = error
            executor.shutdown()
        }
        try {
            WebViewCompat.startUpWebView(this, WebViewStartUpConfig.Builder(executor).build(),
                object : WebViewOutcomeReceiver<WebViewStartUpResult, WebViewStartupException> {
                    override fun onResult(result: WebViewStartUpResult) { complete("") }
                    override fun onError(error: WebViewStartupException) { complete(error.javaClass.simpleName) }
                })
        } catch (error: RuntimeException) { complete(error.javaClass.simpleName) }
    }
}
