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
        val schema = input.optInt("schema")
        require(schema == 1 || schema == 2)
        val out = JSONObject().put("schema", schema)
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
        if (schema == 2) {
            out.put("legacyLimited", number(input, "legacyLimited", 1))
            val mobile = input.getJSONObject("mobile")
            val clean = JSONObject()
            for ((key, max) in listOf("stop" to 4, "ownerDepth" to 12, "visibleVideos" to 200, "oldVisibleVideos" to 200, "selectedVisible" to 1, "localVisited" to 1801, "pointChecks" to 279, "limitReasons" to 63)) clean.put(key, number(mobile, key, max))
            fun geometry(obj: JSONObject): JSONObject {
                val g = JSONObject()
                for (key in listOf("x", "y", "w", "h")) g.put(key, obj.optInt(key, 0).coerceIn(if (key == "x" || key == "y") -2000 else 0, 3000))
                return g
            }
            clean.put("video", geometry(mobile.getJSONObject("video")))
            val sourceCandidates = mobile.getJSONArray("candidates")
            require(sourceCandidates.length() <= 12)
            val candidates = JSONArray()
            for (i in 0 until sourceCandidates.length()) {
                val c = sourceCandidates.getJSONObject(i)
                val row = geometry(c)
                for ((key, max) in listOf("label" to 3, "labelSource" to 4, "tag" to 5, "role" to 2, "action" to 1, "component" to 1, "actionDepth" to 6, "relation" to 3, "ownerLevel" to 13, "via" to 3, "oldLabel" to 1, "members" to 2000, "oldSelector" to 1, "oldBounds" to 1, "portalBounds" to 1)) row.put(key, number(c, key, max))
                for ((key, max) in listOf("nameShape" to 3, "ariaKind" to 3, "titleKind" to 3)) row.put(key, number(c, key, max))
                c.optJSONObject("icons")?.let { icons ->
                    val cleanIcons = JSONObject().put("kinds", number(icons, "kinds", 63)).put("unknown", number(icons, "unknown", 32)).put("limited", number(icons, "limited", 1))
                    val sourceGlyphs = icons.optJSONArray("glyphs") ?: JSONArray()
                    require(sourceGlyphs.length() <= 6)
                    val glyphs = JSONArray()
                    for (j in 0 until sourceGlyphs.length()) {
                        val g = sourceGlyphs.optJSONObject(j) ?: continue
                        val code = g.optInt("code", 0)
                        val font = number(g, "font", 2)
                        val via = number(g, "via", 3)
                        if ((code in 0xE000..0xF8FF || code in 0xF0000..0xFFFFD || code in 0x100000..0x10FFFD) && font > 0 && via > 0)
                            glyphs.put(JSONObject().put("code", code).put("font", font).put("via", via))
                    }
                    cleanIcons.put("glyphs", glyphs)
                    row.put("icons", cleanIcons)
                }
                candidates.put(row)
            }
            clean.put("candidates", candidates)
            out.put("mobile", clean)
        }
        input.optJSONObject("attempt")?.let { attempt ->
            val cleanAttempt = JSONObject()
            for ((key, max) in listOf("stage" to 5, "reason" to 6, "share" to 1, "copy" to 1, "invalid" to 200, "copyMatches" to 64, "copyNamed" to 32, "copyGlyphs" to 32, "copyNested" to 32)) cleanAttempt.put(key, number(attempt, key, max))
            out.put("attempt", cleanAttempt)
        }
        "FPRO 2.18.44 — PLAYER DIAGNOSTIC V" + schema + "\n" +
            "Structural counts/types and public icon codes only. No IDs, URLs, post text, cookies or tokens.\n" + out.toString(2)
    }.getOrNull()

    fun show(activity: Activity, raw: String) {
        val report = format(raw) ?: run { ExternalDownloader.toast(activity, "تعذّر إنشاء التقرير المحدود؛ لم تُنسخ أي بيانات"); return }
        activity.runOnUiThread {
            if (activity.isFinishing || activity.isDestroyed) return@runOnUiThread
            dialog?.get()?.dismiss()
            val text = TextView(activity).apply {
                this.text = "تقرير محاولة الحصول على رابط المقطع؛ ليس رابط تنزيل.\nاضغط نسخ التقرير ثم ألصقه في المحادثة.\n\n" + report
                setPadding(24, 20, 24, 20)
                textSize = 13f
                setTextIsSelectable(true)
            }
            val popup = AlertDialog.Builder(activity)
                .setTitle("تقرير محاولة التنزيل")
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
