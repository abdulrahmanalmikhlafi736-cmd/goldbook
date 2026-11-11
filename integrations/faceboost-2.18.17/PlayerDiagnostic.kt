package com.almekhlafi.materialbook.utils

import android.app.Activity
import android.app.AlertDialog
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.ScrollView
import android.widget.TextView
import org.json.JSONArray
import org.json.JSONObject
import java.lang.ref.WeakReference

/** Diagnostic-only allowlist: never render/copy raw page-provided strings. */
object PlayerDiagnostic {
    private var dialog: WeakReference<AlertDialog>? = null
    private fun number(obj: JSONObject, key: String, max: Int): Int = obj.optInt(key, 0).coerceIn(0, max)

    fun format(raw: String): String? = runCatching {
        require(raw.length <= 16384)
        val input = JSONObject(raw)
        require(input.optInt("schema") == 1)
        val out = JSONObject().put("schema", 1)
        for ((key, max) in listOf("route" to 3, "source" to 4, "sourceAgreement" to 2, "videos" to 200, "topFrame" to 1, "limited" to 1)) out.put(key, number(input, key, max))
        val hosts = JSONArray()
        val sourceHosts = input.optJSONArray("hosts") ?: JSONArray()
        require(sourceHosts.length() <= 8)
        for (i in 0 until sourceHosts.length()) {
            val h = sourceHosts.getJSONObject(i)
            val row = JSONObject()
            for ((key, max) in listOf("level" to 7, "tag" to 6, "props" to 200, "fiber" to 200, "store" to 1, "component" to 1, "action" to 1)) row.put(key, number(h, key, max))
            hosts.put(row)
        }
        out.put("hosts", hosts)
        val hits = JSONArray()
        val sourceHits = input.optJSONArray("hits") ?: JSONArray()
        require(sourceHits.length() <= 32)
        for (i in 0 until sourceHits.length()) {
            val h = sourceHits.getJSONObject(i)
            val row = JSONObject()
            for ((key, max) in listOf("level" to 7, "origin" to 4, "field" to 5, "type" to 5, "digits" to 1)) row.put(key, number(h, key, max))
            val path = JSONArray()
            val sourcePath = h.optJSONArray("path") ?: JSONArray()
            require(sourcePath.length() <= 8)
            for (j in 0 until sourcePath.length()) path.put(sourcePath.optInt(j, 0).coerceIn(0, 11))
            row.put("path", path)
            hits.put(row)
        }
        out.put("hits", hits)
        val near = input.optJSONObject("near") ?: JSONObject()
        val cleanNear = JSONObject()
        for (key in listOf("buttons", "actions", "mcomponents", "shares", "svg", "permalinks")) cleanNear.put(key, number(near, key, 500))
        out.put("near", cleanNear)
        "FPRO 2.18.17 — PLAYER DIAGNOSTIC V1\n" +
            "Structural counts/types only. No IDs, URLs, text, cookies or tokens.\n" + out.toString(2)
    }.getOrNull()

    fun show(activity: Activity, raw: String) {
        val report = format(raw) ?: run { ExternalDownloader.toast(activity, "تعذّر إنشاء التقرير المحدود؛ لم تُنسخ أي بيانات"); return }
        activity.runOnUiThread {
            if (activity.isFinishing || activity.isDestroyed) return@runOnUiThread
            dialog?.get()?.dismiss()
            val text = TextView(activity).apply {
                this.text = "نسخة تشخيص فقط؛ لم يُرسل رابط إلى Seal.\nاضغط نسخ التقرير ثم ألصقه في المحادثة.\n\n" + report
                setPadding(24, 20, 24, 20)
                textSize = 13f
                setTextIsSelectable(true)
            }
            val popup = AlertDialog.Builder(activity)
                .setTitle("تقرير المقطع — تشخيص فقط")
                .setView(ScrollView(activity).apply { addView(text) })
                .setPositiveButton("نسخ التقرير") { _, _ ->
                    runCatching {
                        val manager = activity.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                        val clip = ClipData.newPlainText("تقرير تشخيص FPRO", report)
                        if (android.os.Build.VERSION.SDK_INT >= 33) clip.description.extras = android.os.PersistableBundle().apply {
                            putBoolean(android.content.ClipDescription.EXTRA_IS_SENSITIVE, true)
                        }
                        manager.setPrimaryClip(clip)
                    }.onSuccess { ExternalDownloader.toast(activity, "تم نسخ التقرير؛ ألصقه في المحادثة") }
                        .onFailure { ExternalDownloader.toast(activity, "تعذّر النسخ؛ يمكنك تحديد نص التقرير ونسخه") }
                }
                .setNegativeButton("إغلاق", null)
                .create()
            dialog = WeakReference(popup)
            popup.show()
        }
    }
}
