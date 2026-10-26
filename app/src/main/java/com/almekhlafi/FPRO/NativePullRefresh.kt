package com.almekhlafi.FPRO

import android.os.SystemClock
import android.view.MotionEvent
import android.view.ViewConfiguration
import android.webkit.WebView

/** A native fallback for site pull handlers blocked by native-selection guards.
 * Observe only: never intercept, cancel, synthesize or consume WebView input.
 * Eligibility is checked once per down, including nested HTML scrolling. If
 * Chromium cannot answer before release, fail closed; never schedule a late reload.
 */
internal class NativePullRefresh(
    private val web: WebView,
    private val allowed: () -> Boolean,
    private val refresh: () -> Unit
) {
    private val query = web.context.assets.open("pull-refresh.js").bufferedReader().use { it.readText() }
    private val gesture = PullRefreshGesture(96f*web.resources.displayMetrics.density,
        ViewConfiguration.get(web.context).scaledTouchSlop.toFloat(), ViewConfiguration.getLongPressTimeout().toLong())
    private val checks = SingleFlightQuery()
    private var lastRefresh = -2500L
    private fun atTop() = web.scrollY <= 1 && !web.canScrollVertically(-1)
    fun cancel() = gesture.cancel()
    fun onNavigation() { cancel();checks.invalidate() }
    fun observe(event: MotionEvent) {
        if (!allowed() || event.pointerCount != 1) { cancel(); return }
        when(event.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                val token=gesture.down(event.x,event.y,event.eventTime,atTop())
                val check = if(atTop() && web.width>0) checks.begin() else null
                if (check != null) {
                    val script=query.replace("__X__",event.x.toString()).replace("__Y__",event.y.toString()).replace("__WIDTH__",web.width.toString())
                    web.evaluateJavascript(script) { result -> if(checks.complete(check)) gesture.approve(token,result=="true") }
                }
            }
            MotionEvent.ACTION_MOVE -> gesture.move(event.x,event.y,event.eventTime)
            MotionEvent.ACTION_UP -> {
                val requested=gesture.up(event.x,event.y,event.eventTime,atTop())
                val now=SystemClock.elapsedRealtime()
                if(requested && now-lastRefresh>=2500) { lastRefresh=now;refresh() }
            }
            MotionEvent.ACTION_CANCEL, MotionEvent.ACTION_POINTER_DOWN -> cancel()
        }
    }
}
