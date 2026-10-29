package com.almekhlafi.FPRO

import org.junit.Assert.*
import org.junit.Test

class RendererRecoveryPolicyTest {
    @Test fun automaticRecoveryCannotLoop() {
        val policy = RendererRecoveryPolicy()
        assertTrue(policy.allowAutomaticRecovery())
        repeat(100) { assertFalse(policy.allowAutomaticRecovery()) }
    }
    @Test fun newActivityHasItsOwnRecoveryBudget() {
        assertTrue(RendererRecoveryPolicy().allowAutomaticRecovery())
        assertTrue(RendererRecoveryPolicy().allowAutomaticRecovery())
    }
}
