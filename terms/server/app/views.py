# -*- encoding: utf8 -*-
from json import loads
import os.path

from terms.server.utils import ask_kb
from terms.server.registry import register, localdata
from terms.server.schemata import get_data, Session, get_form
import pkg_resources

from mako.template import Template
from deform import Button


def get_template(name):
    template = pkg_resources.resource_string(__name__, name)
    return Template(template)


# views get a kb conn, a session to data, a threadlocal with cached data and
# userswsocks

@register('(view Person1, what Content1)')
def view(config, match):
    name = match['Content1']
    html = get_data(name)
    return {'type': 'html', 'data': html}


@register('(edit Person1, what Content1)')
def edit(config, match):
    name = match['Content1']
    assertion = '(save %(Person1)s, what %(Content1)s)' % match
    btn = Button(name='assertion', title=assertion, value=assertion)
    form = get_form(name, buttons=(btn,))
    template = get_template('templates/edit.html')
    return template.render(form=form,
                           assertion=assertion)
