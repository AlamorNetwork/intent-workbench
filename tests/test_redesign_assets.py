import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class RedesignTests(unittest.TestCase):
 def test_assets_exist(self):
  for f in ('redesign.css','redesign.js','index.html'):
   self.assertTrue((ROOT/'static'/f).is_file())
 def test_navigation_and_required_ids(self):
  html=(ROOT/'static'/'index.html').read_text()
  for name in ('home-dashboard','project-list','new','import-launch','editor','requirements','bank','review','save','export','redesign.css','redesign.js'):
   self.assertIn(name,html)
 def test_static_allowlist(self):
  text=(ROOT/'server.py').read_text()
  self.assertIn("'/redesign.css'",text)
  self.assertIn("'/redesign.js'",text)
