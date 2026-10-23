package com.almekhlafi.FPRO

import android.content.Context
import org.json.JSONObject

class Preferences(context: Context) {
    private val store = context.getSharedPreferences("fpro", Context.MODE_PRIVATE)
    fun flag(key: String, default: Boolean = false) = store.getBoolean(key, default)
    fun text(key: String, default: String = "") = store.getString(key, default) ?: default
    fun set(key: String, value: Boolean) { store.edit().putBoolean(key, value).apply() }
    fun set(key: String, value: String) { store.edit().putString(key, value).apply() }
    fun scriptConfig(): String = JSONObject().apply {
        listOf("ads", "suggested", "reels", "stories", "people", "groups", "rainbow", "sticky", "reverse", "downloads").forEach { put(it, flag(it)) }
        put("color", text("color", "تلقائي"))
        put("dark", flag("dark")); put("amoled", flag("amoled"))
    }.toString()
}

object Navigation {
    fun isFacebook(url: String): Boolean = try {
        val uri = java.net.URI(url)
        val host = uri.host?.lowercase() ?: ""
        uri.scheme == "https" && (host == "facebook.com" || host.endsWith(".facebook.com") || host == "messenger.com" || host.endsWith(".messenger.com"))
    } catch (_: Exception) { false }
}
