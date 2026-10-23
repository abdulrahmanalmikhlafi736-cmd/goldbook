package com.almekhlafi.FPRO

import org.junit.Assert.*
import org.junit.Test

class NavigationTest {
    @Test fun trustedHosts() {
        assertTrue(Navigation.isFacebook("https://m.facebook.com/reel/123"))
        assertTrue(Navigation.isFacebook("https://www.messenger.com/"))
    }
    @Test fun rejectsLookalikesAndUnsafeSchemes() {
        listOf("https://facebook.com.evil.com", "http://facebook.com", "https://evilfacebook.com", "javascript:alert(1)", "https://facebook.com@evil.com", "file:///facebook.com", "not a url").forEach { assertFalse(it, Navigation.isFacebook(it)) }
    }
}
