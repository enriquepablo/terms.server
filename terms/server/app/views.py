# -*- encoding: utf8 -*-
import json
import os.path
from multiprocessing.connection import Client

from terms.server.utils import ask_kb
from terms.server.registry import register, localdata, apply_fact
from terms.server.schemata import get_data, set_data, Session, get_form
from terms.server.schemata import get_schema
import pkg_resources

from deform.exception import ValidationFailure
from webob import Request
from mako.template import Template
from deform import Button
from deform.widget import HiddenWidget
from geventwebsocket import WebSocketError
from deform import Form


def get_template(name):
    template = pkg_resources.resource_string(__name__, name)
    return Template(template)


# views get a kb conn, a session to data, a threadlocal with cached data and
# userswsocks

@register('(view Person1, what Content1)')
def view(tserver, match, fact):
    user = match['Person1']
    name = match['Content1']
    data = get_data(name)
    template = get_template('templates/%s_view.html' % data.ntype)
    return template.render(data=data, name=name, user=user, ask_kb=ask_kb, config=tserver.config, json=json)

@register('(view-profile Person1, of Person2)')
def view_profile(tserver, match, fact):
    name = match['Person2']
    data = get_data(name)
    template = get_template('templates/profile_view.html')
    return template.render(data=data)


@register('(edit Person1, what Content1)')
def edit(tserver, match, fact):
    assertion = '(save %(Person1)s, what %(Content1)s)' % match
    name = match['Content1']
    btn = Button(name='assertion', title='Save', value=assertion)
    form = get_form(name, buttons=(btn,))
    template = get_template('templates/edit.html')
    return template.render(form=form)


@register('(edit-profile Person1, of Person2)')
def edit_profile(tserver, match, fact):
    assertion = '(save-profile %(Person1)s, of %(Person2)s)' % match
    name = match['Person2']
    btn = Button(name='assertion', title='Save', value=assertion)

    data = get_data(name)
    schema = get_schema('person', form=True)
    if data.password:
        schema.get('password').widget = HiddenWidget()
    appstruct = schema.dictify(data)

    form = Form(schema, buttons=(btn,))
    template = get_template('templates/edit.html')
    return template.render(form=form.render(appstruct))


@register('(save Person1, what Content1)')
def save(tserver, match, fact):
    name = match['Content1']
    data = localdata.data or []
    data = {o['name']: o['value'] for o in data}
    if data:
        set_data(name, data)
    return 'OK'


@register('(save-profile Person1, of Person2)')
def save_profile(tserver, match, fact):
    name = match['Person2']
    data = localdata.data or []
    schema = get_schema('person', form=True)
    form = Form(schema)
    try:
        data = [(o['name'], o['value']) for o in data]
        data = form.validate(data)
    except ValidationFailure as e:
        return form.render()
    if data:
        set_data(name, data)
    return 'OK'


@register('(list-folder Person1, what Folder1)')
def list_folder(tserver, match, fact):
    name = match['Folder1']
    user = match['Person1']
    q = '(is-placed Content1, in %s)?' % name
    resp = ask_kb(tserver.config, q)
    resp = json.loads(resp)
    data = get_data(name)
    template = get_template('templates/list-folder.html')
    return template.render(contents=resp, data=data, user=user, name=name)


@register('(tell Person1, who Person2, what Exist1)')
def tell(tserver, match, fact):
    name = match['Person2']
    if name in tserver.wss:
        template = get_template('templates/tell.html')
        subview = apply_fact(tserver, match['Exist1']['orig'])  ## XXX Security alert. the teller is not necessarily cleared for match['Exists1']['orig']
        toweb = {'fact': fact, 'html': subview['html']}
        try:
            with tserver.wss[name][0]:
                tserver.wss[name][1].send(json.dumps(toweb).encode('utf8'))
        except WebSocketError:
            pass
    return 'OK'
