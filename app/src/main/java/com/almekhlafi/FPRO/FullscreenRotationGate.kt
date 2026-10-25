package com.almekhlafi.FPRO

/** Ignore the initial pose; hand rotation back to Android after a real turn. */
internal class FullscreenRotationGate {
    private var initialAngle: Int? = null
    private var unlocked = false
    fun observe(angle: Int): Boolean {
        if (angle !in 0..359) return false
        if (unlocked) return true
        val initial = initialAngle
        if (initial == null) { initialAngle = angle; return false }
        val difference = kotlin.math.abs(angle - initial)
        if (minOf(difference, 360 - difference) >= 45) unlocked = true
        return unlocked
    }
}
