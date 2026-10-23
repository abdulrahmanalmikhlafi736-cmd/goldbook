package com.almekhlafi.FPRO

import android.content.Context
import org.json.JSONObject

class Preferences(context: Context) {
    private val store = context.getSharedPreferences("fpro", Context.MODE_PRIVATE)
    fun flag(key: String, default: Boolean = false) = store.getBoolean(key, default)
    fun text(key: String, default: String = "") = store.getString(key, default) ?: default
    private val pageKeys = setOf("homeStories", "ads", "suggested", "reels", "stories", "people", "groups", "appBanner", "rainbow", "sticky", "reverse", "downloads", "dark", "amoled", "liveColor")
    init {
        if (!store.getBoolean("sealQuickSetupV9", false)) {
            store.edit().apply {
                if (store.getString("package", null).isNullOrBlank()) putString("package", "com.junkfood.seal")
                putBoolean("sealQuickSetupV9", true)
            }.apply()
        }
        // Migrate selected tools only when the user never explicitly chose the
        // master switch. Preserve an intentional master-off choice.
        if (!store.contains("pageEnhancements") && (pageKeys.any { store.getBoolean(it, false) } || store.getString("color", "تلقائي") != "تلقائي")) {
            store.edit().putBoolean("pageEnhancements", true).apply()
        }
    }
    fun set(key: String, value: Boolean) {
        store.edit().apply {
            putBoolean(key, value)
            if (value && key in pageKeys) putBoolean("pageEnhancements", true)
        }.apply()
    }
    fun set(key: String, value: String) {
        store.edit().apply {
            putString(key, value)
            if (key == "color" && value != "تلقائي") putBoolean("pageEnhancements", true)
        }.apply()
    }
    fun scriptConfig(): String = JSONObject().apply {
        listOf("homeStories", "ads", "suggested", "reels", "stories", "people", "groups", "appBanner", "rainbow", "sticky", "reverse", "downloads").forEach { put(it, flag(it)) }
        put("enhance", flag("pageEnhancements"))
        put("doubleTapFullscreen", flag("doubleTapFullscreen", true))
        put("color", text("color", "تلقائي"))
        put("dark", flag("dark")); put("amoled", flag("amoled"))
    }.toString()
}

object Navigation {
    // Prefer the live media source, never a stale SPA entry permalink.
    fun downloadSource(media: String, permalink: String): String? {
        val direct = try { java.net.URI(media).let { it.scheme == "https" && !it.host.isNullOrBlank() } } catch (_: Exception) { false }
        if (direct) return media
        return if (isFacebook(permalink) && Regex("/reels?/|/videos/|/watch(?:/|\\?)|/video\\.php|[?&](?:story_fbid|fbid|v)=").containsMatchIn(permalink)) permalink else null
    }

    fun browserAgent(agent: String): String {
        val major = Regex("Chrome/(\\d+)").find(agent)?.groupValues?.get(1)
        if (major == null || !agent.startsWith("Mozilla/")) return agent.replace("; wv", "").replace(" Version/4.0", "")
        // Chrome's reduced Android UA format; preserve the real engine major.
        return "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/$major.0.0.0 Mobile Safari/537.36"
    }

    fun allowEmbedded(url: String): Boolean = try {
        val uri = java.net.URI(url)
        uri.scheme in setOf("https", "blob", "data") || url == "about:blank" || url == "about:srcdoc"
    } catch (_: Exception) { false }

    fun isFacebook(url: String): Boolean = try {
        val uri = java.net.URI(url)
        val host = uri.host?.lowercase() ?: ""
        uri.scheme == "https" && (host == "facebook.com" || host.endsWith(".facebook.com") || host == "messenger.com" || host.endsWith(".messenger.com"))
    } catch (_: Exception) { false }
}
