package com.almekhlafi.FPRO

/** Opening fullscreen never consumes an already-landscape sensor reading. */
internal class FullscreenRotationGate(private val naturalLandscape: Boolean = false) {
    enum class Position { PORTRAIT, LANDSCAPE }
    private var sawPortrait = false
    fun observe(angle: Int): Position? {
        if (angle !in 0..359) return null
        val normalized = (angle + if (naturalLandscape) 90 else 0) % 360
        val portrait = normalized <= 25 || normalized >= 335 || normalized in 155..205
        val landscape = normalized in 65..115 || normalized in 245..295
        if (portrait) { sawPortrait = true; return Position.PORTRAIT }
        return if (sawPortrait && landscape) Position.LANDSCAPE else null
    }
}
