
from terms.server.scripts.webserver import get_config
from terms.server.utils import terms_client


def client():
    config = get_config(False)
    terms_client(config)
