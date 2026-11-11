package com.almekhlafi.FPRO.devicechecks

import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Test
import org.junit.runner.RunWith

/** Repeat the unchanged black-box settings/local-page path in fresh app processes. */
@RunWith(AndroidJUnit4::class)
class LocalTransitionUiTest {
    @Test fun repeatedRemoteToLocalPageTransitions() {
        repeat(3) { index ->
            println("LOCAL_TRANSITION_ITERATION=${index + 1}")
            CompactUiTest().localPagePaintsThroughRealSettingsButton()
        }
    }
}
