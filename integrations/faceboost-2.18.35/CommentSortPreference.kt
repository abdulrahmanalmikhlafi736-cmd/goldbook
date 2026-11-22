package com.almekhlafi.materialbook.utils

import android.webkit.WebView
import androidx.webkit.ScriptHandler
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import com.almekhlafi.materialbook.R

/** One bounded preference controller per top Facebook document; no reload or bridge. */
object CommentSortPreference {
    fun stateScript(enabled:Boolean):String = "window.__fproAllComments=$enabled;window.FproCommentSort?.setEnabled($enabled);\n"
    private fun script(web:WebView,enabled:Boolean)=stateScript(enabled)+web.context.assets.open("comment-sort.js").bufferedReader().use{it.readText()}
    fun install(web:WebView,enabled:Boolean=false){
        (web.getTag(R.id.fpro_comment_sort_registration) as? ScriptHandler)?.remove()
        web.setTag(R.id.fpro_comment_sort_registration,null)
        if(WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)){
            val handle=WebViewCompat.addDocumentStartJavaScript(web,script(web,enabled),setOf("https://facebook.com","https://*.facebook.com"))
            web.setTag(R.id.fpro_comment_sort_registration,handle)
        }
    }
    fun update(web:WebView,enabled:Boolean){install(web,enabled);web.evaluateJavascript(script(web,enabled),null)}
}
