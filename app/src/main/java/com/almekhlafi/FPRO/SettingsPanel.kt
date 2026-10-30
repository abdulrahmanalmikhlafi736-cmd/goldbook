package com.almekhlafi.FPRO

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.Alignment
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun SettingsPanel(prefs: Preferences, audioOnly: () -> Unit, change: () -> Unit, close: () -> Unit, whatsapp: () -> Unit, diagnostics: String, reload: () -> Unit, testDisplay: () -> Unit, copyDiagnostics: () -> Unit, copyColorDiagnostics: () -> Unit, copyAppPromptDiagnostics: () -> Unit) {
    var revision by remember { mutableIntStateOf(0) }
    fun update() { revision++; change() }
    Column(Modifier.fillMaxSize()) {
        Surface(tonalElevation = 3.dp) {
            Row(Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text("إعدادات FPRO", style = MaterialTheme.typography.headlineSmall)
                    Text("اضبط تجربتك كما تحب", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                TextButton(onClick = close) { Text("العودة إلى فيسبوك ←") }
            }
        }
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        SettingsGroup("الفيديو وتعديلات الصفحة", "تحكم مستقل وواضح في الأدوات") {
        Toggle("تحديد النص بالقائمة الأصلية للجوال", "textSelection", prefs, revision, default = true) { update() }
        Text("مسار تحديد النص مطابق للبناء 23. اضغط مطولًا على نص المنشور أو التعليق أو الهاشتاج، ثم حرّك مقابض التحديد للنسخ أو المشاركة حسب خيارات النظام. لا يشمل النص داخل الصور؛ بعض طبقات فيسبوك قد تمنع التحديد.", style = MaterialTheme.typography.bodySmall)
        Toggle("تشغيل صوت الفيديو في نافذة أندرويد عند المغادرة", "pipSound", prefs, revision, default = true) { update() }
        TextButton(onClick = audioOnly) { Text("صوت فقط — استمرار عند قفل الشاشة") }
        Text("شغّل الفيديو أولًا. يظهر إشعار للتحكم بالتشغيل والإيقاف؛ زر السماعة في نافذة صورة داخل صورة يخفي النافذة ويشغّل الصوت فقط. إنهاء التطبيق أو الخدمة ينهي التشغيل. قد توقف بعض نسخ الموقع المشغّل عند المغادرة.", style = MaterialTheme.typography.bodySmall)
        Toggle("ضغطتان على الفيديو لملء الشاشة — مستقل عن أدوات التنزيل", "doubleTapFullscreen", prefs, revision, default = true) { update() }
        Toggle("تفعيل أدوات وتعديلات الصفحة — اختياري", "pageEnhancements", prefs, revision) { update() }
        Text("اختيار أداة أو لون أدناه يفعّل تعديلات الصفحة تلقائياً. يمكنك إيقافها جميعاً بهذا المفتاح؛ إيقافه يعيد تحميل الصفحة الأصلية ويحفظ اختياراتك.", style = MaterialTheme.typography.bodySmall)
        }
        SettingsGroup("التنزيل", "تنزيل خارجي عبر Seal") {
        Toggle("إظهار زر التنزيل القابل للسحب", "downloads", prefs, revision) { update() }
        var pkg by remember { mutableStateOf(prefs.text("package", "com.junkfood.seal")) }
        OutlinedTextField(value = pkg, onValueChange = { pkg = it; prefs.set("package", it.trim()) }, label = { Text("حزمة تطبيق التنزيل الخارجي (مطلوبة)") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
        Text("التنزيل خارجي فقط. زر الفيديو يرسل الرابط مباشرةً إلى الحزمة المحددة دون قائمة مشاركة. Seal يستخدم نافذة التنزيل السريع فوق FPRO مباشرةً؛ النافذة يديرها Seal وليست واجهة مضمّنة. باقي الحزم يحدد التطبيق المستقبِل شكل نافذتها.", style = MaterialTheme.typography.bodySmall)
        Text("في Seal فعّل «ضبط الإعدادات قبل التنزيل» (Configure before download) لتظهر قائمة التنزيل بدلاً من البدء التلقائي. الفيديو الخاص قد يحتاج إعداداً داخل Seal؛ لا يرسل FPRO كوكيز حسابك.", style = MaterialTheme.typography.bodySmall)
        }
        SettingsGroup("المظهر والألوان", "ألوان خفيفة دون تغيير صورك") {
        var expanded by remember { mutableStateOf(false) }
        Toggle("محرك التلوين الشامل وإخفاء لافتة التطبيق — الكود المرسل", "referenceEngine", prefs, revision, default = true) { update() }
        Text("عند تفعيله يوسّع اللون المختار إلى خلفيات وأزرار وأنماط الواجهة وفق المحرك الذي أرسلته. يعمل مع تعديلات الصفحة ولون مختار، أو تلقائي مع ألوان النظام؛ إيقافه يرجع للتلوين المحدود. إخفاء اللافتة يبقى تابعًا لمفتاحه في الحجب. لا يغيّر صور الحساب أو الفيديو.", style = MaterialTheme.typography.bodySmall)
        Text("عند إيقاف المحرك الشامل، تلوين خفيف للتفاصيل: الهاشتاجات والمتابعة والصداقة والتوثيق وحلقات القصص؛ دون تغيير خلفيات الموقع.", style = MaterialTheme.typography.bodySmall)
        Toggle("تجربة متغيرات ألوان فيسبوك", "experimentalColorVars", prefs, revision) { update() }
        Text("تجريبي ومغلق افتراضياً: يوسّع التعرف على بعض الزخارف الصغيرة. توافق حلقات القصص يختلف حسب نسخة فيسبوك، وليس مضمونًا. لا يعمل مع طبيعي، أو تلقائي دون ألوان النظام؛ إيقافه يستعيد أنماط الموقع الأصلية.", style = MaterialTheme.typography.bodySmall)
        TextButton(onClick = copyColorDiagnostics) { Text("نسخ تشخيص التلوين — دون بيانات الحساب") }
        Box {
            OutlinedButton(onClick = { expanded = true }) { Text("اللون: ${prefs.text("color", "تلقائي")}") }
            DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                listOf("تلقائي", "طبيعي", "ذهبي", "أحمر", "أخضر", "بنفسجي", "برتقالي", "فيروزي", "وردي", "بني", "فضي", "أبيض").forEach { color ->
                    DropdownMenuItem(text = { Text(color) }, onClick = { prefs.set("color", color); expanded = false; update() })
                }
            }
        }
        Text("اللون تلقائي مع ألوان النظام يلوّن واجهة فيسبوك بألوان Material You على Android12+؛ الألوان اليدوية تبقى كما تختارها.", style = MaterialTheme.typography.bodySmall)
        listOf("الوضع الداكن" to "dark", "أسود AMOLED" to "amoled", "ألوان النظام الديناميكية (Android 12+)" to "dynamic", "مطابقة الشريط مع لون الصفحة" to "liveColor").forEach { (label,key) -> Toggle(label,key,prefs,revision) { update() } }
        }
        SettingsGroup("الحجب والإخفاء", "اختر ما تريد إخفاءه من الصفحة") {
        Toggle("إخفاء شريط القصص في الصفحة الرئيسية فقط", "homeStories", prefs, revision) { update() }
        Text("مرشحات اجتهادية تعتمد على بنية موقع فيسبوك؛ قد لا تتعرف على جميع اللغات أو النسخ.", style = MaterialTheme.typography.bodySmall)
        listOf("الإعلانات والمحتوى الممول" to "ads", "المنشورات المقترحة" to "suggested", "الريلز" to "reels", "القصص" to "stories", "أشخاص قد تعرفهم" to "people", "المجموعات المقترحة" to "groups", "شريط فتح التطبيق أو تثبيته" to "appBanner").forEach { (label,key) -> Toggle("إخفاء $label",key,prefs,revision, default = key == "appBanner") { update() } }
        }
        SettingsGroup("الأدوات", "التصفح والعرض وملء الشاشة") {
        Toggle("حفظ آخر موضع للتصفح لمدة تصل إلى 24 ساعة", "rememberPosition", prefs, revision, default = true) { update() }
        Text("العودة العادية لا تعيد تحميل الصفحة. إذا أغلق أندرويد التطبيق نحاول استعادة الصفحة والموضع؛ قد يغيّر فيسبوك ترتيب المنشورات. الحفظ خاص داخل التطبيق، وتعطيل الخيار يمسحه.", style = MaterialTheme.typography.bodySmall)
        listOf("شريط تقدم فيديو قابل للسحب — قوس قزح مع كرة" to "rainbow", "التكبير بالإصبعين" to "zoom", "تثبيت شريط التنقل" to "sticky", "وضع سطح المكتب (يعيد تحميل الصفحة)" to "desktop", "عكس اتجاه الصفحة" to "reverse", "صورة داخل صورة عند المغادرة (Android 8+)" to "pip", "الوضع المغمور" to "immersive").forEach { (label,key) -> Toggle(label,key,prefs,revision) { update() } }
        Text("الضغطتان للدخول إلى ملء الشاشة فقط؛ للخروج استخدم الرجوع أو زر المشغل الأصلي. الضغطتان لملء الشاشة تعملان بالمفتاح المستقل أعلاه حتى عند تعطيل التنزيل وشريط التقدم؛ يبقى زر ملء الشاشة الأصلي متاحاً. نسخ النص متاح بتحديده حيث يسمح الموقع. الرسائل متاحة وفق دعم فيسبوك للويب. خيار المغادرة يُبقي الفيديو في نافذة صورة داخل صورة عند الضغط على الرئيسية إذا سمح النظام؛ للصوت مع قفل الشاشة استخدم خيار «صوت فقط» المنفصل. إشعارات الويب والعمل الصوتي الدائم في الخلفية غير مضمونين؛ لا توجد خدمة إشعارات Meta أصلية في هذا التطبيق.", style = MaterialTheme.typography.bodySmall)
        }
        SettingsGroup("التوافق والتشخيص", "خيارات متقدمة — اتركها كما هي إذا كان العرض سليمًا") {
        Text(diagnostics, style = MaterialTheme.typography.bodySmall)
        TextButton(onClick = reload) { Text("إعادة فتح فيسبوك") }
        TextButton(onClick = testDisplay) { Text("اختبار عرض محلي بلا إنترنت") }
        Toggle("إظهار زر نسخ تشخيص الشريط", "mediaDiagnostics", prefs, revision) { update() }
        TextButton(onClick = copyAppPromptDiagnostics) { Text("نسخ تشخيص فتح التطبيق — دون بيانات الحساب") }
        TextButton(onClick = copyDiagnostics) { Text("نسخ معلومات التشخيص") }
        Toggle("توافق وكيل المستخدم مع متصفح الهاتف", "browserAgent", prefs, revision) { update() }
        Toggle("كوكيز الجهات المضمّنة لتوافق تسجيل الدخول", "thirdPartyCookies", prefs, revision, default = true) { update() }
        Text("السماح بكوكيز الطرف الثالث يحسن توافق خدمات Meta المضمّنة، لكنه يسمح بتتبعها. يمكنك تعطيله.", style = MaterialTheme.typography.bodySmall)
        Toggle("الرسم البرمجي — جرّبه إذا بقيت الشاشة رمادية", "software", prefs, revision) { update() }
        Text("اختبار العرض ليس فيسبوك. إذا ظهر أخضر فالمحرك يرسم؛ انسخ التشخيص لتحديد سبب تعطل الموقع. الرسم البرمجي قد يقلل أداء الفيديو.", style = MaterialTheme.typography.bodySmall)
        }
        Card(Modifier.fillMaxWidth()) {
            Column(Modifier.padding(16.dp)) {
                Text("تم التطوير بواسطة عبدالرحمن المخلافي 🧑🏻‍💻", style = MaterialTheme.typography.titleMedium)
                Text("FPRO · 0.0.1 · GPL-3.0\nعميل ويب مستقل غير تابع لشركة Meta")
                TextButton(onClick = whatsapp) { Text("لمراسلة المطور اضغط هنا 🙋🏻") }
            }
        }
        TextButton(onClick = close, modifier = Modifier.fillMaxWidth()) { Text("تم — العودة إلى فيسبوك") }
        }
    }
}

@Composable
private fun Toggle(label: String, key: String, prefs: Preferences, revision: Int, default: Boolean = false, change: () -> Unit) {
    val value = remember(revision) { prefs.flag(key, default) }
    Row(Modifier.fillMaxWidth().heightIn(min = 52.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
        Text(label, Modifier.weight(1f).padding(end = 12.dp))
        Switch(checked = value, onCheckedChange = { prefs.set(key, it); change() })
    }
}

@Composable
private fun SettingsGroup(title: String, subtitle: String, content: @Composable ColumnScope.() -> Unit) {
    Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(20.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerLow)) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text(title, style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.primary)
            Text(subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
            content()
        }
    }
}
