package com.almekhlafi.FPRO

import org.junit.Assert.*
import org.junit.Test

class FullscreenRotationGateTest {
    @Test fun initialPoseAndJitterNeverUnlockEntry() {
        val gate = FullscreenRotationGate()
        assertFalse(gate.observe(-1))
        assertFalse(gate.observe(90))
        assertFalse(gate.observe(95))
        assertFalse(gate.observe(110))
        assertTrue(gate.observe(150))
        assertTrue(gate.observe(0))
    }
    @Test fun noExactPortraitReadingIsRequired() {
        for (initial in listOf(0, 40, 90, 180, 270, 355)) {
            val gate = FullscreenRotationGate()
            assertFalse(gate.observe(initial))
            assertTrue(gate.observe((initial + 60) % 360))
        }
    }
    @Test fun circularDistanceHandlesZeroBoundaryAndBothDirections() {
        val gate = FullscreenRotationGate()
        assertFalse(gate.observe(355)); assertFalse(gate.observe(5))
        assertTrue(gate.observe(50))
        val reverse = FullscreenRotationGate()
        assertFalse(reverse.observe(20)); assertTrue(reverse.observe(325))
    }
    @Test fun newEntryAlwaysStartsLockedAgain() {
        val old = FullscreenRotationGate()
        old.observe(0); assertTrue(old.observe(90))
        assertFalse(FullscreenRotationGate().observe(90))
    }
}
