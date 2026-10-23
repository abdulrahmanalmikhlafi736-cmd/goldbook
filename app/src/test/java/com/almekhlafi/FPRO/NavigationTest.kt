package com.almekhlafi.FPRO

import org.junit.Assert.*
import org.junit.Test

class NavigationTest {
    @Test fun reducedChromeAgentKeepsActualEngineMajor() {
        val ua = Navigation.browserAgent("Mozilla/5.0 (Linux; Android 15; sdk_gphone Build/ABC; wv) AppleWebKit/537.36 Version/4.0 Chrome/135.0.77.4 Mobile Safari/537.36")
        assertTrue(ua.contains("Chrome/135.0.0.0"))
        assertFalse(ua.contains("wv"))
        assertFalse(ua.contains("Build/"))
    }
    @Test fun mobileCompatibilityPreservesRealEngineVersion() {
        assertEquals("Android Chrome/135.0.0.0 Mobile", Navigation.browserAgent("Android; wv Version/4.0 Chrome/135.0.0.0 Mobile"))
    }

    @Test fun embeddedHttpsIsNotExternalNavigation() {
        assertTrue(Navigation.allowEmbedded("https://www.fbsbx.com/embedded"))
        assertTrue(Navigation.allowEmbedded("about:blank"))
        assertTrue(Navigation.allowEmbedded("about:srcdoc"))
        assertTrue(Navigation.allowEmbedded("blob:https://www.facebook.com/nonce"))
        assertTrue(Navigation.allowEmbedded("data:text/html,%3Cp%3Eembedded%3C/p%3E"))
        assertFalse(Navigation.allowEmbedded("intent://evil"))
        assertFalse(Navigation.allowEmbedded("file:///etc/passwd"))
        assertFalse(Navigation.allowEmbedded("http://example.com"))
    }

    @Test fun currentMediaWinsOverOriginalEntryVideo() {
        assertEquals("https://cdn.example/video20.mp4", Navigation.downloadSource("https://cdn.example/video20.mp4", "https://m.facebook.com/watch/?v=1"))
        assertEquals("https://m.facebook.com/reel/20", Navigation.downloadSource("blob:https://m.facebook.com/20", "https://m.facebook.com/reel/20"))
        assertNull(Navigation.downloadSource("blob:https://m.facebook.com/20", ""))
        assertNull(Navigation.downloadSource("", "https://m.facebook.com/"))
        assertNull(Navigation.downloadSource("javascript:alert(1)", "https://facebook.com.evil/reel/20"))
    }

    @Test fun trustedHosts() {
        assertTrue(Navigation.isFacebook("https://m.facebook.com/reel/123"))
        assertTrue(Navigation.isFacebook("https://www.messenger.com/"))
    }
    @Test fun rejectsLookalikesAndUnsafeSchemes() {
        listOf("https://facebook.com.evil.com", "http://facebook.com", "https://evilfacebook.com", "javascript:alert(1)", "https://facebook.com@evil.com", "file:///facebook.com", "not a url").forEach { assertFalse(it, Navigation.isFacebook(it)) }
    }
}
