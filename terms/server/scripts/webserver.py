import sys
from io import StringIO

from bottle import Bottle, run

from repoze.who.middleware import PluggableAuthenticationMiddleware
from repoze.who.plugins.basicauth import BasicAuthPlugin
from repoze.who.plugins.auth_tkt import AuthTktCookiePlugin
from repoze.who.plugins.htpasswd import HTPasswdPlugin

from terms.server.web import TermsServer


io = StringIO()
salt = 'aa'
for name, password in [('admin', 'admin'), ('chris', 'chris')]:
    io.write('%s:%s\n' % (name, password))
io.seek(0)


def cleartext_check(password, hashed):
    return password == hashed
htpasswd = HTPasswdPlugin(io, cleartext_check)
basicauth = BasicAuthPlugin('repoze.who')
auth_tkt = AuthTktCookiePlugin('secret', 'auth_tkt')
#redirector = RedirectorPlugin('/login.html')
#redirector.classifications = {IChallenger: ['browser']}  # only for browser
identifiers = [('auth_tkt', auth_tkt),
               ('basicauth', basicauth)]
authenticators = [('auth_tkt', auth_tkt),
                  ('htpasswd', htpasswd)]
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
    return config[name]


def serve():
    config = get_config()

    server = TermsServer(config)

    app = Bottle()

    app.get('/')(server.index)
    app.get('/static/<filepath:path>')(server.static)
    app.get('/admin')(server.admin)
    app.get('/terms/<type_name>')(server.get_terms)
    app.get('/subterms/<superterm>')(server.get_subterms)
    app.get('/verb/<name>')(server.get_verb)
    app.get('/facts/<facts>')(server.get_facts)
    app.get('/<person>')(server.home)

    middleware = PluggableAuthenticationMiddleware(
        app,
        identifiers,
        authenticators,
        challengers,
        mdproviders,
        default_request_classifier,
        default_challenge_decider,
        log_stream=log_stream,
        log_level=config['loglevel']
        )
    run(middleware, host=config['http_host'], port=int(config['http_port']))
