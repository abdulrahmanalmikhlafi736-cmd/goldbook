package com.almekhlafi.FPRO

import org.junit.Assert.*
import org.junit.Test

class NavigationTest {
    @Test fun mobileCompatibilityPreservesRealEngineVersion() {
        assertEquals("Android Chrome/135.0.0.0 Mobile", Navigation.browserAgent("Android; wv Version/4.0 Chrome/135.0.0.0 Mobile"))
    }

    @Test fun embeddedHttpsIsNotExternalNavigation() {
        assertTrue(Navigation.allowEmbedded("https://www.fbsbx.com/embedded"))
        assertTrue(Navigation.allowEmbedded("about:blank"))
        assertFalse(Navigation.allowEmbedded("intent://evil"))
        assertFalse(Navigation.allowEmbedded("file:///etc/passwd"))
        assertFalse(Navigation.allowEmbedded("http://example.com"))
    }

    @Test fun trustedHosts() {
        assertTrue(Navigation.isFacebook("https://m.facebook.com/reel/123"))
        assertTrue(Navigation.isFacebook("https://www.messenger.com/"))
    }
    @Test fun rejectsLookalikesAndUnsafeSchemes() {
        listOf("https://facebook.com.evil.com", "http://facebook.com", "https://evilfacebook.com", "javascript:alert(1)", "https://facebook.com@evil.com", "file:///facebook.com", "not a url").forEach { assertFalse(it, Navigation.isFacebook(it)) }
    }
}
