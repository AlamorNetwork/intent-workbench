import json
import os
from unittest.mock import patch

from test_contract_workflows import EVIDENCE, HTTPTestCase, IMAGE
import server


class BrowserWorkflow(HTTPTestCase):
    def test_import_preflight_and_contract_tools(self):
        if os.getenv('IW_BROWSER_TEST') != '1':
            self.skipTest('Set IW_BROWSER_TEST=1 to run browser smoke tests')
        from playwright.sync_api import expect, sync_playwright

        with sync_playwright() as browser_api:
            browser = browser_api.chromium.launch(channel=os.getenv('IW_BROWSER_CHANNEL') or None)
            context = browser.new_context(viewport={'width': 1200, 'height': 800},
                                          accept_downloads=True, permissions=['clipboard-read','clipboard-write'])
            page = context.new_page()
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            cancel_next = []
            def handle_dialog(dialog):
                if cancel_next:
                    cancel_next.pop()
                    dialog.dismiss()
                else:
                    dialog.accept()
            page.on('dialog',handle_dialog)
            context.route('**/*',lambda route: route.continue_() if route.request.url.startswith(self.origin+'/') else route.abort())
            page.set_default_timeout(6000)
            page.goto(self.origin)
            page.click('#import-launch')
            page.click('#copy-extraction')
            expect(page.locator('#toast')).to_contain_text('کپی')
            self.assertIn('schema_version 1.6',page.evaluate('navigator.clipboard.readText()'))
            page.click('#import-text-tab')
            invalid = dict(self.fixture,requirements=self.fixture['requirements'] * 2)
            page.fill('#import-text',json.dumps(invalid))
            page.click('#do-import')
            expect(page.locator('#import-feedback')).to_contain_text('duplicate')
            self.assertEqual([],self.request('/api/projects'))
            page.fill('#import-text',json.dumps(self.fixture))
            cancel_next.append(True)
            page.click('#do-import')
            expect(page.locator('#import-feedback')).to_contain_text('Verification Project')
            self.assertEqual([],self.request('/api/projects'))
            page.click('#do-import')
            expect(page.locator('#heading')).to_have_text('Verification Project')
            project = self.request('/api/projects')[0]
            base = '/api/projects/' + project['id']

            def nav(name):
                if page.locator('.mobile-menu').is_visible():
                    page.locator('.mobile-menu').click()
                page.locator(f'[data-nav="{name}"]').click()

            nav('review')
            page.click('#audit')
            expect(page.locator('#audit-results')).not_to_be_empty()
            nav('trace')
            expect(page.locator('#trace-result tbody tr')).to_have_count(2)
            page.select_option('#trace-gap','journeys')
            expect(page.locator('#trace-result tbody tr')).to_have_count(1)
            page.select_option('#trace-gap','')
            if os.getenv('IW_QA_SCREENSHOT'):
                page.screenshot(path=os.environ['IW_QA_SCREENSHOT'])
            page.locator('[data-trace-id="UI-001"]').focus()
            page.keyboard.press('Enter')
            expect(page.locator('#visual')).to_be_visible()
            nav('history')
            page.fill('#history-label','Before')
            page.click('#history-create')
            expect(page.locator('#history-from option')).to_have_count(1)
            nav('intent')
            page.fill('[data-field="title"]','Browser revision')
            page.click('#save')
            expect(page.locator('#save')).to_be_disabled()
            nav('history')
            page.click('#history-restore')
            expect(page.locator('#history-diff')).to_contain_text('/title')
            page.locator('#history-diff button').click()
            expect(page.locator('#heading')).to_have_text('Verification Project')
            expect(page.locator('#history-from option')).to_have_count(3)

            nav('handoff')
            page.select_option('#handoff-profile','claude')
            expect(page.locator('#handoff-manifest')).to_contain_text('CLAUDE.md')
            expect(page.locator('#handoff-manifest')).to_contain_text('external_url_only')
            with page.expect_download() as download:
                page.click('#handoff-export')
            self.assertEqual('intent-claude.zip',download.value.suggested_filename)

            with patch.dict(os.environ, {'IW_AI_MODEL':'','IW_AI_API_KEY':'',
                                        'IW_AI_BASE_URL':'http://127.0.0.1:9999/v1'}):
                nav('ai-review')
                expect(page.locator('#ai-provider')).to_contain_text('غیرفعال')
                expect(page.locator('#ai-send')).to_be_disabled()
            self.request(base + '/references',IMAGE,headers={'Content-Type':'image/png'})
            page.reload()
            page.locator('[data-pid]').first.click()
            expect(page.locator('#heading')).to_have_text('Verification Project')
            ratings = {name:{'score':72,'reason':'Mock provider explanation'} for name in server.REVIEW_DIMENSIONS}
            result = {'ratings':ratings,'findings':[{'id':'REQ-001','severity':'medium',
                                                   'detail':'Fixture detail','recommendation':'Fixture suggestion'}],
                      'limitations':[]}
            with patch.dict(os.environ, {'IW_AI_MODEL':'fixture','IW_AI_API_KEY':'browser-fixture-key',
                                        'IW_AI_BASE_URL':'http://127.0.0.1:9999/v1'}):
                with patch.object(server,'ask_provider',return_value=result) as provider:
                    nav('ai-review')
                    page.check('#ai-vision')
                    page.check('#ai-images input[value="REF-002"]')
                    page.click('#ai-preview')
                    expect(page.locator('#ai-preview-data')).to_contain_text('image/png')
                    provider.assert_not_called()
                    page.click('#ai-send')
                    expect(page.locator('#ai-report')).to_contain_text('Mock provider explanation')
                    page.locator('[data-review-decision="rejected"]').click()
                    expect(page.locator('#ai-report')).to_contain_text('rejected')
                    provider.assert_called_once()

            nav('evidence')
            page.locator('#evidence-file').set_input_files({
                'name':'evidence.json','mimeType':'application/json','buffer':json.dumps(EVIDENCE).encode()
            })
            page.click('#evidence-preview')
            expect(page.locator('#evidence-preview-data')).to_contain_text('TASK-001')
            page.click('#evidence-apply')
            expect(page.locator('#evidence-report')).to_contain_text('Observed visible result')
            expect(page.locator('#evidence-report')).to_contain_text('unverified')
            page.select_option('#evidence-format','csv')
            with page.expect_download() as download:
                page.click('#evidence-export')
            self.assertEqual('acceptance-coverage.csv',download.value.suggested_filename)

            page.click('#import-launch')
            expect(page.locator('#import-heading')).to_have_text('ساخت پروژهٔ جدید از JSON')
            page.press('#import-dialog','Escape')
            nav('intent')
            page.click('#update-open-project')
            expect(page.locator('#import-heading')).to_have_text('به‌روزرسانی این پروژه با JSON')
            expect(page.locator('#import-description')).to_contain_text('Verification Project')
            page.click('#import-text-tab')
            page.fill('#import-text',json.dumps({'schema_version':'1.6','requirements':[
                {'id':'REQ-003','title':'Draft update requirement','reference_ids':['REF-001']}
            ]}))
            cancel_next.append(True)
            page.click('#do-import')
            expect(page.locator('#import-feedback')).to_contain_text('REQ-003')
            self.assertEqual(2,len(self.request(base)['requirements']))
            page.click('#do-import')
            expect(page.locator('#import-dialog')).to_be_hidden()
            expect(page.locator('#toast')).to_contain_text('پیش‌نویس')
            self.assertEqual(3,len(self.request(base)['requirements']))
            self.assertEqual(1,len(self.request('/api/projects')))

            page.evaluate("""() => {
                const files = new Map([['PROJECT_INTENT.md','previous contract']]);
                const folder = (path = '') => ({
                    getDirectoryHandle: async name => folder(path + name + '/'),
                    getFileHandle: async (name, {create}) => {
                        const key = path + name;
                        if (!create && !files.has(key)) throw new DOMException('Missing','NotFoundError');
                        return {
                            getFile: async () => new Blob([files.get(key)]),
                            createWritable: async () => ({
                                write: async data => files.set(key,data),
                                close: async () => {}
                            })
                        };
                    }
                });
                window.showDirectoryPicker = async () => folder();
                window.backupPaths = () => [...files.keys()].filter(name => name.startsWith('.intent-workbench-backups/'));
                window.installedContract = async () => JSON.parse(await new Blob([files.get('PROJECT_CONTEXT.json')]).text());
            }""")
            page.click('#install-project')
            expect(page.locator('#toast')).to_contain_text('نسخه پشتیبان')
            backups=page.evaluate('window.backupPaths()')
            self.assertTrue(any('update-v' in path and path.endswith('/PROJECT_INTENT.md') for path in backups))
            installed=page.evaluate('window.installedContract()')
            self.assertEqual(3,len(installed['requirements']))

            cancel_next.append(True)
            page.click('#trash-open-project')
            self.assertEqual(1,len(self.request('/api/projects')))
            page.click('#trash-open-project')
            expect(page.locator('#editor')).to_be_hidden()
            expect(page.locator('[data-pid]')).to_have_count(0)
            page.click('#open-trash')
            expect(page.locator('#trash-list')).to_contain_text('Verification Project')
            page.locator('#trash-list button').click()
            expect(page.locator('#trash-status')).to_contain_text('خالی')
            page.press('#project-trash','Escape')
            page.locator('[data-pid]').first.click()
            expect(page.locator('#heading')).to_have_text('Verification Project')
            self.assertEqual(3,len(self.request(base)['requirements']))

            page.set_viewport_size({'width':390,'height':844})
            nav('trace')
            expect(page.locator('.tool-scroll').first).to_be_visible()
            self.assertLessEqual(page.locator('body').evaluate('node => node.scrollWidth'),390)
            nav('history')
            expect(page.locator('#history-from')).to_be_visible()
            self.assertEqual([],errors)
            browser.close()
