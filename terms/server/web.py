import sys
import os.path
import json
import re
import pkg_resources
from bottle import request, abort, redirect, static_file
from terms.server.registry import apply_fact

from mako.template import Template
from mako.lookup import TemplateLookup

from threading import Thread, Lock
from multiprocessing.connection import Client

from geventwebsocket import WebSocketError

from terms.server import schemata
from terms.server.pluggable import load_plugins
from terms.server.utils import ask_kb
from terms.server.registry import localdata


MODULE_DIR = os.path.dirname(sys.modules['terms.server'].__file__)
STATIC = os.path.join(MODULE_DIR, 'static')
TEMPLATES = os.path.join(MODULE_DIR, 'templates')

template_lookup = TemplateLookup(directories=[TEMPLATES], module_directory='/tmp/mako_modules')

def serve_template(templatename, **kwargs):
    template = template_lookup.get_template(templatename)
    return template.render(**kwargs)


class TermsWorker(Thread):

    def __init__(self, wsock, wslock, user, totell, tserver):
        super(TermsWorker, self).__init__()
        self.wsock = wsock
        self.wslock = wslock
        msg = json.loads(totell)
        self.fact = msg['fact']
        self.data = msg['data']
        self.config = tserver.config
        self.tserver = tserver
        self.user = user

    def run(self):
        kb = Client((self.config('kb_host'),
                     int(self.config('kb_port'))))
        fact = self.fact
        localdata.data = self.data
        localdata.user = self.user
        if self.user == 'admin':
            fact += '.'
        else:
            fact = '(want %s, do %s).' % (self.user, fact)
        kb.send_bytes(fact)
        kb.send_bytes('FINISH-TERMS')
        for fact in iter(kb.recv_bytes, 'END'):
            toweb = apply_fact(self.tserver, fact)
            toweb = json.dumps(toweb).encode('utf8')
            try:
                with self.wslock:
                    self.wsock.send(toweb)
            except WebSocketError:
                break
        kb.close()


class TermsServer(object):

    def __init__(self, config):
        self.config = config
        self.wss = {}
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
        msg = 'lexicon:get-words:' + type_name
        return ask_kb(self.config, msg)

    def post_terms(self, term, ttype):
        msg = '%s is a %s.' % (term, ttype)
        try:
            schemata.create_data(term, ttype)
        except schemata.SchemaNotFound:
            pass
        resp = ask_kb(self.config, msg)
        if resp == term:
            un = request.environ.get('REMOTE_USER')
            resp = ask_kb(self.config,
                          '(want %s, do (initialize %s, obj %s))' % (un, un, term))
        return resp

    def get_subterms(self, superterm):
        msg = 'lexicon:get-subwords:' + superterm
        return ask_kb(self.config, msg)

    def get_verb(self, name):
        msg = 'lexicon:get-verb:' + name
        return ask_kb(self.config, msg)

    def get_facts(self, facts):
        msg = facts + '?'
        resp = ask_kb(self.config, msg)
        resp = json.loads(resp)
        return serve_template('question.html',
                               facts=facts, resp=resp)

    def post_fact(self, facts):
        msg = facts + '.'
        return ask_kb(self.config, msg)

    def home(self, person):
        ''''''
        username = request.environ.get('REMOTE_USER')
        if person != username:
            abort(401)
        return serve_template('index.html', user=person)

    def ws(self, person):
        wsock = request.environ.get('wsgi.websocket')
        if not wsock:
            abort(400)
        wslock = Lock()

        self.wss[person] = (wslock, wsock)

        while True:
            try:
                message = wsock.receive()
            except WebSocketError:
                message = None
            if message is None:
                wsock.close()
                break
            else:
                worker = TermsWorker(wsock, wslock, person, message, self)
                worker.start()
