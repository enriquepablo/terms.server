# Copyright (c) 2007-2012 by Enrique Pérez Arnaud <enriquepablo@gmail.com>
#
# This file is part of the terms project.
# https://github.com/enriquepablo/terms
#
# The terms project is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# The terms project is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with any part of the terms project.
# If not, see <http://www.gnu.org/licenses/>.


from setuptools import setup, find_packages

VERSION = '0.1.0a1dev1'

setup(
    name = 'terms.server',
    version = VERSION,
    author = 'Enrique Pérez Arnaud',
    author_email = 'enriquepablo@gmail.com',
    url = 'http://pypi.python.org/terms.server',
    license = 'GNU GENERAL PUBLIC LICENSE Version 3',
    description = 'Terms services',
    long_description = (open('README.rst').read() +
                        '\n' + open('INSTALL.rst').read()) +
                        '\n' + open('SUPPORT.rst').read(),

    packages = find_packages(),
    namespace_packages = ['terms'],
    test_suite = 'nose.collector',
    include_package_data = True,

    entry_points = {
        'console_scripts': [
            'webserver = terms.server.scripts.webserver:serve',
            'initterms = terms.server.scripts.initialize:init_terms',
        ],
    },
    tests_require = [
        'Nose',
        'coverage',
    ],
    extras_require = {
        'PG': ['psycopg2 == 2.6.2',],
        },
    install_requires = [
        'setuptools==28.8.0',
        'bottle==0.12.10',
        'repoze.who==2.3',
        'gevent==1.1.2',
        'gevent-websocket==0.9.5',
        'py-bcrypt==0.4',
        'sqlalchemy==1.1.4',
        'colander==1.3.1',
        'colanderalchemy==0.3.3',
        'deform==2.0.3',
        'mako==1.0.6',
    ],
)
