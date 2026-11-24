import unittest,sys,io,zipfile,json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import server as s
class VisualJourneyTests(unittest.TestCase):
 def sample(self):
  return {'schema_version':'1.2','project':{'title':'Test Visual'},'requirements':[{'id':'REQ-001','text':'Screen','acceptance':'Must be visible','category':'ui'}], 'screens':[{'id':'UI-001','name':'Home','role':'required','layout':'Top bar and content','acceptance':'Screenshot review','related_requirements':['REQ-001']}], 'journeys':[{'id':'UAT-001','name':'Launch','steps':'Open app','expected':'Home appears','status':'fail'}]}
 def test_round_trip(self):
  p=s.import_contract(self.sample());self.assertEqual(p['screens'][0]['name'],'Home');self.assertEqual(p['journeys'][0]['status'],'fail');self.assertEqual(s.portable_contract(p)['schema_version'],'1.6')
 def test_audit_user_failure(self):
  p=s.import_contract(self.sample());a=s.contract_audit(p);self.assertIn('UAT_FAILURE',[i['code'] for i in a['issues']])
 def test_export_documents(self):
  p=s.import_contract(self.sample());s.save_project(p)
  packed=s.generate_package(p)
  with zipfile.ZipFile(io.BytesIO(packed)) as z:
   self.assertIn('VISUAL_INTENT.md',z.namelist());self.assertIn('USER_JOURNEYS.md',z.namelist())
   self.assertIn('Top bar',z.read('VISUAL_INTENT.md').decode());self.assertIn('fail',z.read('USER_JOURNEYS.md').decode())
 def test_v03_backward_compatibility(self):
  x={'schema_version':'1.1','project':{'title':'Old'},'requirements':[]}
  p=s.import_contract(x);self.assertEqual(p['screens'],[]);self.assertEqual(p['journeys'],[])
 def test_required_screen_missing_layout_blocks(self):
  x=self.sample();x['screens'][0]['layout']=''
  p=s.import_contract(x);self.assertIn('VISUAL_LAYOUT_MISSING',[i['code'] for i in s.contract_audit(p)['issues']])
if __name__=='__main__':unittest.main()
