import unittest, sys, pathlib, json, io, zipfile
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]))
import server as s

class BankTests(unittest.TestCase):
    def sample(self):
        return {'schema_version':'1.3','project':{'title':'Bank Test'},'requirements':[],
                'bank':{'roles':[{'id':'ux-reviewer','name':'UX Reviewer','category':'design','description':'Review screens'}],
                        'skills':[{'id':'ui-review','name':'UI Review','category':'design','description':'Inspect UI','content':'Check actual screenshots.'}],
                        'documents':{'AGENT_HANDOFF.md':'# Instructions\nRead the project contract.','../escape.md':'UNSAFE'}}}
    def test_roundtrip_bank(self):
        p=s.import_contract(self.sample());self.assertEqual(len(p['bank']['roles']),1)
        self.assertNotIn('../escape.md',p['bank']['documents'])
        again=s.import_contract(s.portable_contract(p));self.assertEqual(again['bank'],p['bank'])
    def test_zip_bank(self):
        p=s.import_contract(self.sample());z=zipfile.ZipFile(io.BytesIO(s.generate_package(p)))
        self.assertIn('.agents/skills/ui-review/SKILL.md',z.namelist())
        self.assertIn('.agents/roles/ux-reviewer.md',z.namelist())
        self.assertIn('managed-docs/AGENT_HANDOFF.md',z.namelist())
        self.assertNotIn('managed-docs/../escape.md',z.namelist())
    def test_reject_unsafe_skill_ids(self):
        data=self.sample();data['bank']['skills'][0]['id']='../outside'
        with self.assertRaises(ValueError):s.import_contract(data)
    def test_old_json_import(self):
        data=self.sample();data.pop('bank');data['schema_version']='1.2'
        self.assertEqual(s.import_contract(data)['bank']['roles'],[])
    def test_prevent_overwrite_intent_skill(self):
        d=self.sample();d['bank']['skills'][0]['id']='project-intent'
        p=s.import_contract(d)
        z=zipfile.ZipFile(io.BytesIO(s.generate_package(p)))
        self.assertIn('Inspect',z.read('.agents/skills/project-intent/SKILL.md').decode())
        self.assertNotIn('Check actual screenshots.',z.read('.agents/skills/project-intent/SKILL.md').decode())
if __name__=='__main__':unittest.main()
