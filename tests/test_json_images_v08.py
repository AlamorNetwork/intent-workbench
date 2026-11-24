import unittest, sys, tempfile, base64, json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import server as s

PNG=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=')
class ImageJSONTests(unittest.TestCase):
    def sample(self):
        return {'schema_version':'1.5','project':{'title':'Demo','summary':'A sample project'},
            'requirements':[{'id':'REQ-001','title':'Layout','text':'Layout','acceptance':'Visual review'}],
            'references':[{'id':'REF-001','name':'Sample','mode':'inspiration','related_requirements':['REQ-001'],
                           'image_data':'data:image/png;base64,'+base64.b64encode(PNG).decode()}]}
    def test_reverse_link_in_import(self):
        p=s.import_contract(self.sample());self.assertIn('REF-001',p['requirements'][0]['reference_ids'])
    def test_embedded_round_trip(self):
        with tempfile.TemporaryDirectory() as d:
            old=s.DATA;s.DATA=Path(d)
            try:
                original=self.sample();p=s.import_contract(original);s.restore_embedded_images(p,original);s.save_project(p)
                obj=s.portable_contract(p,embed_images=True)
                self.assertEqual(obj['references'][0]['image_status'],'attached')
                self.assertTrue(obj['references'][0]['image_data'].startswith('data:image/png;base64,'))
                new=s.import_contract(obj);s.restore_embedded_images(new,obj)
                self.assertTrue((s.project_dir(new['id'])/'uploads'/new['references'][0]['filename']).exists())
                self.assertIn('REF-001',new['requirements'][0]['reference_ids'])
            finally:s.DATA=old
    def test_url_only_not_mistaken_for_attachment(self):
        a=self.sample();a['references'][0].pop('image_data');a['references'][0]['url']='https://example.test/ref.png'
        p=s.import_contract(a);obj=s.portable_contract(p,embed_images=True)
        self.assertEqual(obj['references'][0]['image_status'],'external_url_only')
        self.assertNotIn('image_data',obj['references'][0])
    def test_reject_fake_embedded_image(self):
        a=self.sample();a['references'][0]['image_data']='data:image/png;base64,'+base64.b64encode(b'NOT PNG').decode()
        with self.assertRaises(ValueError):s.restore_embedded_images(s.import_contract(a),a)
if __name__=='__main__':unittest.main()
