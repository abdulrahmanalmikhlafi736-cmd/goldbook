#!/usr/bin/env python3
"""Create a source-only, already-applied FPRO 2.18.48 Android project ZIP."""
import hashlib
import pathlib
import subprocess
import sys
import zipfile

repo = pathlib.Path(__file__).resolve().parents[1]
source = pathlib.Path(sys.argv[1]).resolve()
out = pathlib.Path(sys.argv[2]).resolve()
subprocess.run([sys.executable, str(repo / 'integrations/faceboost-2.18.48/apply.py'), str(source)], check=True)
assert 'versionName = "2.18.48"' in (source / 'app/build.gradle.kts').read_text()
assert 'versionCode = 2180048' in (source / 'app/build.gradle.kts').read_text()
(source / 'gradlew').chmod(0o755)
(source / 'README.md').write_text('''# FPRO 2.18.48 — مشروع أندرويد الكامل

المشروع الكامل بعد تطبيق تعديلات 2.18.48، وليس مستودع goldbook أو حزمة ترقيات.

- الإصدار: 2.18.48؛ versionCode: 2180048.
- الحزمة: com.almekhlafi؛ namespace: com.almekhlafi.materialbook.
- minSdk 26 / compileSdk وtargetSdk 36.
- افتح هذا المجلد نفسه في Android Studio، واستخدم JDK 21 وAndroid SDK 36، ثم Gradle Sync.
- البناء: `./gradlew :app:assembleRelease`؛ Windows: `gradlew.bat :app:assembleRelease`.
- يتطلب البناء تنزيل Gradle والاعتماديات. لا تتضمن هذه الحزمة الاعتماديات أو مخرجات البناء.
- Gradle Wrapper الأصلي والتوقيع الأصلي مضمّنان؛ حافظ على هوية الحزمة والتوقيع للتحديث فوق الإصدار المثبت.
- الترخيص محفوظ في LICENSE.

## حالة هذه النسخة

نفس سلوك 2.18.46 مع تنظيف مراجع العناصر المنفصلة من سجل الألوان فقط.
فرز التعليقات التلقائي وتشخيصه محذوفان. تنزيل فيديوهات المنشورات والريلز بالمشاركة والنسخ؛ فيديو القصص المباشر عبر DownloadManager. لا يوجد الزر الصغير القديم للصور.

اختبارات أندرويد التاريخية المضمّنة قد تتوقع ميزات أزيلت؛ ليست دليل اعتماد لهذا الإصدار. تحقق البناء الحالي مذكور أدناه.

## المصدر

الأصل: faceboost-review عند fe8a474b25414b38819b7cf927720899c8c89705.
تعديلات التطبيق: goldbook عند 9e59aa6.
README محدث لهذه الحزمة فقط؛ ملفات التطبيق والبناء معاد إنشاؤها من المصدر المثبت والتعديلات المذكورة.
التحقق السابق: https://github.com/abdulrahmanalmikhlafi736-cmd/goldbook/actions/runs/43101561476
83 اختبار تنزيل محلي، وبناء Release ناجح؛ ليست شهادة خلو التطبيق من جميع المشاكل.
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
        info = zipfile.ZipInfo((pathlib.PurePosixPath('FPRO-2.18.48') / relative.as_posix()).as_posix(), (2026, 1, 1, 0, 0, 0))
        info.create_system = 3
        info.external_attr = path.stat().st_mode << 16
        archive.writestr(info, path.read_bytes(), compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
with zipfile.ZipFile(out) as archive:
    assert archive.testzip() is None
    for path in ['settings.gradle.kts', 'app/build.gradle.kts', 'gradlew', 'gradlew.bat',
                 'gradle/wrapper/gradle-wrapper.jar', 'LICENSE',
                 'app/src/main/assets/story-video-download.js',
                 'app/src/main/java/com/almekhlafi/materialbook/utils/BlockingWebViewClient.kt']:
        assert 'FPRO-2.18.48/' + path in archive.namelist(), path
    assert (archive.getinfo('FPRO-2.18.48/gradlew').external_attr >> 16) & 0o111
sha = hashlib.sha256(out.read_bytes()).hexdigest()
print(f'{out.name}: {len(files)} files, {out.stat().st_size} bytes, SHA256 {sha}')
out.with_suffix('.notes.md').write_text('''Complete, already-applied FPRO 2.18.48 Android source project only. Extract and open FPRO-2.18.48 in Android Studio. No APK/AAB, historical versions, Git metadata, build outputs, downloaded dependencies or local SDK settings. Gradle Wrapper included. README updated for this package; no application-code changes.

Pinned original: fe8a474b25414b38819b7cf927720899c8c89705. Application overlay: 9e59aa6.

2.18.48 restores 2.18.46 behavior with only detached restoration journal pruning. Automatic comment sorting is removed. Historical Android fixture sources remain and may require migration; the release APK build and focused tests passed at run 43101561476.

Download **FPRO-2.18.48-source.zip**, not GitHub's automatically generated repository archives.

SHA256: `''' + sha + '`\n')
