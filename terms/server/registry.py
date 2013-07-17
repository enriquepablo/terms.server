from terms.server import utils

registry = []


def register(fact_pattern):
    pattern = utils.deconstruct_fact(fact_pattern)
    def wrapper(wrapped):
        registry.append((pattern, wrapped))
    return wrapper


def apply_fact(tserver, fact):
    data = {'fact': fact, 'html': 'OK'}
    fdict = utils.deconstruct_fact(fact)
    if fdict:
        for pattern in registry:
            match = utils.cover(pattern[0], fdict)
            if match:
                data['html'] = pattern[1](tserver, match, fact)
    return data


from threading import local

localdata = local()
