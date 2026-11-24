import io,json,sys,unittest,zipfile,tempfile
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import server as app
class RequirementImageTests(unittest.TestCase):
 def test_json_reference_link_roundtrip(self):
  data={'schema_version':'1.2','project':{'title':'Photo contract','summary':'Visual project'},'requirements':[{'id':'REQ-001','title':'Dashboard','text':'Match layout','category':'ui','acceptance':'Visual review','reference_ids':['REF-001']}],'references':[{'id':'REF-001','name':'Layout','mode':'structure','related_requirements':['REQ-001'],'preserve':'layout'}]}
  p=app.import_contract(data)
  self.assertEqual(p['requirements'][0]['reference_ids'],['REF-001'])
  exported=app.portable_contract(p)
  self.assertEqual(exported['requirements'][0]['reference_ids'],['REF-001'])
  self.assertEqual(app.import_contract(exported)['requirements'][0]['reference_ids'],['REF-001'])
 def test_missing_reference_warning(self):
  p=app.import_contract({'schema_version':'1.2','project':{'title':'X','summary':'Y'},'requirements':[{'text':'Z','acceptance':'T','reference_ids':['REF-404']}]})
  self.assertIn('BROKEN_REFERENCE_LINK',{issue['code'] for issue in app.contract_audit(p)['issues']})
 def test_zip_contains_requirement_reference(self):
  with tempfile.TemporaryDirectory() as tmp:
   old=app.DATA;app.DATA=Path(tmp)
   try:
    p=app.import_contract({'schema_version':'1.2','project':{'title':'Test','summary':'Test'},'requirements':[{'id':'REQ-001','text':'Build','acceptance':'Check','reference_ids':['REF-001']}],'references':[{'id':'REF-001','name':'Photo','mode':'inspiration'}]});app.save_project(p)
    with zipfile.ZipFile(io.BytesIO(app.generate_package(p))) as z:
     self.assertIn('REF-001',z.read('ACCEPTANCE_TESTS.md').decode())
     self.assertIn('REF-001',z.read('references/REFERENCE_MAP.md').decode())
   finally:app.DATA=old
if __name__=='__main__':unittest.main()
