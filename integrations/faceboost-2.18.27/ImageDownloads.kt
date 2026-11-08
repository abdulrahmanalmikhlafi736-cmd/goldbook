package com.almekhlafi.materialbook.utils

import android.app.DownloadManager
import android.content.Context
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.webkit.CookieManager
import android.webkit.WebView
import android.widget.Toast

/** Only actual WebView image-download callbacks, never a guessed DOM/video URL. */
object ImageDownloads {
    data class Plan(val url: String, val mime: String, val filename: String)
    private fun host(value: String): String? = runCatching {
        java.net.URI(value).takeIf { it.scheme == "https" && it.userInfo == null && (it.port == -1 || it.port == 443) }?.host?.lowercase()
    }.getOrNull()
    private fun facebook(h: String) = h == "facebook.com" || h.endsWith(".facebook.com")
    fun plan(page: String, url: String, mime: String): Plan? {
        if (!facebook(host(page) ?: return null)) return null
        val h=host(url) ?: return null
        if (!facebook(h) && h != "fbcdn.net" && !h.endsWith(".fbcdn.net")) return null
        val type=mime.substringBefore(';').trim().lowercase()
        val ext=mapOf("image/jpeg" to "jpg", "image/png" to "png", "image/webp" to "webp", "image/gif" to "gif", "image/avif" to "avif")[type] ?: return null
        return Plan(url,type,"FPRO-${java.util.UUID.randomUUID()}.$ext")
    }
    fun request(plan: Plan, agent: String, cookie: String?): DownloadManager.Request {
        return DownloadManager.Request(Uri.parse(plan.url)).apply {
            setMimeType(plan.mime)
            setTitle(plan.filename)
            setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
            setAllowedOverRoaming(false)
            if (Build.VERSION.SDK_INT >= 29) {
                setDestinationInExternalPublicDir(Environment.DIRECTORY_PICTURES,"FPRO/${plan.filename}")
                allowScanningByMediaScanner()
            }
            // Older Android uses DownloadManager's managed destination, without broad storage permission.
            if (agent.isNotBlank() && !agent.contains('\r') && !agent.contains('\n')) addRequestHeader("User-Agent",agent)
            if (!cookie.isNullOrBlank() && !cookie.contains('\r') && !cookie.contains('\n')) addRequestHeader("Cookie",cookie)
        }
    }
    fun install(web: WebView) {
        web.setDownloadListener { url, agent, _, mime, _ ->
            val plan=plan(web.url.orEmpty(),url.orEmpty(),mime.orEmpty())
            if(plan==null) {
                Toast.makeText(web.context,"تعذر حفظ هذا الملف كصورة؛ لم يبدأ تنزيل فيديو أو ملف آخر",Toast.LENGTH_LONG).show()
            } else {
                // Cookies are queried for the exact validated download URL, never copied wholesale from the page.
                val cookie=CookieManager.getInstance().getCookie(plan.url)
                runCatching {
                    val manager=web.context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
                    manager.enqueue(request(plan,agent.orEmpty(),cookie))
                }.onSuccess {
                    Toast.makeText(web.context,"بدأ تنزيل الصورة؛ ستظهر نتيجة الحفظ في إشعار التنزيل",Toast.LENGTH_LONG).show()
                }.onFailure {
                    Toast.makeText(web.context,"تعذر بدء حفظ الصورة؛ تحقق من توفر مساحة وخدمة التنزيل",Toast.LENGTH_LONG).show()
                }
            }
        }
    }
}
