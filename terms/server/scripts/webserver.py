#from gevent import monkey
#monkey.patch_all()

import os.path
import sys
from ConfigParser import ConfigParser
from functools import partial
from optparse import OptionParser
from io import StringIO

from bottle import Bottle

from gevent.pywsgi import WSGIServer

from terms.server.web import TermsServer


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
    app.get('/static/<filepath:path>')(server.static)

    app.get('/get-terms/<term_type>')(server.get_terms)
    app.get('/get-subterms/<super_term>')(server.get_subterms)
    app.get('/get-verb/<verb>')(server.get_verb)

    host = config('http_host')
    port = int(config('http_port'))
    server = WSGIServer((host, port), app)
    print 'Listening for requests at %s:%d\n' % (host, port)
    server.serve_forever()
