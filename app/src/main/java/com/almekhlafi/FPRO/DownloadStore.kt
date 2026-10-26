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
        val path = Uri.parse(url).path.orEmpty().lowercase()
        require(!path.endsWith(".m3u8") && !path.endsWith(".mpd")) { "المصدر قائمة بث مجزأة وليس ملف فيديو مباشراً" }
        val extension = if (path.endsWith(".webm")) "webm" else "mp4"
        val name = "FPRO-${System.currentTimeMillis()}.$extension"
        val request = DownloadManager.Request(Uri.parse(url)).setTitle(name)
            .setMimeType(if (extension == "webm") "video/webm" else "video/mp4")
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
            val status = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS))
            val progress = when {
                status == DownloadManager.STATUS_SUCCESSFUL -> 100
                total > 0 -> (done * 100 / total).coerceIn(0, 100).toInt()
                else -> -1 // Unknown total: show indeterminate, not a frozen 0%.
            }
            Item(id, prefs.getString(key, "فيديو")!!, progress, status)
        }
    }
    fun remove(id: Long) { manager.remove(id); prefs.edit().remove(id.toString()).apply() }
    fun open(id: Long) {
        val uri = manager.getUriForDownloadedFile(id) ?: return
        context.startActivity(android.content.Intent(android.content.Intent.ACTION_VIEW).setDataAndType(uri, manager.getMimeTypeForDownloadedFile(id) ?: "video/*").addFlags(android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION))
    }
}
