import sys
from bottle import run, install
from terms.robots.robot import TermsPlugin
from terms.core.utils import get_config

def main():
    config = get_config()
    tplugin = TermsPlugin(config)
    install(tplugin)
    host = 'http_host' in config and config['http_host'] or 'localhost'
    port = 'http_port' in config and config['http_port'] or 8080
    debug = 'debug' in config and config.getboolean('debug') or False
    run(host=host, port=port, debug=debug)
