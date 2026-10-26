package com.almekhlafi.FPRO

/** One automatic recovery per Activity lifetime; user retry remains explicit. */
class RendererRecoveryPolicy {
    private var recovered = false
    fun allowAutomaticRecovery(): Boolean {
        if (recovered) return false
        recovered = true
        return true
    }
}
