
import os
import sys
from multiprocessing.connection import Client

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm.exc import NoResultFound

from terms.server.scripts.webserver import get_config
from terms.server.schemata import Schema
from terms.server.pluggable import load_plugins, get_plugins
from terms.server.pluggable import ImportRegistry, Base


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
        dirname = os.path.join(os.path.dirname(module.__file__), 'ontology')
        files = [f for f in os.listdir(dirname) if f.endswith('.trm')]
        ordered = sorted(files, key=lambda x: int(x.split('.')[0]))
        for fname in ordered:
            if fname.endswith('.trm'):
                name = 'terms:' + fname[:-4]
                try:
                    session.query(ImportRegistry).filter(ImportRegistry.name==name).one()
                except NoResultFound:
                    path = os.path.join(dirname, fname)
                    with open(path, 'r') as f:
                        trms = f.read()
                    sentences = trms.split('.')
                    sentences = [sen.strip() + '.' for sen in sentences if sen.strip()]
                    for sen in sentences:
                        kb = Client((config('kb_host'), int(config('kb_port'))))
                        kb.send_bytes(sen)
                        for fact in iter(kb.recv_bytes, 'END'):
                            pass
                        kb.close()
                    ir = ImportRegistry(name)
                    session.add(ir)


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
                    kb.send_bytes('_exec_global:' + eg)
                    for fact in iter(kb.recv_bytes, 'END'):
                        pass
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
    session.commit()
    session.close()
    sys.exit('Created knowledge store %s' % config('dbname'))
