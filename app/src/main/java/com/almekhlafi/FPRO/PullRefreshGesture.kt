package com.almekhlafi.FPRO

import kotlin.math.abs

/** Input-only policy: no event consumption, timers, WebView or retained DOM. */
internal class PullRefreshGesture(private val distance: Float, private val slop: Float, private val longPressMs: Long) {
    private var generation = 0L
    private var active = false
    private var eligible = false
    private var earlyDrag = false
    private var x = 0f
    private var y = 0f
    private var downTime = 0L

    fun cancel() { generation++; active = false; eligible = false; earlyDrag = false }
    fun down(px: Float, py: Float, time: Long, atTop: Boolean): Long {
        cancel(); active = atTop; x = px; y = py; downTime = time
        return generation
    }
    fun approve(token: Long, allowed: Boolean) { if (active && token == generation) eligible = allowed }
    fun move(px: Float, py: Float, time: Long) {
        if (!active) return
        val dx = abs(px-x); val dy = py-y
        if (dx > slop && dx > abs(dy) || dy < -slop) { cancel(); return }
        if (!earlyDrag && dy > slop) {
            if (time-downTime >= longPressMs) { cancel(); return }
            earlyDrag = true
        }
    }
    fun state(px: Float, py: Float, time: Long): String =
        "active=$active eligible=$eligible early=$earlyDrag distance=${py-y>=distance} vertical=${py-y>abs(px-x)*2} timely=${time-downTime<=1500}"
    fun up(px: Float, py: Float, time: Long, stillAtTop: Boolean): Boolean {
        move(px,py,time)
        val refresh = active && eligible && earlyDrag && stillAtTop && py-y >= distance && py-y > abs(px-x)*2 && time-downTime <= 1500
        cancel()
        return refresh
    }
}
