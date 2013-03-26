
import bcrypt

from terms.server.schemata import get_sa_data

class TermsAuthPlugin(object):

    def __init__(self, config):
        self.config = config

    # IAuthenticatorPlugin
    def authenticate(self, environ, identity):
        try:
            login = identity['login']
            password = identity['password']
        except KeyError:
            return None

        data = get_sa_data(login, 'person')
        hashed = data['password']

        if bcrypt.hashpw(password, hashed) == hashed:
            return login
        return None
