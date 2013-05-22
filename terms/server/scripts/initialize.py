
import os
import sys

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from terms.core.utils import get_config
from terms.core.network import Network
from terms.core.compiler import Compiler
from terms.server.schemata import Schema
from terms.server.pluggable import load_plugins, get_plugins
from terms.server.pluggable import ImportRegistry, Base


def import_ontologies(config, session, kb):
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
        for fname in sorted(os.listdir(dirname)):
            if fname.endswith('.trm'):
                name = 'terms:' + fname[:-4]
                try:
                    session.query(ImportRegistry, name==name).one()
                except NoResultsFound:
                    path = os.path.join(dirname, fname)
                    with f as open(path, 'r'):
                        trms = f.read()
                    sentences = trms.split('.')
                    sentences = [sen.strip() + '.' for sen in sentences]
                    for sen in sentences:
                        kb.send_bytes(sen)
                        for fact in iter(kb.recv_bytes, 'END'):
                            pass
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
        dirname = os.path.join(os.path.dirname(module.__file__), 'exec_globals')
        for fname in sorted(os.listdir(dirname)):
            if fname.endswith('.py'):
                name = 'execs:' + fname[:-3]
                try:
                    session.query(ImportRegistry, name==name).one()
                except NoResultsFound:
                    path = os.path.join(dirname, fname)
                    with f as open(path, 'r'):
                        eg = f.read()
                    kb.send_bytes('_exec_global:' + eg)
                    for fact in iter(kb.recv_bytes, 'END'):
                        pass
                    ir = ImportRegistry(name)
                    session.add(ir)


def init_terms():
    config = get_config()
    address = '%s/%s' % (config['dbms'], config['dbname'])
    load_plugins(config)
    engine = create_engine(address)
    Schema.metadata.create_all(engine)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    if config['plugins']:
        kb = Client((self.config('kb_host'),
                     int(self.config('kb_port'))))
        import_ontologies(config, session, kb)
        import_execglobals(config, session, kb)
        kb.close()
    session.commit()
    session.close()
    sys.exit('Created knowledge store %s' % config['dbname'])
