import unittest,zipfile,io,json
import server as s
class ExecutionPlanTests(unittest.TestCase):
    def sample(self):return {'schema_version':'1.4','project':{'title':'Todo Test'},'requirements':[{'id':'REQ-001','title':'Alpha','text':'Build it','acceptance':'works'}], 'tasks':[{'id':'TASK-001','title':'Do Alpha','requirement_ids':['REQ-001'],'status':'todo','acceptance':'test output'}]}
    def test_roundtrip(self):
        p=s.import_contract(self.sample());assert len(p['tasks'])==1;assert s.portable_contract(p)['tasks'][0]['title']=='Do Alpha'
    def test_done_requires_evidence(self):
        d=self.sample();d['tasks'][0]['status']='done'
        with self.assertRaises(ValueError):s.import_contract(d)
        d['tasks'][0]['evidence']='unit tests passed';assert s.import_contract(d)['tasks'][0]['status']=='done'
    def test_cycle_detection(self):
        ts=[s.norm_task({'id':'A','title':'A','depends_on':['B']},0),s.norm_task({'id':'B','title':'B','depends_on':['A']},1)]
        assert 'Circular task dependency' in s.task_issues(ts,[])
    def test_backward_compatibility(self):
        d=self.sample();d['schema_version']='1.3';del d['tasks'];assert s.import_contract(d)['tasks']==[]
    def test_export(self):
        p=s.import_contract(self.sample());b=s.generate_package(p);z=zipfile.ZipFile(io.BytesIO(b));assert 'TASK_BOARD.json' in z.namelist();assert 'EXECUTION_PLAN.md' in z.namelist();assert 'TASK-001' in z.read('EXECUTION_PLAN.md').decode();assert 'before EACH stage' in z.read('AGENTS.md').decode()
if __name__=='__main__':unittest.main()
