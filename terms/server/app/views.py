# -*- encoding: utf8 -*-
from json import loads, dumps
import os.path
from multiprocessing.connection import Client

from terms.server.utils import ask_kb
from terms.server.registry import register, localdata, apply_fact
from terms.server.schemata import get_data, set_data, Session, get_form
import pkg_resources

from mako.template import Template
from deform import Button
from geventwebsocket import WebSocketError


def get_template(name):
    template = pkg_resources.resource_string(__name__, name)
    return Template(template)


# views get a kb conn, a session to data, a threadlocal with cached data and
# userswsocks

@register('(view Person1, what Content1)')
def view(tserver, match, fact):
    name = match['Content1']
    data = get_data(name)
    template = get_template('templates/%s_view.html' % data.ntype)
    return template.render(data=data)


@register('(edit Person1, what Content1)')
def edit(tserver, match, fact):
    assertion = '(save %(Person1)s, what %(Content1)s)' % match
    name = match['Content1']
    btn = Button(name='assertion', title='Save', value=assertion)
    form = get_form(name, buttons=(btn,))
    template = get_template('templates/edit.html')
    return template.render(form=form)


@register('(save Person1, what Content1)')
def save(tserver, match, fact):
    name = match['Content1']
    data = localdata.data or []
    data = {o['name']: o['value'] for o in data}
    set_data(name, data)
    return 'OK'


@register('(list-folder Person1, what Folder1)')
def list_folder(tserver, match, fact):
    name = match['Folder1']
    user = match['Person1']
    kb = Client((tserver.config('kb_host'),
                    int(tserver.config('kb_port'))))
    q = '(is-placed Content1, in %s)?' % name
    kb.send_bytes(q)
    kb.send_bytes('FINISH-TERMS')
    resp = []
    for r in iter(kb.recv_bytes, 'END'):
        resp = loads(r)
    kb.close()
    data = get_data(name)
    template = get_template('templates/list-folder.html')
    return template.render(contents=resp, data=data, user=user, name=name)


@register('(tell Person1, who Person2, what Exists1)')
def tell(tserver, match, fact):
    name = match['Person2']
    if name in tserver.wss:
        subview = apply_fact(tserver, match['Exists1']['orig'])  ## XXX Security alert. the teller is not necessarily cleared for match['Exists1']['orig']
        toweb = {'fact': fact, 'html': subview['html']}
        try:
            with tserver.wss[name][0]:
                tserver.wss[name][1].send(dumps(toweb).encode('ascii'))
        except WebSocketError:
            pass
    return 'OK'
