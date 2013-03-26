from json import loads

from terms.server.utils import ask_kb
from terms.server.registry import register, localdata
from terms.server.schemata import get_data


@register('(view Person1, what Content1)')
def view(config, match):
    name =  match['Content1']
    data = get_data(name, 'document')  # XXX error
    data = loads(data)
    html = ''
    for k in data:
        if k == '_id':
            continue
        html += '<h2>%s</h2><p>%s</p>' % (k, data[k])
    return {'type': 'html', 'data': html}
