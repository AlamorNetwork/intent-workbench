import unittest, io, zipfile, sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from server import default_project, contract_audit, generate_package

class ContractTests(unittest.TestCase):
    def sample(self,mode='inspiration'):
        p=default_project('NOVA')
        p.update(summary='Dark dashboard', constraints='Theme must be dark',requirements=[dict(id='REQ-001',text='Four KPI cards',acceptance='Exactly 4 cards',policy='locked',source='user',category='ui')],references=[dict(id='REF-001',filename='missing.png',name='Bright layout',notes='Light UI',preserve='',modify='Change palette',mode=mode)])
        return p
    def test_inspiration_is_intentional(self):
        report=contract_audit(self.sample())
        self.assertEqual(0,report['summary']['blocker'])
        self.assertIn('INTENTIONAL_INSPIRATION',[v['code'] for v in report['issues']])
    def test_strict_requires_preservation(self):
        report=contract_audit(self.sample('strict'))
        self.assertFalse(report['ready_for_approval'])
        self.assertIn('STRICT_NO_PRESERVE',[v['code'] for v in report['issues']])
    def test_missing_acceptance_blocks(self):
        p=self.sample();p['requirements'][0]['acceptance']=''
        self.assertIn('MISSING_ACCEPTANCE',[v['code'] for v in contract_audit(p)['issues']])
    def test_export_role_and_audit(self):
        p=self.sample();b=generate_package(p)
        with zipfile.ZipFile(io.BytesIO(b)) as z:
            self.assertIn('CONTRACT_AUDIT.md',z.namelist())
            ref=z.read('references/REFERENCE_MAP.md').decode()
            self.assertIn('INSPIRATION',ref)
            self.assertIn('intentional divergence',z.read('CONTRACT_AUDIT.md').decode().lower())
            self.assertIn('project-intent/SKILL.md',' '.join(z.namelist()))

if __name__=='__main__':unittest.main()
