"""Regression checks for the audit tool, not Android production tests."""
import base64
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import zlib

SCRIPT = Path(__file__).with_name('summarize-device-evidence.py')
spec = importlib.util.spec_from_file_location('device_evidence', SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class DeviceEvidenceTest(unittest.TestCase):
    def test_missing_evidence_is_not_pass(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / 'webview-device-diagnostics-empty').mkdir()
            report = module.summarize(root)['jobs'][0]
            self.assertTrue(report['missingTestEvidence'])
            self.assertEqual(0, report['passed'])

    def test_parse_statuses_and_native_context_without_minidump_noise(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            job = root / 'webview-device-diagnostics-fixture'
            job.mkdir()
            (job / 'TEST-fixture.xml').write_text('<testsuite><testcase name="ok"/><testcase name="bad"><failure>failure details</failure></testcase><testcase name="skip"><skipped/></testcase></testsuite>')
            (job / 'logcat.txt').write_text('F crashpad: BINARY-NOISE\nF libc: Fatal signal 5\nF DEBUG: Detected dangling raw_ptr\n')
            report = module.summarize(root)['jobs'][0]
            self.assertEqual((3, 1, 1), (report['testCount'], report['passed'], report['skipped']))
            self.assertEqual('bad', report['failed'][0]['name'])
            self.assertIn('dangling raw_ptr', report['crashOrAnrContexts'][0])
            self.assertNotIn('BINARY-NOISE', report['crashOrAnrContexts'][0])
            output = root / 'output.json'
            text = subprocess.check_output([sys.executable, '-B', str(SCRIPT), str(root), str(output)], text=True)
            chunks = {}
            for line in text.splitlines():
                if '::RELCHUNK:' in line:
                    index, total, data = line.split('::RELCHUNK:', 1)[1].split(':', 2)
                    chunks[int(index)] = data
            self.assertEqual(int(total), len(chunks))
            self.assertLessEqual(len(chunks), 9)
            restored = json.loads(zlib.decompress(base64.b64decode(''.join(chunks[i] for i in range(len(chunks))))))
            self.assertEqual(json.loads(output.read_text()), restored)

    def test_corrupt_report_is_reported_not_silently_passed(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            job = root / 'webview-device-diagnostics-corrupt'
            job.mkdir()
            (job / 'TEST-broken.xml').write_text('<not-xml')
            report = module.summarize(root)['jobs'][0]
            self.assertTrue(report['parseErrors'])
            self.assertTrue(report['missingTestEvidence'])


if __name__ == '__main__':
    unittest.main()
