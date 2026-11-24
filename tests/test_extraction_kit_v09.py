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
    def test_velvet_enriched_content_export(self):
        d=json.loads(pathlib.Path('/mnt/data/Velvet_Intent_Complete_Draft_v0.9.json').read_text())
        p=s.import_contract(d)
        self.assertEqual(len(p['screens']),10)
        self.assertEqual(len(p['journeys']),6)
        self.assertEqual(len(p['bank']['roles']),8)
        self.assertTrue(all(j['status']=='not_run' for j in p['journeys']))
        z=zipfile.ZipFile(io.BytesIO(s.generate_package(p)))
        self.assertIn('VISUAL_INTENT.md',z.namelist())
        self.assertIn('USER_JOURNEYS.md',z.namelist())
        self.assertIn('AGENT_ROLE_REGISTRY.md',z.namelist())
if __name__=='__main__':unittest.main()
