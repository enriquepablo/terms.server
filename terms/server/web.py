#from gevent import monkey
#monkey.patch_all()

import sys
import os.path
from bottle import request, abort, redirect, static_file


STATIC = os.path.join(os.path.dirname(sys.modules['terms.server'].__file__),
                      'static')


from threading import Thread, Lock
from multiprocessing.connection import Client

#from gevent.pywsgi import WSGIServer
#from geventwebsocket import WebSocketHandler


class TermsWorker(Thread):

    def __init__(self, wsock, wslock, totell, config):
        self.wsock = wsock
        self.wslock = wslock
        self.totell = totell
        self.config = config
        self.init_actions()

    def init_actions(self):
        '''get_actions from plugins'''

    def run(self):
        kb = Client((self.config['kb_host'], int(self.config['kb_port'])))
        totell = self.totell.decode('ascii')
        kb.send_bytes(totell)
        for fact in iter(kb.recv_bytes, b'END'):
            toweb = self.web_transform(fact)
            try:
                with self.wslock:
                    self.wsock.send(toweb.encode('ascii'))
            #except WebSocketError:
            except Exception:
                break
        kb.close()

    def web_transform(self, fact):
        return fact


class TermsServer(object):

    def __init__(self, config):
        self.config = config

    def index(self):
        username = request.environ.get('REMOTE_USER')
        if not username:
            abort(401)
        redirect('/' + username)

    def admin(self):
        return static_file('index.html', root=STATIC, mimetype='text/html')

    def static(self, filepath):
        return static_file(filepath, root=STATIC)

    def ask_kb(self, q):
        conn = Client((self.config['kb_host'],
                       int(self.config['kb_port'])))
        conn.send_bytes(q)
        terms = conn.recv_bytes()
        conn.close()
        return terms

    def get_terms(self, type_name):
        msg = ('_metadata:getwords:' + type_name).encode('ascii')
        return self.ask_kb(msg)

    def get_subterms(self, superterm):
        msg = ('_metadata:getsubwords:' + superterm).encode('ascii')
        return self.ask_kb(msg)

    def get_verb(self, name):
        msg = ('_metadata:getverb:' + name).encode('ascii')
        return self.ask_kb(msg)

    def get_facts(self, facts):
        msg = facts + '?'
        return self.ask_kb(msg)

    def home(self, person):
        username = request.environ.get('REMOTE_USER')
        if person != username:
            abort(401)
        wsock = request.environ.get('wsgi.websocket')
        if not wsock:
            abort(400)
        wslock = Lock()

        while True:
            try:
                message = wsock.receive()
                worker = TermsWorker(wsock, wslock, message, self.config)
                worker.start()
            #except WebSocketError:
            except Exception:
                break
