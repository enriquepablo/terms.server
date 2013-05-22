
from importlib import import_module
import terms.server.schemata


def get_plugin_names(config):
    plugins = [p.strip() for p in config('plugins').strip().split('\n') if p]
    plugins.append('terms.server.app')
    return plugins


def load_plugins(config):
    plugins = get_plugin_names(config)
    for plugin in plugins:
        schemata = import_module(plugin + '.schemata')
        terms.server.schemata.__dict__.update(schemata.__dict__)
        import_module(plugin + '.views')