
import os
import sys
from multiprocessing.connection import Client
import bcrypt

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm.exc import NoResultFound

from terms.server.scripts.webserver import get_config
from terms.server.schemata import Schema
from terms.server.pluggable import load_plugins, get_plugins
from terms.server.pluggable import ImportRegistry, Base
from terms.server.app.schemata import Person


def import_ontologies(config, session):
    '''
    get directory
    cycle over trm files
        if the file name not in importregistry
            break file content on dots
            send pieces to server
            put filename in importregistry
    '''
    for module in get_plugins(config):
        fname = os.path.join(os.path.dirname(module.__file__), 'ontology', 'terms.trm')
        totell = []
        kb = Client((config('kb_host'), int(config('kb_port'))))
        with open(fname, 'r') as f:
            for line in f.readlines():
                if line:
                    kb.send_bytes(line)
        kb.send_bytes('FINISH-TERMS')
        for fact in iter(kb.recv_bytes, 'END'):
            print(fact)
        kb.close()


def import_exec_globals(config, session):
    '''
    get exec_globals directory
    cycle over its files
        if the file name not in importregistry
            send its contents to server
            put filename in importregistry
    '''
    for module in get_plugins(config):
        dirname = os.path.join(os.path.dirname(module.__file__),
                               'exec_globals')
        for fname in sorted(os.listdir(dirname)):
            if fname.endswith('.py'):
                name = 'execs:' + fname[:-3]
                try:
                    session.query(ImportRegistry).filter(ImportRegistry.name==name).one()
                except NoResultFound:
                    path = os.path.join(dirname, fname)
                    with open(path, 'r') as f:
                        eg = f.read()
                    kb = Client((config('kb_host'), int(config('kb_port'))))
                    kb.send_bytes('compiler:exec_globals:' + eg)
                    kb.send_bytes('FINISH-TERMS')
                    for fact in iter(kb.recv_bytes, 'END'):
                        print(fact)
                    kb.close()
                    ir = ImportRegistry(name)
                    session.add(ir)


def init_terms():
    config = get_config()
    address = '%s/%s' % (config('dbms'), config('dbname'))
    load_plugins(config)
    engine = create_engine(address)
    Schema.metadata.create_all(engine)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    import_ontologies(config, session)
    import_exec_globals(config, session)
    pass1 = 'admin'
#    we need defaults for automated scripts here
#    pass1, pass2 = '', ' '
#    while pass1 != pass2:
#        pass1 = raw_input('Enter a password for the admin user: ')
#        pass2 = raw_input('Repeat it: ')
    password = bcrypt.hashpw(pass1, bcrypt.gensalt())
    admin = Person(_id='admin', name='admin', surname='superuser', password=password)
    session.add(admin)
    session.commit()
    session.close()
    sys.exit('Created knowledge store %s' % config('dbname'))
