package com.almekhlafi.materialbook.utils

import android.app.Activity
import android.app.DownloadManager
import android.content.Context
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.widget.Toast

/** Explicit current-story video only. Never exports cookies or guesses a playlist. */
object StoryDownloads {
    fun permitted(page: String, media: String): Boolean = runCatching {
        val p=java.net.URI(page); val u=java.net.URI(media)
        val ph=p.host?.lowercase().orEmpty(); val h=u.host?.lowercase().orEmpty()
        p.scheme=="https" && p.userInfo==null && (p.port==-1||p.port==443) &&
            (ph=="facebook.com"||ph.endsWith(".facebook.com")) &&
            Regex("/stories(?:/.*|\\.php)?").matches(p.path.orEmpty()) &&
            media.length<=8192 && u.scheme=="https" && u.userInfo==null &&
            (u.port==-1||u.port==443) && u.rawFragment==null &&
            (h=="fbcdn.net"||h.endsWith(".fbcdn.net")) && u.path.orEmpty().endsWith(".mp4",true)
    }.getOrDefault(false)

    fun enqueue(activity: Activity, page: String, media: String) {
        if(!permitted(page,media)) {
            Toast.makeText(activity,"لم يتوفر ملف MP4 مباشر للقصة الحالية؛ لن ننزّل قصة أخرى",Toast.LENGTH_LONG).show()
            return
        }
        runCatching {
            val name="FPRO-Story-${java.util.UUID.randomUUID()}.mp4"
            val request=DownloadManager.Request(Uri.parse(media)).apply {
                setTitle(name)
                setMimeType("video/mp4")
                setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                if(Build.VERSION.SDK_INT>=29) setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS,"FPRO/$name")
            }
            (activity.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager).enqueue(request)
        }.onSuccess {
            Toast.makeText(activity,"بدأ تنزيل القصة عبر أندرويد؛ تابع إشعار التنزيل",Toast.LENGTH_LONG).show()
        }.onFailure {
            Toast.makeText(activity,"تعذر بدء تنزيل القصة عبر أندرويد",Toast.LENGTH_LONG).show()
        }
    }
}
