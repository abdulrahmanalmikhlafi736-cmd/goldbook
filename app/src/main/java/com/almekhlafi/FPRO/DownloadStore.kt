package com.almekhlafi.FPRO

import android.app.DownloadManager
import android.content.Context
import android.net.Uri
import android.os.Environment
import android.webkit.CookieManager

/** Only actual HTTPS media URLs are supported; blob/DRM streams cannot be downloaded. */
class DownloadStore(private val context: Context) {
    private val manager = context.getSystemService(DownloadManager::class.java)
    private val prefs = context.getSharedPreferences("download_ids", Context.MODE_PRIVATE)
    data class Item(val id: Long, val title: String, val progress: Int, val status: Int)
    fun enqueue(url: String, userAgent: String): Long {
        require(Uri.parse(url).scheme == "https") { "يلزم رابط HTTPS مباشر" }
        val name = "FPRO-${System.currentTimeMillis()}.mp4"
        val request = DownloadManager.Request(Uri.parse(url)).setTitle(name)
            .setMimeType("video/mp4")
            .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE)
            .setDestinationInExternalFilesDir(context, Environment.DIRECTORY_MOVIES, name)
            .addRequestHeader("User-Agent", userAgent)
        CookieManager.getInstance().getCookie(url)?.let { request.addRequestHeader("Cookie", it) }
        val id = manager.enqueue(request)
        prefs.edit().putString(id.toString(), name).apply()
        return id
    }
    fun list(): List<Item> = prefs.all.keys.mapNotNull { key ->
        val id = key.toLongOrNull() ?: return@mapNotNull null
        manager.query(DownloadManager.Query().setFilterById(id)).use { cursor ->
            if (!cursor.moveToFirst()) return@mapNotNull null
            val done = cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR))
            val total = cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES))
            Item(id, prefs.getString(key, "فيديو")!!, if (total > 0) (done * 100 / total).toInt() else 0,
                cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS)))
        }
    }
    fun remove(id: Long) { manager.remove(id); prefs.edit().remove(id.toString()).apply() }
    fun open(id: Long) {
        val uri = manager.getUriForDownloadedFile(id) ?: return
        context.startActivity(android.content.Intent(android.content.Intent.ACTION_VIEW).setDataAndType(uri, "video/mp4").addFlags(android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION))
    }
}
