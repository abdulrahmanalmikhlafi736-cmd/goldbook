package com.almekhlafi.FPRO

import org.junit.Assert.*
import org.junit.Test

class PullRefreshGestureTest {
    private fun policy() = PullRefreshGesture(96f,8f,500)
    @Test fun deliberateEarlyDownwardPullAtTopRefreshesOnce() {
        val p=policy();val t=p.down(30f,30f,0,true);p.approve(t,true);p.move(32f,65f,100)
        assertTrue(p.up(35f,160f,400,true));assertFalse(p.up(35f,160f,450,true))
    }
    @Test fun noJsAnswerAndLateAnswersNeverRefresh() {
        val p=policy();val t=p.down(0f,0f,0,true);p.move(0f,40f,100)
        assertFalse(p.up(0f,150f,400,true));p.approve(t,true)
        val next=p.down(0f,0f,500,true);p.approve(t,true);p.move(0f,40f,600)
        assertFalse(p.up(0f,150f,800,true));p.approve(next,true)
        assertFalse(p.up(0f,150f,900,true))
    }
    @Test fun selectionHoldAndHandlesNeverBecomePull() {
        val p=policy();val t=p.down(0f,0f,0,true);p.approve(t,true);p.move(0f,30f,600)
        assertFalse(p.up(0f,160f,700,true))
    }
    @Test fun rejectHorizontalShortUpwardAndOffTopGestures() {
        for (kind in 0..5) {
            val p=policy();val t=p.down(0f,0f,0,kind!=0);p.approve(t,kind!=1)
            when(kind) { 2 -> p.move(80f,10f,100);3 -> p.move(0f,-20f,100);else -> p.move(0f,20f,100) }
            assertFalse("kind=$kind",p.up(0f,if(kind==4)60f else 160f,400,kind!=5))
        }
    }
    @Test fun cancellationNavigationAndMultitouchInvalidateAsyncChecks() {
        val p=policy();val t=p.down(0f,0f,0,true);p.cancel();p.approve(t,true);p.move(0f,40f,100)
        assertFalse(p.up(0f,160f,400,true))
    }
    @Test fun longDragsDoNotReload() {
        val p=policy();val t=p.down(0f,0f,0,true);p.approve(t,true);p.move(0f,30f,100)
        assertFalse(p.up(0f,160f,1800,true))
    }
}
