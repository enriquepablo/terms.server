from json import loads

from terms.server.utils import ask_kb
from terms.server.registry import register, localdata


@register('(view Person1, what Content1)')
def view(config, match):
    msg = '_data_get:' + match['Content1']
    data = ask_kb(config, msg)
    data = loads(data)
    html = ''
    for k in data:
        if k == '_id':
            continue
        html += '<h2>%s</h2><p>%s</p>' % (k, data[k])
    return {'type': 'html', 'data': html}
