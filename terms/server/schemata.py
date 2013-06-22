import json

from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy import String, Integer, Column, Sequence, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.declarative.api import DeclarativeMeta
from sqlalchemy.orm.exc import NoResultFound
from sqlalchemy.inspection import inspect

from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session
from sqlalchemy.orm import sessionmaker

from deform import Form


class Base(object):

    @declared_attr
    def __tablename__(cls):
        return cls.__name__.lower()

    def __init__(self, name, **kwargs):
        self._id = name
        self.edit(**kwargs)

    def edit(self, **kwargs):
        for k in kwargs:
            setattr(self, k, kwargs[k])

    def jsonify(self):
        keys = self.__class__.__table__.columns.keys()
        data = {k: getattr(self, k) for k in keys}
        return json.dumps(data)

Base = declarative_base(cls=Base)


class TermsMeta(DeclarativeMeta):
    def __new__(cls, classname, bases, dict_):
        cls = super(DeclarativeMeta, cls).__new__(cls, classname, bases, dict_)
        if classname != 'Schema':
            cls.id = Column(Integer, ForeignKey('schema.id'), primary_key=True)
            cls.__mapper_args__ = {'polymorphic_identity': classname.lower()}
        return cls


class Schema(Base):
    '''
    '''
    id = Column(Integer, Sequence('schema_id_seq'), primary_key=True)
    _id = Column(String, index=True)

    ntype = Column(String)
    __mapper_args__ = {'polymorphic_on': ntype}

    __metaclass__ = TermsMeta


Session = None


def init_session(config):
    global Session
    if Session is None:
        address = '%s/%s' % (config('dbms'), config('dbname'))
        engine = create_engine(address)
        session_factory = sessionmaker(bind=engine)
        Session = scoped_session(session_factory)


class SchemaNotFound(Exception):
    pass


def get_schema(noun, form=False):
    noun = noun.title()
    if form:
        noun += 'Schema'
    schema = globals().get(noun, None)
    if schema:
        return schema
    raise SchemaNotFound(noun)


def get_form(name, buttons):
    data = get_data(name)
    schema = get_schema(data.ntype, form=True)
    form = Form(schema, buttons=buttons)
    appstruct = schema.dictify(data)
    return form.render(appstruct)


def create_data(name, ttype):
    schema = get_schema(ttype)
    data = schema(_id=name)
    session = Session()
    session.add(data)
    session.commit()


def get_data(name):
    session = Session()
    return session.query(Schema).filter_by(_id=name).one()


def set_data(name, data):
    session = Session()
    item = session.query(Schema).filter_by(_id=name).one()
    item.edit(**data)
    session.commit()
