"""Development-only anonymous emulator evidence; no production behavior changes."""
import json
import re
import sys
from pathlib import Path
import xml.etree.ElementTree as ET


def summarize(root):
    results = []
    for folder in sorted(root.glob('webview-device-diagnostics-*')):
        tests = []
        errors = []
        for report in folder.rglob('TEST-*.xml'):
            try:
                for case in ET.parse(report).iter('testcase'):
                    failure = case.find('failure')
                    error = case.find('error')
                    problem = failure if failure is not None else error
                    tests.append({'class': case.get('classname'), 'name': case.get('name'),
                                  'status': 'fail' if problem is not None else 'skip' if case.find('skipped') is not None else 'pass',
                                  'detail': (problem.text or problem.get('message', ''))[:5000] if problem is not None else ''})
            except (ET.ParseError, OSError) as exc:
                errors.append(str(exc))
        logs = list(folder.rglob('logcat.txt'))
        crashes = []
        console = []
        for path in logs:
            lines = path.read_text(errors='replace').splitlines()
            for i, line in enumerate(lines):
                if 'FATAL EXCEPTION' in line or 'Fatal signal ' in line or 'ANR in ' in line:
                    crashes.append('\n'.join(lines[max(0, i-2):i+20])[:7000])
                if re.search(r'Uncaught (?:TypeError|ReferenceError|SyntaxError|Error)|net::ERR_|Render process.*crash', line):
                    if len(console) < 20:
                        console.append(line[:1200])
        results.append({'artifact': folder.name, 'testCount': len(tests),
                        'passed': sum(t['status'] == 'pass' for t in tests),
                        'failed': [t for t in tests if t['status'] == 'fail'],
                        'skipped': sum(t['status'] == 'skip' for t in tests),
                        'missingTestEvidence': not tests, 'parseErrors': errors,
                        'logFiles': len(logs), 'crashOrAnrContexts': crashes[:8],
                        'consoleSamples': console})
    return {'scope': 'Historical anonymous emulator evidence only. Crash contexts may belong to emulator/system/test processes; attribution requires inspecting each context. Missing evidence is never a pass.',
            'jobs': results}


if __name__ == '__main__':
    report = summarize(Path(sys.argv[1]))
    Path(sys.argv[2]).write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    if not report['jobs']:
        raise SystemExit('Missing downloaded emulator artifacts')
    for job in report['jobs']:
        message = json.dumps(job, ensure_ascii=False)
        print('::notice title=Reliability evidence::' + message.replace('%', '%25').replace('\n', '%0A').replace('\r', '%0D'))
