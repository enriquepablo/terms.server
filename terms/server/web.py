import sys
import os.path
import json
import re
import pkg_resources
from bottle import request, abort, redirect, static_file
from terms.server.registry import apply_fact

from mako.template import Template


STATIC = os.path.join(os.path.dirname(sys.modules['terms.server'].__file__),
                      'static')


def get_template(name):
    template = pkg_resources.resource_string(__name__, name)
    return Template(template)


from threading import Thread, Lock
from multiprocessing.connection import Client

from geventwebsocket import WebSocketError

from terms.server import schemata
from terms.server.pluggable import load_plugins
from terms.server.utils import ask_kb
from terms.server.registry import localdata


class TermsWorker(Thread):

    def __init__(self, wsock, wslock, totell, config, user):
        super(TermsWorker, self).__init__()
        self.wsock = wsock
        self.wslock = wslock
        msg = json.loads(totell)
        self.fact = msg['fact']
        self.data = msg['data']
        self.config = config
        self.user = user

    def run(self):
        kb = Client((self.config('kb_host'),
                     int(self.config('kb_port'))))
        #totell = self.totell.decode('ascii')
        fact = self.fact
        localdata.data = self.data
        localdata.user = self.user
        if self.user != 'admin':
            fact = '(wants %s, do %s).' % (self.user, fact)
        kb.send_bytes(fact)
        for fact in iter(kb.recv_bytes, 'END'):
            toweb = apply_fact(self.config, fact)
            try:
                with self.wslock:
                    self.wsock.send(toweb.encode('ascii'))
            except WebSocketError:
                break
        kb.close()


class TermsServer(object):

    def __init__(self, config):
        self.config = config
        load_plugins(config)
        schemata.init_session(config)

    def index(self):
        username = request.environ.get('REMOTE_USER')
        if not username:
            abort(401)
        redirect('/' + username)

    def static(self, filepath):
        return static_file(filepath, root=STATIC)

    def get_terms(self, type_name):
        msg = '_metadata:getwords:' + type_name
        return ask_kb(self.config, msg)

    def post_terms(self, term, ttype):
        msg = '%s is a %s.' % (term, ttype)
        try:
            schemata.create_data(term, ttype)
        except schemata.SchemaNotFound:
            pass
        return ask_kb(self.config, msg)

    def get_subterms(self, superterm):
        msg = '_metadata:getsubwords:' + superterm
        return ask_kb(self.config, msg)

    def get_verb(self, name):
        msg = '_metadata:getverb:' + name
        return ask_kb(self.config, msg)

    def get_facts(self, facts):
        msg = facts + '?'
        return ask_kb(self.config, msg)

    def post_fact(self, facts):
        msg = facts + '.'
        return ask_kb(self.config, msg)

    def home(self, person):
        ''''''
        template = get_template('static/index.html')
        return template.render(user=person)

    def ws(self):
        wsock = request.environ.get('wsgi.websocket')
        user = request.environ.get('REMOTE_USER')
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
                worker = TermsWorker(wsock, wslock, message, self.config, user)
                worker.start()
