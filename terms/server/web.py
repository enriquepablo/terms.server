import sys
import os.path
from bottle import static_file

from terms.server.kb import ask_kb


MODULE_DIR = os.path.dirname(sys.modules['terms.server'].__file__)
STATIC = os.path.join(MODULE_DIR, 'static')


class TermsServer(object):

    def __init__(self, config):
        self.config = config

    def index(self):
        return static_file('index.html', root=STATIC)

    def static(self, filepath):
        return static_file(filepath, root=STATIC)

    def get_terms(self, term_type):
        msg = 'lexicon:get-words:' + term_type
        return ask_kb(self.config, msg)

    def get_subterms(self, super_term):
        msg = 'lexicon:get-subwords:' + super_term
        return ask_kb(self.config, msg)

    def get_verb(self, verb):
        msg = 'lexicon:get-verb:' + verb
        return ask_kb(self.config, msg)
