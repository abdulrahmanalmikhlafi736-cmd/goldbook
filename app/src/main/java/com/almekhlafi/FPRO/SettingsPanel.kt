package com.almekhlafi.FPRO

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun SettingsPanel(prefs: Preferences, change: () -> Unit, close: () -> Unit, whatsapp: () -> Unit, downloads: () -> Unit, diagnostics: String, reload: () -> Unit, testDisplay: () -> Unit, copyDiagnostics: () -> Unit) {
    var revision by remember { mutableIntStateOf(0) }
    fun update() { revision++; change() }
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("إعدادات FPRO", style = MaterialTheme.typography.headlineMedium)
        TextButton(onClick = close) { Text("العودة إلى فيسبوك ←") }
        Text("تشخيص الصفحة الفارغة", style = MaterialTheme.typography.titleLarge)
        Text(diagnostics, style = MaterialTheme.typography.bodySmall)
        TextButton(onClick = reload) { Text("إعادة فتح فيسبوك") }
        TextButton(onClick = testDisplay) { Text("اختبار عرض محلي بلا إنترنت") }
        TextButton(onClick = copyDiagnostics) { Text("نسخ معلومات التشخيص") }
        Toggle("توافق وكيل المستخدم مع متصفح الهاتف", "browserAgent", prefs, revision, default = true) { update() }
        Toggle("كوكيز الجهات المضمّنة لتوافق تسجيل الدخول", "thirdPartyCookies", prefs, revision, default = true) { update() }
        Text("السماح بكوكيز الطرف الثالث يحسن توافق خدمات Meta المضمّنة، لكنه يسمح بتتبعها. يمكنك تعطيله.", style = MaterialTheme.typography.bodySmall)
        Toggle("الرسم البرمجي — جرّبه إذا بقيت الشاشة رمادية", "software", prefs, revision) { update() }
        Text("اختبار العرض ليس فيسبوك. إذا ظهر أخضر فالمحرك يرسم؛ انسخ التشخيص لتحديد سبب تعطل الموقع. الرسم البرمجي قد يقلل أداء الفيديو.", style = MaterialTheme.typography.bodySmall)
        HorizontalDivider()
        Toggle("تفعيل أدوات وتعديلات الصفحة — اختياري", "pageEnhancements", prefs, revision) { update() }
        Text("يفتح فيسبوك دون تغيير محتوى الصفحة افتراضياً. شغّل هذا الخيار فقط لاستخدام الفلاتر وألوان الموقع وأدوات الفيديو أدناه. تعطيله يعيد تحميل الصفحة الأصلية.", style = MaterialTheme.typography.bodySmall)
        HorizontalDivider()
        Text("التنزيل", style = MaterialTheme.typography.titleLarge)
        Toggle("إظهار زر التنزيل القابل للسحب", "downloads", prefs, revision) { update() }
        var pkg by remember { mutableStateOf(prefs.text("package")) }
        OutlinedTextField(value = pkg, onValueChange = { pkg = it; prefs.set("package", it.trim()) }, label = { Text("حزمة تطبيق التنزيل الخارجي (اختياري)") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
        Text("المشاركة إلى تطبيق آخر تفتح واجهته؛ لا يمكن تضمينها هنا دون API منه. التنزيل الداخلي متاح للروابط المباشرة فقط، وليس blob أو DRM.", style = MaterialTheme.typography.bodySmall)
        OutlinedButton(onClick = downloads) { Text("إدارة التنزيلات الداخلية") }
        HorizontalDivider()
        Text("المظهر والألوان", style = MaterialTheme.typography.titleLarge)
        var expanded by remember { mutableStateOf(false) }
        Box {
            OutlinedButton(onClick = { expanded = true }) { Text("اللون: ${prefs.text("color", "تلقائي")}") }
            DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                listOf("تلقائي", "طبيعي", "ذهبي", "أحمر", "أخضر", "بنفسجي", "برتقالي", "فيروزي", "وردي", "بني", "فضي", "أبيض").forEach { color ->
                    DropdownMenuItem(text = { Text(color) }, onClick = { prefs.set("color", color); expanded = false; update() })
                }
            }
        }
        listOf("الوضع الداكن" to "dark", "أسود AMOLED" to "amoled", "ألوان النظام الديناميكية (Android 12+)" to "dynamic", "مطابقة الشريط مع لون الصفحة" to "liveColor").forEach { (label,key) -> Toggle(label,key,prefs,revision) { update() } }
        HorizontalDivider()
        Text("الحجب والإخفاء", style = MaterialTheme.typography.titleLarge)
        Text("مرشحات اجتهادية تعتمد على بنية موقع فيسبوك؛ قد لا تتعرف على جميع اللغات أو النسخ.", style = MaterialTheme.typography.bodySmall)
        listOf("الإعلانات والمحتوى الممول" to "ads", "المنشورات المقترحة" to "suggested", "الريلز" to "reels", "القصص" to "stories", "أشخاص قد تعرفهم" to "people", "المجموعات المقترحة" to "groups").forEach { (label,key) -> Toggle("إخفاء $label",key,prefs,revision) { update() } }
        HorizontalDivider()
        Text("الأدوات", style = MaterialTheme.typography.titleLarge)
        listOf("تقدم قوس قزح مع كرة" to "rainbow", "التكبير بالإصبعين" to "zoom", "تثبيت شريط التنقل" to "sticky", "وضع سطح المكتب (يعيد تحميل الصفحة)" to "desktop", "عكس اتجاه الصفحة" to "reverse", "صورة داخل صورة عند المغادرة (Android 8+)" to "pip", "الوضع المغمور" to "immersive").forEach { (label,key) -> Toggle(label,key,prefs,revision) { update() } }
        Text("انقر مرتين على الفيديو لملء الشاشة. نسخ النص متاح بتحديده حيث يسمح الموقع. الرسائل متاحة وفق دعم فيسبوك للويب. إشعارات الويب والعمل الصوتي الدائم في الخلفية غير مضمونين؛ لا توجد خدمة إشعارات Meta أصلية في هذا التطبيق.", style = MaterialTheme.typography.bodySmall)
        Card(Modifier.fillMaxWidth()) {
            Column(Modifier.padding(16.dp)) {
                Text("تم التطوير بواسطة عبدالرحمن المخلافي 🧑🏻‍💻", style = MaterialTheme.typography.titleMedium)
                Text("FPRO · 0.0.1 · GPL-3.0\nعميل ويب مستقل غير تابع لشركة Meta")
                TextButton(onClick = whatsapp) { Text("لمراسلة المطور اضغط هنا 🙋🏻") }
            }
        }
        TextButton(onClick = close) { Text("تم") }
    }
}

@Composable
private fun Toggle(label: String, key: String, prefs: Preferences, revision: Int, default: Boolean = false, change: () -> Unit) {
    val value = remember(revision) { prefs.flag(key, default) }
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, Modifier.weight(1f).padding(top = 12.dp, end = 12.dp))
        Switch(checked = value, onCheckedChange = { prefs.set(key, it); change() })
    }
}
