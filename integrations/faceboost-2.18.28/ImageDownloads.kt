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
    /** Constant categories only: never include raw URLs, hostnames, filenames or headers. */
    fun diagnostic(page: String, url: String, mime: String, disposition: String): String {
        val pageHost=host(page);val targetHost=host(url)
        fun group(h:String?)=when { h==null->"invalid";facebook(h)->"facebook";h=="fbcdn.net"||h.endsWith(".fbcdn.net")->"fbcdn";h=="fbsbx.com"||h.endsWith(".fbsbx.com")->"fbsbx";else->"other" }
        val type=mime.take(160).substringBefore(';').trim().lowercase()
        val supported=setOf("image/jpeg","image/png","image/webp","image/gif","image/avif")
        val known=supported+setOf("application/octet-stream","binary/octet-stream","application/force-download","application/x-download","image/jpg","image/heic","image/heif","image/svg+xml","text/html","application/pdf","video/mp4")
        val kind=when {type in known->type;type.isEmpty()->"missing";type.startsWith("image/")->"other-image";type.startsWith("video/")->"other-video";else->"other"}
        val reason=when { pageHost==null->1;!facebook(pageHost)->2;targetHost==null->3;group(targetHost)!in setOf("facebook","fbcdn")->4;type !in supported->5;else->0 }
        // Even extension information is reduced to fixed public suffixes.
        val suffixes=setOf("jpg","jpeg","png","gif","webp","avif","heic","heif")
        val path=runCatching { java.net.URI(url).path.orEmpty() }.getOrDefault("")
        val pathExt=path.substringAfterLast('.',"").lowercase().let { if(it in suffixes)it else "other" }
        val header=disposition.take(512).lowercase()
        val headerExt=suffixes.firstOrNull { ext -> Regex("""\."""+ext+"""(?:["';\s]|$)""").containsMatchIn(header) } ?: "other"
        return "سبب الرفض: $reason\nنوع الاستجابة: $kind\nالصفحة: ${group(pageHost)}\nعنوان التنزيل: ${group(targetHost)}\nامتداد المسار: $pathExt\nامتداد المرفق: $headerExt"
    }
    private fun showDiagnostic(web: WebView, message: String) {
        var context=web.context
        repeat(12) {
            if(context is android.app.Activity) {
                val activity=context as android.app.Activity
                if(!activity.isFinishing&&!activity.isDestroyed) {
                    android.app.AlertDialog.Builder(activity).setTitle("تشخيص حفظ الصورة — 2.18.28")
                        .setMessage(message).setPositiveButton("حسنًا",null).show()
                    return
                }
            }
            context=(context as? android.content.ContextWrapper)?.baseContext ?: return@repeat
        }
        Toast.makeText(web.context,message,Toast.LENGTH_LONG).show()
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
        web.setDownloadListener { url, agent, disposition, mime, _ ->
            val plan=plan(web.url.orEmpty(),url.orEmpty(),mime.orEmpty())
            if(plan==null) {
                showDiagnostic(web,diagnostic(web.url.orEmpty(),url.orEmpty(),mime.orEmpty(),disposition.orEmpty()))
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
