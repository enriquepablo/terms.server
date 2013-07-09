# -*- encoding: utf8 -*-
from json import loads, dumps
import os.path
from multiprocessing.connection import Client

from terms.server.utils import ask_kb
from terms.server.registry import register, localdata
from terms.server.schemata import get_data, set_data, Session, get_form
import pkg_resources

from mako.template import Template
from deform import Button


def get_template(name):
    template = pkg_resources.resource_string(__name__, name)
    return Template(template)


# views get a kb conn, a session to data, a threadlocal with cached data and
# userswsocks

@register('(view Person1, what Content1)')
def view(config, match, fact):
    name = match['Content1']
    data = get_data(name)
    template = get_template('templates/%s_view.html' % data.ntype)
    return template.render(data=data)


@register('(edit Person1, what Content1)')
def edit(config, match, fact):
    assertion = '(saves %(Person1)s, what %(Content1)s)' % match
    name = match['Content1']
    btn = Button(name='assertion', title='Save', value=assertion)
    form = get_form(name, buttons=(btn,))
    template = get_template('templates/edit.html')
    return template.render(form=form)


@register('(saves Person1, what Content1)')
def saves(config, match, fact):
    name = match['Content1']
    data = localdata.data or []
    data = {o['name']: o['value'] for o in data}
    set_data(name, data)
    return 'OK'


@register('(list-folder Person1, what Folder1)')
def list_folder(config, match, fact):
    name = match['Folder1']
    user = match['Person1']
    kb = Client((config('kb_host'),
                    int(config('kb_port'))))
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
