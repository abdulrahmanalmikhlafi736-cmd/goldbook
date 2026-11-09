package com.almekhlafi.materialbook.utils

import android.webkit.WebView
import androidx.webkit.ScriptHandler
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import com.almekhlafi.materialbook.R

/** One bounded preference controller per top Facebook document; no reload or bridge. */
object CommentSortPreference {
    @Volatile private var lastReport:String?=null
    fun cachedDiagnostic():String?=lastReport
    private fun remember(raw:String){
        val valid=CommentSortDiagnostic.format(raw)?:return
        val meaningful=runCatching {
            val input=org.json.JSONObject(raw)
            listOf("current","previous").any { key -> val rows=input.optJSONObject(key)?.optJSONArray("rows"); rows!=null&&(0 until rows.length()).any { rows.optJSONObject(it)?.optInt("label") in listOf(2,4) } }
        }.getOrDefault(false)
        if(meaningful)lastReport=valid
    }
    private var currentWeb:java.lang.ref.WeakReference<WebView>?=null
    fun stateScript(enabled:Boolean):String = "window.__fproAllComments=$enabled;window.FproCommentSort?.setEnabled($enabled);\n"
    private fun script(web:WebView,enabled:Boolean)=stateScript(enabled)+web.context.assets.open("comment-sort-diagnostic.js").bufferedReader().use{it.readText()}+web.context.assets.open("comment-sort.js").bufferedReader().use{it.readText()}
    fun install(web:WebView,enabled:Boolean=false){
        currentWeb=java.lang.ref.WeakReference(web)
        if(WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)){
            WebViewCompat.removeWebMessageListener(web,"FproCommentSortReport")
            WebViewCompat.addWebMessageListener(web,"FproCommentSortReport",setOf("https://facebook.com","https://*.facebook.com")){_,message,_,mainFrame,_->
                if(mainFrame&&message.type==androidx.webkit.WebMessageCompat.TYPE_STRING)message.data?.let{remember(it)}
            }
        }
        (web.getTag(R.id.fpro_comment_sort_registration) as? ScriptHandler)?.remove()
        web.setTag(R.id.fpro_comment_sort_registration,null)
        if(WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)){
            val handle=WebViewCompat.addDocumentStartJavaScript(web,script(web,enabled),setOf("https://facebook.com","https://*.facebook.com"))
            web.setTag(R.id.fpro_comment_sort_registration,handle)
        }
    }
    fun update(web:WebView,enabled:Boolean){install(web,enabled);web.evaluateJavascript(script(web,enabled),null)}
    fun showDiagnostic(context:android.content.Context){
        var c=context
        while(c is android.content.ContextWrapper && c !is android.app.Activity)c=c.baseContext
        val activity=c as? android.app.Activity ?: return
        val web=currentWeb?.get()
        if(web==null){lastReport?.let{CommentSortDiagnostic.showFormatted(activity,it)}?:ExternalDownloader.toast(activity,"افتح التعليقات أولًا ثم حاول التشخيص");return}
        val done=java.util.concurrent.atomic.AtomicBoolean(false)
        val handler=android.os.Handler(android.os.Looper.getMainLooper())
        val timeout=Runnable{if(done.compareAndSet(false,true)){lastReport?.let{CommentSortDiagnostic.showFormatted(activity,it)}?:ExternalDownloader.toast(activity,"لم تستجب صفحة التعليقات للتشخيص؛ أعد فتحها ثم حاول")}}
        handler.postDelayed(timeout,3000)
        val js="(()=>JSON.stringify({schema:1,current:window.FproCommentSortDiagnostic?.capture(),previous:window.FproCommentSort?.diagnostic()}))()"
        web.evaluateJavascript(js){value->
            if(done.compareAndSet(false,true)){
                handler.removeCallbacks(timeout)
                val raw=runCatching{org.json.JSONTokener(value).nextValue() as? String}.getOrNull()
                remember(raw.orEmpty())
                val report=lastReport?:CommentSortDiagnostic.format(raw.orEmpty())
                if(report!=null)CommentSortDiagnostic.showFormatted(activity,report) else CommentSortDiagnostic.show(activity,"")
            }
        }
    }
}

