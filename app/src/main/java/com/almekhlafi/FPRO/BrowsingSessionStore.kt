package com.almekhlafi.FPRO

import android.content.Context
import android.os.Bundle
import android.os.Parcel
import android.util.AtomicFile
import org.json.JSONObject
import java.io.File
import java.util.concurrent.Executors
import java.util.concurrent.Future

/** App-private, bounded, best-effort history checkpoint. Never retains an Activity/WebView. */
internal class BrowsingSessionStore(context: Context) {
    data class Session(val history: Bundle, val position: String, val url: String)
    private val file = AtomicFile(File(context.filesDir, "browsing-session-v1"))
    private val writer = Executors.newSingleThreadExecutor()
    companion object {
        private val ioLock = Any()
        const val MAX_AGE_MS = 24 * 60 * 60 * 1000L
        const val MAX_BYTES = 2 * 1024 * 1024
        fun eligible(url: String): Boolean = Navigation.isFacebook(url) &&
            !Regex("/(?:login|logout|checkpoint|recover)(?:\\.php)?(?:/|\\?|$)", RegexOption.IGNORE_CASE).containsMatchIn(url) && url.length <= 8192
    }
    fun read(now: Long = System.currentTimeMillis()): Session? = synchronized(ioLock) {
        try {
            if (file.baseFile.length() > MAX_BYTES) return@synchronized null
            val bytes = file.openRead().use { it.readBytes() }
            if (bytes.size > MAX_BYTES) return@synchronized null
            val parcel = Parcel.obtain()
            try {
                parcel.unmarshall(bytes, 0, bytes.size); parcel.setDataPosition(0)
                val data = parcel.readBundle(javaClass.classLoader) ?: return@synchronized null
                val age = now - data.getLong("at")
                val url = data.getString("url").orEmpty()
                val position = data.getString("position").orEmpty()
                if (age !in 0..MAX_AGE_MS || !eligible(url) || position.length > 32768 || (JSONObject(position).optInt("v") != 1 || JSONObject(position).optString("url") != url)) return@synchronized null
                Session(data.getBundle("history") ?: return@synchronized null, position, url)
            } finally { parcel.recycle() }
        } catch (_: Exception) { null }
    }
    fun write(history: Bundle, position: String, url: String, now: Long = System.currentTimeMillis()): Future<*>? {
        if (!eligible(url) || position.length > 32768) return null
        return writer.submit {
            synchronized(ioLock) {
                val parcel = Parcel.obtain()
                try {
                    val data = Bundle().apply { putLong("at", now); putString("url", url); putString("position", position); putBundle("history", history) }
                    parcel.writeBundle(data)
                    val bytes = parcel.marshall()
                    if (bytes.size > MAX_BYTES) return@submit
                    val stream = file.startWrite()
                    try { stream.write(bytes); file.finishWrite(stream) } catch (e: Exception) { file.failWrite(stream) }
                } catch (_: Exception) { /* A failed checkpoint must never break browsing. */ }
                finally { parcel.recycle() }
            }
        }
    }
    fun clear(): Future<*> = writer.submit { synchronized(ioLock) { file.delete() } }
    fun close() { writer.shutdown() } // queued writes finish; do not block the UI
}
