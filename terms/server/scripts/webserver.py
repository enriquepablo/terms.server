#from gevent import monkey
#monkey.patch_all()

import os.path
import sys
from ConfigParser import ConfigParser
from functools import partial
from optparse import OptionParser
from io import StringIO

from bottle import Bottle

from repoze.who.middleware import PluggableAuthenticationMiddleware
from repoze.who.plugins.basicauth import BasicAuthPlugin
from repoze.who.plugins.auth_tkt import AuthTktCookiePlugin

from gevent.pywsgi import WSGIServer
from geventwebsocket.handler import WebSocketHandler

from terms.server.web import TermsServer
from terms.server.auth import TermsAuthPlugin


basicauth = BasicAuthPlugin('repoze.who')
auth_tkt = AuthTktCookiePlugin('secret', 'auth_tkt')
#redirector = RedirectorPlugin('/login.html')
#redirector.classifications = {IChallenger: ['browser']}  # only for browser
identifiers = [('auth_tkt', auth_tkt),
               ('basicauth', basicauth)]
authenticators = [('auth_tkt', auth_tkt)]
challengers = [('basicauth', basicauth)]
mdproviders = []

from repoze.who.classifiers import default_request_classifier
from repoze.who.classifiers import default_challenge_decider
log_stream = sys.stdout


def get_config(cmd_line=True):
    config = ConfigParser()
    d = os.path.dirname(sys.modules['terms.server'].__file__)
    fname = os.path.join(d, 'etc', 'terms.cfg')
    config.readfp(open(fname))
    config.read([os.path.expanduser('~/.terms.cfg'),
                 os.path.join('etc', 'terms.cfg')])
    name = 'default'
    if cmd_line:
        parser = OptionParser(usage="usage: %prog [options] [name]")
        _opt = parser.add_option
        _opt("-c", "--config", help="path to config file.")
        opt, args = parser.parse_args()
        name = args[0] if args else name
        if opt.config:
            config.read([opt.config])
    return partial(config.get, name)


def serve():
    config = get_config()

    server = TermsServer(config)

    app = Bottle()

    app.get('/')(server.index)
    app.get('/<person>/websocket')(server.ws)
    app.get('/static/<filepath:path>')(server.static)
    app.get('/terms/<type_name>')(server.get_terms)
    app.post('/terms/<term>/<ttype>')(server.post_terms)
    app.get('/subterms/<superterm>')(server.get_subterms)
    app.get('/verb/<name>')(server.get_verb)
    app.get('/facts/<facts>')(server.get_facts)
    app.post('/facts/<facts>')(server.post_fact)
    app.get('/<person>')(server.home)

    termsauth = TermsAuthPlugin(config)
    authenticators.append(('termsauth', termsauth))

    middleware = PluggableAuthenticationMiddleware(
        app,
        identifiers,
        authenticators,
        challengers,
        mdproviders,
        default_request_classifier,
        default_challenge_decider,
        log_stream=log_stream,
        log_level=config('loglevel')
        )

    host = config('http_host')
    port = int(config('http_port'))
    server = WSGIServer((host, port),
                        middleware,
                        handler_class=WebSocketHandler)
    print 'Listening for requests at %s:%d\n' % (host, port)
    server.serve_forever()
