import sys
import os.path
import json
import re
from bottle import request, abort, redirect, static_file
from terms.server.registry import apply_fact


STATIC = os.path.join(os.path.dirname(sys.modules['terms.server'].__file__),
                      'static')


from threading import Thread, Lock
from multiprocessing.connection import Client

from geventwebsocket import WebSocketError



class TermsWorker(Thread):

    def __init__(self, wsock, wslock, totell, config):
        super(TermsWorker, self).__init__()
        self.wsock = wsock
        self.wslock = wslock
        self.totell = totell + '.'
        self.config = config
        self.init_actions()

    def init_actions(self):
        '''get_actions from plugins'''

    def run(self):
        kb = Client((self.config('kb_host'),
                     int(self.config('kb_port'))))
        #totell = self.totell.decode('ascii')
        kb.send_bytes(self.totell)
        for fact in iter(kb.recv_bytes, 'END'):
            toweb = apply_fact(self.config, fact)
            try:
                with self.wslock:
                    self.wsock.send(toweb.encode('ascii'))
            except WebSocketError:
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
        '''
        ask kb synchronously
        '''
        conn = Client((self.config('kb_host'),
                       int(self.config('kb_port'))))
        conn.send_bytes(q)
        recv, resp = '', ''
        while recv != 'END':
            resp = recv
            recv = conn.recv_bytes()
        conn.close()
        return resp

    def get_terms(self, type_name):
        msg = '_metadata:getwords:' + type_name
        return self.ask_kb(msg)

    def post_terms(self, term, type):
        msg = '%s is a %s.' % (term, type)
        return self.ask_kb(msg)

    def get_subterms(self, superterm):
        msg = '_metadata:getsubwords:' + superterm
        return self.ask_kb(msg)

    def get_verb(self, name):
        msg = '_metadata:getverb:' + name
        return self.ask_kb(msg)

    def get_facts(self, facts):
        msg = facts + '?'
        return self.ask_kb(msg)

    def post_fact(self, facts):
        msg = facts + '.'
        return self.ask_kb(msg)

    def get_schema(self, name):
        msg = '_schema_get:' + name
        return self.ask_kb(msg)

    def post_data(self, name):
        data = json.dumps({k: v for k, v in request.POST.items()})
        msg = '_data_set:%s:%s' % (name, data)
        return self.ask_kb(msg)

    def home(self, person):
        ''''''

    def ws(self):
        wsock = request.environ.get('wsgi.websocket')
        if not wsock:
            abort(400)
        wslock = Lock()

        while True:
            try:
                message = wsock.receive()
            except WebSocketError:
                message = None
            if message is None:
                wsock.close()
                break
            else:
                worker = TermsWorker(wsock, wslock, message, self.config)
                worker.start()