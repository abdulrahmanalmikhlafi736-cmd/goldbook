package com.almekhlafi.FPRO

import org.junit.Assert.*
import org.junit.Test

class FullscreenRotationGateTest {
    @Test fun initialHorizontalReadingNeverUnlocksFullscreen() {
        val gate = FullscreenRotationGate()
        for (angle in listOf(-1, 90, 270, 45, 135)) assertNull(gate.observe(angle))
        assertEquals(FullscreenRotationGate.Position.PORTRAIT, gate.observe(0))
        assertNull(gate.observe(45))
        assertEquals(FullscreenRotationGate.Position.LANDSCAPE, gate.observe(90))
        assertEquals(FullscreenRotationGate.Position.PORTRAIT, gate.observe(0))
    }
    @Test fun eachNewFullscreenEntryRequiresPortraitAgain() {
        val old = FullscreenRotationGate()
        old.observe(0); assertNotNull(old.observe(90))
        assertNull(FullscreenRotationGate().observe(90))
    }
    @Test fun naturallyLandscapeDisplaysNormalizeTheirSensorAxis() {
        val gate = FullscreenRotationGate(true)
        assertNull(gate.observe(0))
        assertEquals(FullscreenRotationGate.Position.PORTRAIT, gate.observe(90))
        assertEquals(FullscreenRotationGate.Position.LANDSCAPE, gate.observe(0))
    }
}
