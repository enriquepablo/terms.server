from json import dumps
from terms.server import utils

registry = []


def register(fact_pattern):
    pattern = utils.deconstruct_fact(fact_pattern)
    def wrapper(wrapped):
        registry.append((pattern, wrapped))
    return wrapper


def apply_fact(config, fact):
    data = {'title': fact, 'type': 'html', 'data': 'OK'}
    fdict = utils.deconstruct_fact(fact)
    if fdict:
        for pattern in registry:
            match = utils.cover(pattern[0], fdict)
            if match:
                data.update(pattern[1](config, match))
    return dumps(data)


from threading import local

localdata = local()
