package com.almekhlafi.FPRO

import android.app.Activity
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.ViewGroup
import android.webkit.WebView
import androidx.test.core.app.ActivityScenario
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import org.junit.Assert.assertTrue

/** Await the real async startup, not an arbitrary sleep or a weakened assertion. */
fun awaitBrowserReady(scenario: ActivityScenario<out Activity>) {
    val ready = CountDownLatch(1)
    scenario.onActivity { activity ->
        val deadline = android.os.SystemClock.uptimeMillis() + 25_000
        val handler = Handler(Looper.getMainLooper())
        fun containsWeb(view: View): Boolean = view is WebView ||
            (view is ViewGroup && (0 until view.childCount).any { containsWeb(view.getChildAt(it)) })
        val check = object : Runnable {
            override fun run() {
                if (activity.isDestroyed) return
                if (containsWeb(activity.window.decorView)) ready.countDown()
                else if (android.os.SystemClock.uptimeMillis() < deadline) handler.postDelayed(this, 50)
            }
        }
        handler.post(check)
    }
    assertTrue("Async WebView startup must finish and attach a browser", ready.await(26, TimeUnit.SECONDS))
}
