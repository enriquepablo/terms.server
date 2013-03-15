
from multiprocessing.connection import Client
import bcrypt

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

        msg = '_data_get:' + login

        conn = Client((self.config('kb_host'),
                       int(self.config('kb_port'))))
        conn.send_bytes(msg)
        recv, resp = '', ''
        while recv != 'END':
            resp = recv
            recv = conn.recv_bytes()
        conn.close()
        data = json.loads(resp)
        hashed = data['password']

        if bcrypt.hashpw(password, hashed) == hashed:
            return login
        return None
