package com.almekhlafi.materialbook.utils

import android.app.Activity
import org.json.JSONObject
import org.json.JSONArray

/** Allowlist numeric structure only; never display/copy raw page-provided strings. */
object CommentSortDiagnostic {
    fun format(raw:String):String?=runCatching {
        require(raw.length<=20000)
        val input=JSONObject(raw);require(input.optInt("schema")==1)
        val clean=JSONObject().put("schema",1)
        for(key in listOf("current","previous"))input.optJSONObject(key)?.let { source ->
            require(source.optInt("schema")==1)
            val item=JSONObject().put("schema",1)
            for((name,max) in listOf("enabled" to 1,"visited" to 1200,"points" to 48,"limited" to 7,"scopes" to 32))item.put(name,source.optInt(name,0).coerceIn(0,max))
            val rows=source.optJSONArray("rows")?:JSONArray();require(rows.length()<=16)
            val result=JSONArray()
            for(i in 0 until rows.length()){
                val row=rows.getJSONObject(i);val out=JSONObject()
                for((name,max) in listOf("label" to 5,"via" to 4,"tag" to 6,"role" to 9,"action" to 1,"component" to 1,"checked" to 2,"depth" to 6,"scope" to 1))out.put(name,row.optInt(name,0).coerceIn(0,max))
                for(name in listOf("x","y","width","height"))out.put(name,row.optInt(name,0).coerceIn(-2000,3000))
                result.put(out)
            }
            item.put("rows",result);clean.put(key,item)
        }
        require(clean.has("current")||clean.has("previous"))
        "FPRO 2.18.36 — COMMENT SORT DIAGNOSTIC\nNumeric structure only. No names, comment text, IDs, URLs, cookies or tokens.\n"+clean.toString(2)
    }.getOrNull()
    fun show(activity:Activity,raw:String){
        val report=format(raw)?:run{ExternalDownloader.toast(activity,"لم تتوفر لقطة لواجهة التعليقات؛ افتح قائمة فرز التعليقات ثم حاول مجددًا");return}
        showFormatted(activity,report)
    }
    internal fun showFormatted(activity:Activity,report:String){
        if(activity.isFinishing||activity.isDestroyed)return
        val text=android.widget.TextView(activity).apply{this.text="انسخ التقرير وأرسله في المحادثة. هذا تشخيص وليس تأكيدًا لتغيير الفرز.\n\n"+report;setPadding(24,20,24,20);textSize=13f;setTextIsSelectable(true)}
        android.app.AlertDialog.Builder(activity).setTitle("تشخيص فرز التعليقات")
            .setView(android.widget.ScrollView(activity).apply{addView(text)})
            .setPositiveButton("نسخ التقرير"){_,_->runCatching{
                val manager=activity.getSystemService(android.content.Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
                val clip=android.content.ClipData.newPlainText("تشخيص التعليقات",report)
                if(android.os.Build.VERSION.SDK_INT>=33)clip.description.extras=android.os.PersistableBundle().apply{putBoolean(android.content.ClipDescription.EXTRA_IS_SENSITIVE,true)}
                manager.setPrimaryClip(clip)
            }.onSuccess{ExternalDownloader.toast(activity,"تم نسخ التقرير؛ ألصقه في المحادثة")}.onFailure{ExternalDownloader.toast(activity,"تعذر نسخ التقرير")}}
            .setNegativeButton("إغلاق",null).show()
    }
}
