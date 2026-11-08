package com.almekhlafi.materialbook.utils

import android.content.ContentValues
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.MediaStore
import android.util.Base64
import android.webkit.WebView
import android.widget.Toast
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import org.json.JSONObject
import java.io.ByteArrayOutputStream

/** Only consumes the exact local URL emitted by WebView's download callback. */
class LocalImageSaver(private val web: WebView, private val onSaved: ((Uri) -> Unit)? = null) {
    companion object {
        const val MAX_BYTES=8*1024*1024
        private val worker=java.util.concurrent.Executors.newSingleThreadExecutor()
        private val types=mapOf("image/jpeg" to "jpg","image/png" to "png","image/webp" to "webp","image/gif" to "gif","image/avif" to "avif")
        private fun origin(value:String):String? = runCatching {
            val u=java.net.URI(value);val h=u.host?.lowercase()?:return@runCatching null
            if(u.scheme!="https"||u.userInfo!=null||(u.port!=-1&&u.port!=443)||!(h=="facebook.com"||h.endsWith(".facebook.com")))return@runCatching null
            "https://$h"
        }.getOrNull()
        fun permitted(page:String,url:String,mime:String):Boolean {
            val own=origin(page)?:return false
            if(mime !in types)return false
            if(url.startsWith("blob:"))return url.length<=4096&&origin(url.removePrefix("blob:"))==own
            if(url.startsWith("data:"))return url.length<=MAX_BYTES*4/3+256&&url.startsWith("data:$mime;base64,")
            return false
        }
        fun validate(bytes:ByteArray,mime:String):Boolean {
            if(bytes.isEmpty()||bytes.size>MAX_BYTES||mime !in types)return false
            val options=android.graphics.BitmapFactory.Options().apply{inJustDecodeBounds=true}
            android.graphics.BitmapFactory.decodeByteArray(bytes,0,bytes.size,options)
            return options.outMimeType==mime&&options.outWidth>0&&options.outHeight>0&&options.outWidth.toLong()*options.outHeight<=50_000_000L
        }
        fun store(context:android.content.Context,bytes:ByteArray,mime:String):Uri {
            require(validate(bytes,mime)){"not a supported image"}
            val name="FPRO-${java.util.UUID.randomUUID()}.${types.getValue(mime)}"
            if(Build.VERSION.SDK_INT>=29){
                val resolver=context.contentResolver
                val values=ContentValues().apply{put(MediaStore.Images.Media.DISPLAY_NAME,name);put(MediaStore.Images.Media.MIME_TYPE,mime);put(MediaStore.Images.Media.RELATIVE_PATH,"Pictures/FPRO");put(MediaStore.Images.Media.IS_PENDING,1)}
                val uri=requireNotNull(resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI,values))
                try {
                    requireNotNull(resolver.openOutputStream(uri)).use{it.write(bytes)}
                    resolver.update(uri,ContentValues().apply{put(MediaStore.Images.Media.IS_PENDING,0)},null,null)
                    return uri
                }catch(error:Exception){resolver.delete(uri,null,null);throw error}
            }
            val directory=requireNotNull(context.getExternalFilesDir(android.os.Environment.DIRECTORY_PICTURES))
            directory.mkdirs();val file=java.io.File(directory,name)
            try{file.outputStream().use{it.write(bytes)}}catch(error:Exception){file.delete();throw error}
            android.media.MediaScannerConnection.scanFile(context,arrayOf(file.path),arrayOf(mime),null)
            return Uri.fromFile(file)
        }
    }
    private data class Session(val id:String,val page:String,val origin:String,val mime:String,val bytes:ByteArrayOutputStream=ByteArrayOutputStream(),var seq:Int=0)
    private val main=Handler(Looper.getMainLooper())
    private var session:Session?=null
    private var writing=false
    private val timeout=Runnable{abort()}
    private val bridgeReady=WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)
    init {
        if(bridgeReady) WebViewCompat.addWebMessageListener(web,"FproLocalImage",setOf("https://facebook.com","https://*.facebook.com")) { view,message,source,isMain,reply ->
            val current=session
            if(current==null||!isMain||origin(source.toString())!=current.origin||view.url!=current.page)return@addWebMessageListener
            val raw=runCatching{message.data}.getOrNull() ?: return@addWebMessageListener
            if(raw.length>50000){abort();return@addWebMessageListener}
            val item=runCatching{JSONObject(raw)}.getOrNull() ?: return@addWebMessageListener
            if(item.optString("id")!=current.id)return@addWebMessageListener
            when(item.optString("kind")){
                "chunk" -> {
                    val chunk=runCatching{Base64.decode(item.optString("data"),Base64.NO_WRAP)}.getOrNull()
                    if(item.optInt("seq",-1)!=current.seq||chunk==null||chunk.isEmpty()||chunk.size>32768||current.bytes.size()+chunk.size>MAX_BYTES){abort();reply.postMessage("error")}
                    else{current.bytes.write(chunk);current.seq++;reply.postMessage("ok")}
                }
                "end" -> {
                    val bytes=current.bytes.toByteArray();clear();writing=true;reply.postMessage("ok");save(bytes,current.mime)
                }
                else -> {abort();reply.postMessage("error")}
            }
        }
    }
    private fun clear(){main.removeCallbacks(timeout);session?.bytes?.reset();session=null}
    private fun abort(){clear();Toast.makeText(web.context,"تعذر قراءة الصورة المحلية؛ لم يُحفظ ملف غير متحقق منه",Toast.LENGTH_LONG).show()}
    private fun save(bytes:ByteArray,mime:String){
        val context=web.context.applicationContext
        worker.execute {
            val result=runCatching{store(context,bytes,mime)}
            main.post{
                writing=false
                result.onSuccess{uri->if(onSaved!=null)onSaved.invoke(uri)else Toast.makeText(web.context,if(Build.VERSION.SDK_INT>=29)"تم حفظ الصورة في Pictures/FPRO" else "تم حفظ الصورة في مجلد صور التطبيق",Toast.LENGTH_LONG).show()}
                    .onFailure{Toast.makeText(web.context,"تعذر حفظ الصورة أو التحقق من بياناتها",Toast.LENGTH_LONG).show()}
            }
        }
    }
    fun start(url:String,declaredMime:String):Boolean {
        val mime=declaredMime.substringBefore(';').trim().lowercase()
        val page=web.url.orEmpty()
        if(!permitted(page,url,mime))return false
        if(writing||session!=null){Toast.makeText(web.context,"جارٍ حفظ الصورة",Toast.LENGTH_SHORT).show();return true}
        if(url.startsWith("data:")){
            writing=true
            val encoded=url.substringAfter(',')
            worker.execute {
                val context=web.context.applicationContext
                val result=runCatching{val bytes=Base64.decode(encoded,Base64.DEFAULT);store(context,bytes,mime)}
                main.post{writing=false;result.onSuccess{uri->if(onSaved!=null)onSaved.invoke(uri)else Toast.makeText(web.context,"تم حفظ الصورة",Toast.LENGTH_LONG).show()}.onFailure{abort()}}
            }
            return true
        }
        if(!bridgeReady)return false
        val current=Session(java.util.UUID.randomUUID().toString(),page,requireNotNull(origin(page)),mime)
        session=current;main.postDelayed(timeout,15000)
        val input=JSONObject().put("id",current.id).put("url",url).put("mime",mime).put("max",MAX_BYTES)
        val script=web.context.assets.open("local-image-save.js").bufferedReader().use{it.readText()}
        web.evaluateJavascript("$script($input);",null)
        return true
    }
}
