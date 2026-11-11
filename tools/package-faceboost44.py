#!/usr/bin/env python3
"""Create a source-only, already-applied FPRO 2.18.44 Android project ZIP."""
import hashlib
import pathlib
import subprocess
import sys
import zipfile

repo = pathlib.Path(__file__).resolve().parents[1]
source = pathlib.Path(sys.argv[1]).resolve()
out = pathlib.Path(sys.argv[2]).resolve()
subprocess.run([sys.executable, str(repo / 'integrations/faceboost-2.18.44/apply.py'), str(source)], check=True)
assert 'versionName = "2.18.44"' in (source / 'app/build.gradle.kts').read_text()
assert 'versionCode = 2180044' in (source / 'app/build.gradle.kts').read_text()
(source / 'gradlew').chmod(0o755)
(source / 'README.md').write_text('''# FPRO 2.18.44 — مشروع أندرويد الكامل

المشروع الكامل بعد تطبيق تعديلات 2.18.44، وليس مستودع goldbook أو حزمة ترقيات.

- الإصدار: 2.18.44؛ versionCode: 2180044.
- الحزمة: com.almekhlafi؛ namespace: com.almekhlafi.materialbook.
- minSdk 26 / compileSdk وtargetSdk 36.
- افتح هذا المجلد نفسه في Android Studio، واستخدم JDK 21 وAndroid SDK 36، ثم Gradle Sync.
- البناء: `./gradlew :app:assembleRelease`؛ Windows: `gradlew.bat :app:assembleRelease`.
- يتطلب البناء تنزيل Gradle والاعتماديات. لا تتضمن هذه الحزمة الاعتماديات أو مخرجات البناء.
- Gradle Wrapper الأصلي والتوقيع الأصلي مضمّنان؛ حافظ على هوية الحزمة والتوقيع للتحديث فوق الإصدار المثبت.
- الترخيص محفوظ في LICENSE.

## حالة خيار التعليقات

هذه نسخة المصدر كما هي في 2.18.44، دون إصلاح جديد. أبلغ المالك أن فرز كل التعليقات لا يعمل تلقائيًا إلا بعد فتح قائمة الفرز يدويًا؛ لا تعتبر الميزة مكتملة.

## المصدر

الأصل: faceboost-review عند fe8a474b25414b38819b7cf927720899c8c89705.
تعديلات التطبيق: goldbook عند e3d53a94c589d2ee70ab12eed149d0fbece289e2.
README محدث لهذه الحزمة فقط؛ ملفات التطبيق والبناء معاد إنشاؤها من المصدر المثبت والتعديلات المذكورة.
التحقق السابق: https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/42692528506
328 اختبار Node و63 اختبار أندرويد، وليست إثبات نجاح الميزة في حساب المالك.
مرجع Compose: https://developer.android.com/develop/ui/compose/documentation?hl=ar

المحتويات: مشروع هذا الإصدار فقط، بلا APK/AAB أو نسخ قديمة أو Git أو build/.gradle/node_modules أو local.properties.
''')
excluded = {'.git', '.gradle', '.kotlin', '.idea', 'build', 'node_modules', '__pycache__'}
files = [p for p in sorted(source.rglob('*')) if p.is_file()
         and not any(part in excluded for part in p.relative_to(source).parts)
         and p.name != 'local.properties']
out.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for path in files:
        assert path.suffix.lower() not in {'.apk', '.aab', '.zip', '.gz', '.rar', '.7z'}, path
        relative = path.relative_to(source)
        # Fixed archive timestamp; preserve source permissions (including gradlew).
        info = zipfile.ZipInfo((pathlib.PurePosixPath('FPRO-2.18.44') / relative.as_posix()).as_posix(), (2026, 1, 1, 0, 0, 0))
        info.create_system = 3
        info.external_attr = path.stat().st_mode << 16
        archive.writestr(info, path.read_bytes(), compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
with zipfile.ZipFile(out) as archive:
    assert archive.testzip() is None
    for path in ['settings.gradle.kts', 'app/build.gradle.kts', 'gradlew', 'gradlew.bat',
                 'gradle/wrapper/gradle-wrapper.jar', 'LICENSE',
                 'app/src/main/assets/comment-sort.js',
                 'app/src/main/java/com/almekhlafi/materialbook/utils/BlockingWebViewClient.kt']:
        assert 'FPRO-2.18.44/' + path in archive.namelist(), path
    assert (archive.getinfo('FPRO-2.18.44/gradlew').external_attr >> 16) & 0o111
sha = hashlib.sha256(out.read_bytes()).hexdigest()
print(f'{out.name}: {len(files)} files, {out.stat().st_size} bytes, SHA256 {sha}')
out.with_suffix('.notes.md').write_text('''Complete, already-applied FPRO 2.18.44 Android source project only. Extract and open FPRO-2.18.44 in Android Studio. No APK/AAB, historical versions, Git metadata, build outputs, downloaded dependencies or local SDK settings. Gradle Wrapper included. README updated for this package; no application-code changes.

Pinned original: fe8a474b25414b38819b7cf927720899c8c89705. Application overlay: e3d53a94c589d2ee70ab12eed149d0fbece289e2.

Known owner-reported limitation: automatic All-comments sorting still requires manually opening the sort menu. This source archive does not fix it.

Download **FPRO-2.18.44-source.zip**, not GitHub's automatically generated repository archives.

SHA256: `''' + sha + '`\n')
