from importlib import import_module


def init_fact_views(config):
    plugins = config('plugins')
    plugins = [p for p in plugins.strip().split('\n') if p]
    plugins.append('terms.server.app')
    return [import_module(p.strip() + '.views') for p in plugins]
