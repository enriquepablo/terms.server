

def init_fact_views(config):
    if 'plugins' in config:
        plugins = [p for p in config['plugins'].strip().split('\n') if p]
        return [import_module(p.strip() + '.views') for p in names]
    return []
