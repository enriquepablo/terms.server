import json

from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy import String
from sqlalchemy import Column as SAColumn
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm.exc import NoResultFound
from sqlalchemy.inspection import inspect

from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session
from sqlalchemy.orm import sessionmaker


TERMS_SCHEMA_ATTRS = [('terms_schema_type', 'text'),
                      ('terms_schema_order', '1000'),
                      ('terms_schema_caption', 'text'),
                      ('terms_schema_help', 'help text')]


class Column(SAColumn):

    def __init__(self, *args, **kwargs):
        for attr in TERMS_SCHEMA_ATTRS:
            val = kwargs.get(attr[0], attr[1])
            setattr(self, attr[0], val)
            if attr[0] in kwargs:
                del kwargs[attr[0]]
        super(Column, self).__init__(*args, **kwargs)


class Schema(object):

    @declared_attr
    def __tablename__(cls):
        return cls.__name__.lower()

    _id = Column(String, primary_key=True)

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

Schema = declarative_base(cls=Schema)

Session = None


def init_session(config):
    global Session
    if Session is None:
        address = '%s/%s' % (config('dbms'), config('dbname'))
        engine = create_engine(address)
        Schema.metadata.create_all(engine)
        session_factory = sessionmaker(bind=engine)
        Session = scoped_session(session_factory)


class SchemaNotFound(Exception):
    pass


def _get_schema(noun):
    noun = noun.title()
    schema = globals().get(noun, None)
    if schema:
        return schema
    raise SchemaNotFound(noun)


def get_schema(noun, data=None):
    schema = _get_schema(noun)
    mapper = inspect(schema)
    jschema = []
    for field_name in mapper.attrs.keys():
        sfield = getattr(schema, field_name)
        if field_name == '_id':
            continue
        field = {'name': field_name,
                 'id': field_name,
                 'type': sfield.terms_schema_type,
                 'caption': sfield.terms_schema_caption}
        if data:
            field['value'] = getattr(data, field_name)
        jschema.append(field)
    return json.dumps(jschema)


def get_sa_data(name, noun, _commit=True):
    schema = _get_schema(noun)
    session = Session()
    try:
        data = session.query(schema).filter_by(_id=name).one()
    except NoResultFound:
        data = schema()
        data._id = name
        session.add(data)
        if _commit:
            session.commit()
    return data


def get_data(name, noun, mode='view'):
    data = get_sa_data(name, noun)
    if mode == 'view':
        return data.jsonify()
    elif mode == 'edit':
        return get_schema(noun, data)


def set_data(name, noun, kwargs):
    data = get_sa_data(name, noun, _commit=False)
    data.edit(**kwargs)
    session = Session()
    session.commit()
    return 'OK'
