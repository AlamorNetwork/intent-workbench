import io
import json
from pathlib import Path
import tempfile
from threading import Thread
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.request import Request, urlopen
import zipfile

import server


FIXTURE = {
    'schema_version': '1.6',
    'project': {'title': 'Verification Project'},
    'requirements': [
        {'id': 'REQ-001', 'title': 'Linked requirement', 'acceptance': 'Visible result'},
        {'id': 'REQ-002', 'title': 'Unverified requirement'},
    ],
    'screens': [{'id': 'UI-001', 'name': 'Test screen', 'related_requirements': ['REQ-001']}],
    'references': [{'id': 'REF-001', 'url': 'https://example.test/image', 'related_requirements': ['REQ-001']}],
    'journeys': [{'id': 'UAT-001', 'name': 'Smoke test', 'related_requirements': ['REQ-001']}],
    'tasks': [{'id': 'TASK-001', 'title': 'Test task', 'requirement_ids': ['REQ-001']}],
}

EVIDENCE = [{'journey_id': 'UAT-001', 'status': 'pass', 'timestamp': '2026-11-25T12:00:00Z',
             'source': 'Local smoke fixture', 'type': 'browser', 'description': 'Observed visible result'}]

# Valid 1-pixel PNG, with no private or external input.
IMAGE = server.base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/1uoAAAAASUVORK5CYII=')


class HTTPTestCase(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        storage = patch.object(server, 'DATA', Path(temp.name))
        storage.start()
        self.addCleanup(storage.stop)
        self.fixture = json.loads(json.dumps(FIXTURE))
        self.http = server.ThreadingHTTPServer(('127.0.0.1', 0), server.Handler)
        thread = Thread(target=self.http.serve_forever, kwargs={'poll_interval': .02}, daemon=True)
        thread.start()
        self.addCleanup(self.http.server_close)
        self.addCleanup(thread.join)
        self.addCleanup(self.http.shutdown)
        self.origin = f'http://127.0.0.1:{self.http.server_port}'

    def request(self, path, data=None, method=None, headers=None):
        headers = dict(headers or {})
        if isinstance(data, dict):
            data = json.dumps(data).encode()
            headers['Content-Type'] = 'application/json'
        request = Request(self.origin + path, data=data, method=method, headers=headers)
        try:
            with urlopen(request, timeout=5) as response:
                if response.headers.get_content_type() == 'application/json':
                    return json.load(response)
                return response.read()
        except HTTPError as exc:
            exc.close()
            raise

    def import_project(self):
        return '/api/projects/' + self.request('/api/import', self.fixture)['id']


class ContractWorkflowTests(HTTPTestCase):
    def test_preview_traceability_history_and_handoff(self):
        invalid = json.loads(json.dumps(self.fixture))
        invalid['requirements'].append(invalid['requirements'][0])
        preview = self.request('/api/import/preview', invalid)
        self.assertIn('/requirements/2/id', preview['errors'][0])
        self.assertEqual([], self.request('/api/projects'))
        base = self.import_project()
        report = self.request(base + '/traceability')
        self.assertEqual('complete', report['rows'][0]['coverage'])
        self.assertEqual(['UI-001'], report['rows'][0]['links']['screens'])
        self.assertEqual('missing', report['rows'][1]['coverage'])
        self.request(base + '/history', {'label':'Before'})
        before = self.request(base + '/history')[0]['id']
        upload = self.request(base + '/references', IMAGE, headers={'Content-Type':'image/png'})
        asset_name = upload['references'][-1]['filename']
        self.assertEqual(IMAGE, self.request(base + '/images/' + asset_name))
        self.request(base + '/history', {'label':'With asset'})
        asset_version = self.request(base + '/history')[0]['id']
        self.request(base, {'title':'Modified','tasks':[], 'references':upload['references'][:1]}, method='PUT')
        self.request(base + '/history', {'label':'After'})
        diff = self.request(base + '/history/diff?from=' + before)
        changes = {row['path']: row['type'] for row in diff['changes']}
        self.assertEqual('modified', changes['/title'])
        self.assertEqual('removed', changes['/tasks/TASK-001'])
        with self.assertRaises(HTTPError) as refused:
            self.request(base + '/history/restore', {'id':asset_version,'version':diff['version']})
        self.assertEqual(400, refused.exception.code)
        restored = self.request(base + '/history/restore', {'id':asset_version,'version':diff['version'],'confirm':True})
        self.assertEqual('Verification Project', restored['title'])
        self.assertEqual(5, len(self.request(base + '/history')))
        self.assertEqual('draft', restored['status'])
        with zipfile.ZipFile(io.BytesIO(self.request(base + '/history/backup'))) as archive:
            self.assertEqual(1, sum(name.startswith('uploads/') for name in archive.namelist()))
        core = []
        for profile in server.HANDOFF_PROFILES:
            preview = self.request(base + '/handoff?profile=' + profile)
            with zipfile.ZipFile(io.BytesIO(self.request(base + '/export?profile=' + profile))) as archive:
                self.assertEqual(preview['files'], sorted(archive.namelist()))
                self.assertIn(preview['entrypoint'], archive.namelist())
                self.assertEqual(['external_url_only','attached'],[ref['status'] for ref in preview['images']])
                core.append(archive.read('PROJECT_CONTEXT.json'))
        self.assertEqual(1, len(set(core)))

    def test_json_response_preserves_text_and_uses_safe_wire_encoding(self):
        title = 'A < B & C > D'
        payload = json.dumps({'title':title}).encode()
        request = Request(self.origin + '/api/projects', data=payload,
                          headers={'Content-Type':'application/json'})
        with urlopen(request,timeout=5) as response:
            body = response.read()
            self.assertEqual('application/json', response.headers.get_content_type())
            self.assertEqual('nosniff', response.headers['X-Content-Type-Options'])
            self.assertIn('sandbox', response.headers['Content-Security-Policy'])
            for symbol in (b'<', b'>', b'&'):
                self.assertNotIn(symbol, body)
            self.assertEqual(title,json.loads(body)['title'])

    def test_json_update_merges_saved_project_in_place(self):
        self.fixture['requirements'][0]['policy'] = 'locked'
        base = self.import_project()
        before = self.request(base)
        delta = {'schema_version':'1.6',
                 'requirements':[{'id':'REQ-001','title':'Attempted locked change'},
                                 {'id':'REQ-003','title':'New requirement','reference_ids':['REF-001']}],
                 'tasks':[{'id':'TASK-001','description':'New instructions','requirement_ids':['REQ-003']}]}
        options = {'contract':delta}
        report = self.request(base + '/import-update/preview',options)
        self.assertEqual([],report['errors'])
        self.assertEqual(before,self.request(base))
        self.assertEqual([],self.request(base+'/history'))
        self.assertTrue(report['warnings'])
        with self.assertRaises(HTTPError):
            self.request(base+'/import-update',dict(options,digest=report['digest']))
        updated = self.request(base+'/import-update',dict(options,digest=report['digest'],confirm=True))
        self.assertEqual(before['id'],updated['id'])
        self.assertEqual(before['version']+1,updated['version'])
        self.assertEqual('draft',updated['status'])
        self.assertEqual(['REQ-001','REQ-002','REQ-003'],[r['id'] for r in updated['requirements']])
        self.assertEqual(before['requirements'][0]['title'],updated['requirements'][0]['title'])
        self.assertEqual(['REQ-001','REQ-003'],updated['tasks'][0]['requirement_ids'])
        self.assertEqual(['Update 2','Before update 2'],[row['label'] for row in self.request(base+'/history')])
        self.assertEqual(1,len(self.request('/api/projects')))
        install = self.request(base+'/install-manifest')
        self.assertEqual(2,install['version'])
        portable = next(file for file in install['files'] if file['path']=='PROJECT_CONTEXT.json')
        manifest = json.loads(server.base64.b64decode(portable['data']))
        self.assertEqual(3,len(manifest['requirements']))

    def test_json_update_rejects_stale_preview_and_keeps_saved_images(self):
        base = self.import_project()
        new_image = self.request(base+'/references',IMAGE,headers={'Content-Type':'image/png'})
        filename = new_image['references'][-1]['filename']
        options={'contract':{'schema_version':'1.6','references':[{'id':'REF-002','notes':'Updated notes'}]}}
        preview=self.request(base+'/import-update/preview',options)
        self.request(base,{'summary':'Concurrent change'},method='PUT')
        with self.assertRaises(HTTPError):
            self.request(base+'/import-update',dict(options,digest=preview['digest'],confirm=True))
        self.assertEqual([],self.request(base+'/history'))
        report=self.request(base+'/import-update/preview',options)
        updated=self.request(base+'/import-update',dict(options,digest=report['digest'],confirm=True))
        self.assertEqual(filename,updated['references'][-1]['filename'])
        self.assertEqual(IMAGE,self.request(base+'/images/'+filename))

    def test_project_trash_preserves_contract_snapshots_and_uploads(self):
        base = self.import_project()
        other = self.request('/api/projects',{'title':'Keep this project'})
        uploaded = self.request(base+'/references',IMAGE,headers={'Content-Type':'image/png'})
        filename = uploaded['references'][-1]['filename']
        self.request(base+'/history',{'label':'Preserved snapshot'})
        with self.assertRaises(HTTPError):
            self.request(base+'/trash',{'version':uploaded['version']})
        with self.assertRaises(HTTPError) as stale:
            self.request(base+'/trash',{'version':0,'confirm':True})
        self.assertEqual(409,stale.exception.code)
        self.assertEqual([],self.request('/api/trash'))
        self.request(base+'/trash',{'version':uploaded['version'],'confirm':True})
        self.assertEqual([other['id']],[row['id'] for row in self.request('/api/projects')])
        entry,=self.request('/api/trash')
        self.assertEqual(uploaded['id'],entry['id'])
        for suffix in ('','/history','/images/'+filename):
            with self.assertRaises(HTTPError) as missing:
                self.request(base+suffix)
            self.assertEqual(404,missing.exception.code)
        self.assertTrue(server.upload_file(uploaded['id'],filename).is_file())
        self.request(base+'/restore',{'deleted_at':entry['deleted_at'],'confirm':True})
        self.assertEqual([],self.request('/api/trash'))
        self.assertEqual(uploaded['version'],self.request(base)['version'])
        self.assertEqual('Preserved snapshot',self.request(base+'/history')[0]['label'])
        self.assertEqual(IMAGE,self.request(base+'/images/'+filename))

    def test_missing_snapshot_asset_and_stale_write(self):
        base = self.import_project()
        uploaded = self.request(base + '/references', IMAGE, headers={'Content-Type':'image/png'})
        self.request(base + '/history', {'label':'Asset snapshot'})
        snapshot = self.request(base + '/history')[0]
        server.upload_file(uploaded['id'],uploaded['references'][-1]['filename']).unlink()
        diff = self.request(base + '/history/diff?from=' + snapshot['id'])
        self.assertEqual(['REF-002'],diff['missing_assets'])
        with self.assertRaises(HTTPError) as conflict:
            self.request(base,{'title':'Stale edit','version':0},method='PUT')
        self.assertEqual(409, conflict.exception.code)
        self.assertEqual('Verification Project', self.request(base)['title'])

    def test_evidence_validation_and_privacy(self):
        base = self.import_project()
        options = {'format':'json','text':json.dumps(EVIDENCE + [
            dict(EVIDENCE[0], status='fail', description='Observed a failure'),
            dict(EVIDENCE[0], status='not_run'),
            dict(EVIDENCE[0], description='', artifact='private-artifact.png')
        ])}
        preview = self.request(base + '/evidence/preview', options)
        self.assertEqual([], preview['errors'])
        self.assertTrue(preview['warnings'])
        self.assertEqual(0, len(self.request(base + '/evidence')['batches']))
        changed = dict(options, text=options['text'].replace('UAT-001','UAT-999'))
        self.assertIn('/evidence/0/journey_id', self.request(base + '/evidence/preview',changed)['errors'][0])
        self.request(base + '/evidence/apply', dict(options, confirm=True,digest=preview['digest']))
        rows = self.request(base + '/evidence')['rows']
        self.assertEqual(['pass','fail','not_run','unverified','unverified'], [row['status'] for row in rows])
        self.assertEqual(['TASK-001'], rows[0]['task_ids'])
        self.assertEqual(1, len(self.request(base + '/evidence?status=fail')['rows']))
        for fmt in ('csv','md'):
            self.assertIn(b'not_run', self.request(base + '/evidence?format=' + fmt))
        self.assertNotIn(b'private-artifact',json.dumps(self.request(base + '/json')).encode())
        self.assertNotIn(b'private-artifact',json.dumps(self.request(base + '/ai-review/preview',{})).encode())

    def test_ai_consent_selective_images_and_provider_validation(self):
        base = self.import_project()
        self.request(base + '/references', IMAGE, headers={'Content-Type':'image/png'})
        self.request(base + '/references', IMAGE, headers={'Content-Type':'image/png'})
        before = self.request(base + '/json')
        result = {'ratings': {name:{'score':70,'reason':'Observed in supplied fixture'}
                              for name in server.REVIEW_DIMENSIONS},
                  'findings':[{'id':'REQ-001','severity':'high','detail':'Fixture detail',
                               'recommendation':'Fixture recommendation'}], 'limitations':[]}
        key = 'provider-only-test-credential'
        with patch.dict(server.os.environ, {'IW_AI_MODEL':'fixture','IW_AI_API_KEY':key,
                                             'IW_AI_BASE_URL':'http://127.0.0.1:9999/v1'}):
            with patch.object(server,'ask_provider',return_value=result) as provider:
                options = {'images':['REF-002'],'vision':True,'redact':['notes']}
                preview = self.request(base + '/ai-review/preview',options)
                self.assertEqual(['REF-002'],[img['id'] for img in preview['images']])
                with self.assertRaises(HTTPError):
                    self.request(base + '/ai-review',dict(options,digest=preview['digest']))
                provider.assert_not_called()
                sent = self.request(base + '/ai-review',dict(options,digest=preview['digest'],consent=True))
                self.assertEqual(70,sent['weighted_score'])
                payload = provider.call_args.args[2]
                self.assertEqual(1,payload.count(b'data:image/png'))
                self.assertNotIn('notes',json.loads(json.loads(payload)['messages'][1]['content'][0]['text']).keys())
                self.assertNotIn(key.encode(),payload)
                decision = self.request(base + '/ai-review/decision',{'id':sent['id'],'index':0,'decision':'draft'})
                self.assertEqual('draft',decision['findings'][0]['decision'])
                provider.return_value = {}
                with self.assertRaises(HTTPError):
                    self.request(base + '/ai-review',dict(options,digest=preview['digest'],consent=True))
                self.assertEqual(1,len(self.request(base + '/ai-review')['reports']))
        self.assertEqual(before,self.request(base + '/json'))
class ProviderTransportTests(unittest.TestCase):
    def test_local_provider_transport_and_error_handling(self):
        class Provider(server.BaseHTTPRequestHandler):
            def log_message(self, *args):
                pass

            def do_POST(self):
                self.server.received = (self.path, self.headers['Authorization'],
                                        self.rfile.read(int(self.headers['Content-Length'])))
                self.send_response(self.server.response_status)
                self.end_headers()
                self.wfile.write(self.server.response_body)

        http = server.ThreadingHTTPServer(('127.0.0.1',0),Provider)
        thread = Thread(target=http.serve_forever,kwargs={'poll_interval':.02},daemon=True)
        thread.start()
        self.addCleanup(http.server_close)
        self.addCleanup(thread.join)
        self.addCleanup(http.shutdown)
        endpoint = f'http://127.0.0.1:{http.server_port}/v1/chat/completions'
        key = 'transport-test-credential'
        http.response_status = 200
        http.response_body = json.dumps({'choices':[{'message':{'content':'{"findings":[]}'}}]}).encode()
        self.assertEqual({'findings':[]},server.ask_provider(endpoint,key,b'{}'))
        self.assertEqual(('/v1/chat/completions','Bearer '+key,b'{}'),http.received)
        http.response_body = b'not json'
        with self.assertRaisesRegex(ValueError,'invalid or oversized JSON'):
            server.ask_provider(endpoint,key,b'{}')
        http.response_status = 503
        http.response_body = key.encode()
        with self.assertRaisesRegex(ValueError,r'^AI provider returned HTTP 503$'):
            server.ask_provider(endpoint,key,b'{}')
        with patch.object(server.urllib.request,'build_opener') as opener:
            opener.return_value.open.side_effect = TimeoutError
            with self.assertRaisesRegex(ValueError,'timed out'):
                server.ask_provider(endpoint,key,b'{}')
            self.assertEqual(25,opener.return_value.open.call_args.kwargs['timeout'])
