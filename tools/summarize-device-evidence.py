"""Development-only anonymous emulator evidence; no production behavior changes."""
import json
import base64
import zlib
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
        engines = []
        for path in logs:
            lines = [line for line in path.read_text(errors='replace').splitlines() if 'F crashpad:' not in line]
            for i, line in enumerate(lines):
                if ('WebViewFactory' in line and 'Loading' in line) or ('cr_Provider' in line and 'version=' in line):
                    if line not in engines and len(engines)<12: engines.append(line[:1200])
                if 'FATAL EXCEPTION' in line or 'Fatal signal ' in line or 'ANR in ' in line:
                    crashes.append('\n'.join(lines[max(0, i-35):i+140])[:32000])
                if re.search(r'Uncaught (?:TypeError|ReferenceError|SyntaxError|Error)|net::ERR_|Render process.*crash', line):
                    if len(console) < 20:
                        console.append(line[:1200])
        results.append({'artifact': folder.name, 'testCount': len(tests),
                        'passed': sum(t['status'] == 'pass' for t in tests),
                        'failed': [t for t in tests if t['status'] == 'fail'],
                        'skipped': sum(t['status'] == 'skip' for t in tests),
                        'missingTestEvidence': not tests, 'parseErrors': errors,
                        'logFiles': len(logs), 'crashOrAnrContexts': crashes[:8],
                        'consoleSamples': console, 'webViewProviders': engines})
    return {'scope': 'Historical anonymous emulator evidence only. Crash contexts may belong to emulator/system/test processes; attribution requires inspecting each context. Missing evidence is never a pass.',
            'jobs': results}


if __name__ == '__main__':
    report = summarize(Path(sys.argv[1]))
    Path(sys.argv[2]).write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    if not report['jobs']:
        raise SystemExit('Missing downloaded emulator artifacts')
    summaries=[]
    for job in report['jobs']:
        summary = {key: job[key] for key in ('artifact', 'testCount', 'passed', 'skipped', 'missingTestEvidence')}
        summary['failed'] = len(job['failed'])
        summary['crashContexts'] = len(job['crashOrAnrContexts'])
        summaries.append(summary)
    print('::notice title=Reliability summary::' + json.dumps(summaries))
    # Checks messages are truncated at roughly4KB. Chunk a lossless compressed
    # report rather than silently losing failure details in one long annotation.
    payload = base64.b64encode(zlib.compress(json.dumps(report, ensure_ascii=False).encode())).decode()
    chunks = [payload[i:i+2800] for i in range(0, len(payload), 2800)]
    if len(chunks)>9:
        raise SystemExit('Report exceeds lossless Checks transport limit; full JSON is available in the job artifact')
    for i, chunk in enumerate(chunks):
        print(f'::notice title=Reliability evidence chunk::RELCHUNK:{i}:{len(chunks)}:{chunk}')
