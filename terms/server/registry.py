from terms.server import utils

registry = {}


def register(fact_pattern):
    def wrapper(wrapped):
        registry[fact_pattern] = wrapped


def apply_fact(config, fact):
    for pattern in registry:
        match = utils.cover(pattern, fact)
        if match:
            return registry[pattern](config, match)
    return fact


from threading import local

data = local()

# en local se meten los datos en traansito pendientes de aprobacioon
