package com.almekhlafi.FPRO

import org.junit.Assert.*
import org.junit.Test

class SingleFlightQueryTest {
    @Test fun tenThousandPollAttemptsQueueOnlyOneUnansweredQuery() {
        val gate=SingleFlightQuery();var accepted=0
        repeat(10_000) { if(gate.begin()!=null)accepted++ }
        assertEquals(1,accepted)
    }
    @Test fun completionPermitsNextAndDuplicateCallbackCannotReleaseIt() {
        val gate=SingleFlightQuery();val first=requireNotNull(gate.begin())
        assertTrue(gate.complete(first));val second=requireNotNull(gate.begin())
        assertFalse(gate.complete(first));assertNull(gate.begin());assertTrue(gate.complete(second))
    }
    @Test fun navigationAndDestroyInvalidateOldResultsWithoutBlockingNewPage() {
        val gate=SingleFlightQuery();val old=requireNotNull(gate.begin());gate.invalidate()
        val current=requireNotNull(gate.begin());assertFalse(gate.complete(old));assertNull(gate.begin())
        assertTrue(gate.complete(current));assertNotNull(gate.begin())
    }
}
