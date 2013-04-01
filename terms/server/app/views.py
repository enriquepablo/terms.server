# -*- encoding: utf8 -*-
from json import loads

from terms.server.utils import ask_kb
from terms.server.registry import register, localdata
from terms.server.schemata import get_data


# views get a kb conn, a session to data, a threadlocal with cached data and
# userswsocks
# falta hacer una tabla única de contenidos cuyo _id sea único

@register('(view Person1, what Content1)')
def view(config, match):
    name =  match['Content1']
    html = get_data(name)
    return {'type': 'html', 'data': html}
