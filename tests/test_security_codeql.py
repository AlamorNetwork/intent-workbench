import io
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import server

class PathSecurityTests(unittest.TestCase):
    def test_reject_path_traversal_and_bad_project_ids(self):
        for bad in ('../outside', '/tmp/outside', 'a'*31 + '/', 'A'*32, 'x'*32, 'a'*32+'../'):
            with self.subTest(bad=bad), self.assertRaises(ValueError):
                server.project_dir(bad)

    def test_reject_unsafe_image_names(self):
        pid = 'a'*32
        for bad in ('../../config.json', '../secret.png', '/tmp/image.png',
                    'abc.png', 'b'*32+'.svg', 'b'*32+'.png/../../a'):
            with self.subTest(bad=bad), self.assertRaises(ValueError):
                server.upload_file(pid, bad)

    def test_existing_invalid_legacy_image_is_not_read(self):
        self.assertIsNone(server.existing_upload('a'*32, '../secret.png'))

    def test_symlink_upload_escape(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)
            with patch.object(server, 'DATA', root/'data'):
                pid='a'*32
                (root/'data'/pid).mkdir(parents=True)
                (root/'outside').mkdir()
                (root/'data'/pid/'uploads').symlink_to(root/'outside', target_is_directory=True)
                with self.assertRaises(ValueError):
                    server.upload_file(pid, 'b'*32+'.png')

    def test_project_symlink_escape(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)
            (root/'data').mkdir()
            (root/'outside').mkdir()
            (root/'data'/('a'*32)).symlink_to(root/'outside', target_is_directory=True)
            with patch.object(server, 'DATA', root/'data'):
                with self.assertRaises(ValueError):
                    server.project_dir('a'*32)

class HeaderSecurityTests(unittest.TestCase):
    def test_reject_header_injection(self):
        for payload in ('ok\r\nX-Evil: true', 'ok\nInjected:1', 'ok\rInjected:1', 'ok\x00bad'):
            with self.subTest(payload=payload), self.assertRaises(ValueError):
                server.safe_header_value(payload)

    def test_reject_untrusted_header_before_writing_response(self):
        handler = object.__new__(server.Handler)
        handler.wfile = io.BytesIO()
        with self.assertRaises(ValueError):
            handler.send(200, {'ok': True}, headers={'X-Example': 'yes\r\nX-Evil: 1'})
        self.assertEqual(handler.wfile.getvalue(), b'')

if __name__ == '__main__':
    unittest.main()
