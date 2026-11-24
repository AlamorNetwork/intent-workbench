import sys, pathlib, unittest, json, io, zipfile
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]))
import server as s
class V09Tests(unittest.TestCase):
    def test_kit_template_and_catalog(self):
        root=pathlib.Path(__file__).resolve().parents[1]
        template=json.loads((root/'template_v0.9.json').read_text())
        self.assertEqual(template['schema_version'],'1.6')
        self.assertIn('journeys',template)
        self.assertIn('screens',template)
        self.assertTrue(s.DEFAULT_SKILLS)
        self.assertTrue(s.role_items())
        self.assertIn('available_roles',(root/'AI_EXTRACTION_PROMPT.md').read_text())
    def test_missing_sections_generate_warnings(self):
        data={'schema_version':'1.6','project':{'title':'Example','summary':'Test'},'requirements':[{'id':'REQ-001','title':'UI','text':'Build UI','category':'ui','acceptance':'Visible screen'}]}
        p=s.import_contract(data)
        codes={i['code'] for i in s.contract_audit(p)['issues']}
        self.assertTrue({'NO_SKILLS_SELECTED','NO_ROLES_SELECTED','NO_USER_JOURNEYS','NO_SCREEN_SPEC'}<=codes)
    def test_enriched_content_export_portable(self):
        # Synthetic fixture: this test must not depend on private Velvet files
        # or on a machine-specific /mnt/data path.
        d={
            'schema_version':'1.6',
            'project':{'title':'Portable fixture','summary':'Test export'},
            'requirements':[{'id':'REQ-001','title':'UI','text':'Build UI','category':'ui','acceptance':'Visible screen'}],
            'screens':[{'id':f'UI-{i:03d}','name':f'Screen {i}', 'purpose':'Test layout',
                        'layout':'Main column','components':'Button','acceptance':'Visible'}
                       for i in range(1,11)],
            'journeys':[{'id':f'UAT-{i:03d}','name':f'Journey {i}', 'preconditions':'App running',
                         'steps':'Open app','expected':'Screen visible', 'status':'not_run'}
                        for i in range(1,7)],
            'bank':{'roles':[dict(id=item['id'],name=item['name'],category=item['category'],
                                   description=item['description'])
                              for item in s.role_items()[:8]],'skills':[], 'documents':{}}
        }
        p=s.import_contract(d)
        self.assertEqual(len(p['screens']),10)
        self.assertEqual(len(p['journeys']),6)
        self.assertEqual(len(p['bank']['roles']),8)
        self.assertTrue(all(j['status']=='not_run' for j in p['journeys']))
        z=zipfile.ZipFile(io.BytesIO(s.generate_package(p)))
        for name in ('VISUAL_INTENT.md','USER_JOURNEYS.md','AGENT_ROLE_REGISTRY.md'):
            self.assertIn(name,z.namelist())
if __name__=='__main__':unittest.main()
