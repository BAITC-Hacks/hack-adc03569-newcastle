import json
import os
import threading
import unittest
import urllib.request
import urllib.error
from unittest.mock import patch
from http.server import ThreadingHTTPServer
from server import Handler, AI_TIMES
from app.engine import DATA

class HTTPTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.httpd=ThreadingHTTPServer(('127.0.0.1',0),Handler)
        cls.thread=threading.Thread(target=cls.httpd.serve_forever,daemon=True);cls.thread.start()
        cls.base=f'http://127.0.0.1:{cls.httpd.server_port}'
    @classmethod
    def tearDownClass(cls):cls.httpd.shutdown();cls.httpd.server_close();cls.thread.join()
    def request(self,path,data=None,headers=None,raw=None):
        body=raw if raw is not None else (json.dumps(data).encode() if data is not None else None)
        heads={'Content-Type':'application/json'} if body else {}
        heads.update(headers or {})
        req=urllib.request.Request(self.base+path,data=body,headers=heads)
        try:
            with urllib.request.urlopen(req,timeout=5) as r:return r.status,r.headers,r.read()
        except urllib.error.HTTPError as e:return e.code,e.headers,e.read()
    def test_health(self):self.assertEqual(self.request('/api/health')[0],200)
    def test_bootstrap(self):
        status,h,b=self.request('/api/bootstrap');self.assertEqual(status,200)
        self.assertEqual(len(json.loads(b)['data']['measures']),14)
    def test_static(self):
        for path in ('/','/app.js','/style.css','/favicon.svg'):self.assertEqual(self.request(path)[0],200)
    def test_no_env_file(self):self.assertEqual(self.request('/.env')[0],404)
    def test_no_traversal(self):self.assertEqual(self.request('/../server.py')[0],404)
    def test_no_server_source(self):self.assertEqual(self.request('/server.py')[0],404)
    def test_simulate_valid(self):
        status,h,b=self.request('/api/simulate',{'decisions':DATA['example']})
        self.assertEqual(status,200);self.assertAlmostEqual(json.loads(b)['summary']['score'],56.54307)
    def test_invalid_has_no_score(self):
        status,h,b=self.request('/api/simulate',{'decisions':[]})
        self.assertEqual(status,422);self.assertIsNone(json.loads(b)['score'])
    def test_validation_endpoint(self):
        status,h,b=self.request('/api/validate',{'decisions':[],'complete':False})
        self.assertEqual(status,200);self.assertTrue(json.loads(b)['valid']);self.assertNotIn('score',json.loads(b))
    def test_bad_boolean(self):self.assertEqual(self.request('/api/validate',{'decisions':[],'complete':'no'})[0],400)
    def test_bad_json(self):self.assertEqual(self.request('/api/simulate',raw=b'{bad')[0],400)
    def test_large_body(self):self.assertEqual(self.request('/api/simulate',raw=b'x'*65537)[0],413)
    def test_wrong_content_type(self):self.assertEqual(self.request('/api/simulate',raw=b'{}',headers={'Content-Type':'text/plain'})[0],415)
    def test_cross_origin_denied(self):self.assertEqual(self.request('/api/simulate',{'decisions':DATA['example']},headers={'Origin':'https://evil.invalid'})[0],403)
    def test_host_rebinding_denied(self):self.assertEqual(self.request('/api/health',headers={'Host':'evil.invalid'})[0],403)
    def test_security_headers(self):
        status,h,b=self.request('/')
        self.assertEqual(h['X-Content-Type-Options'],'nosniff');self.assertIn("script-src 'self'",h['Content-Security-Policy'])
    def test_offline_endpoint(self):
        AI_TIMES.clear()
        with patch.dict(os.environ,{},clear=True):status,h,b=self.request('/api/explain',{'decisions':DATA['example'],'lang':'kk'})
        self.assertEqual(status,200);self.assertEqual(json.loads(b)['mode'],'offline')
    def test_compare_endpoint(self):self.assertEqual(self.request('/api/compare',{'a':DATA['example'],'b':DATA['example']})[0],200)
    def test_sensitivity_endpoint(self):
        status,h,b=self.request('/api/sensitivity',{'decisions':DATA['example'],'measure_id':'M7','extra_lag':1})
        self.assertEqual(status,200);self.assertIsNone(json.loads(b)['scenario_score'])
    def test_source_files_downloadable(self):
        self.assertEqual(self.request('/sources/brief.pdf')[0],200)
        self.assertEqual(self.request('/sources/dataset.docx')[0],200)
    def test_missing_endpoint(self):self.assertEqual(self.request('/api/nonexistent',{})[0],404)

if __name__=='__main__':unittest.main()
