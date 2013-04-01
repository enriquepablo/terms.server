'''
Sqlalchemy models corresponding to
nouns defined in the ontology.
'''
from sqlalchemy import Column, String, Text

from colanderalchemy import SQLAlchemySchemaNode

from terms.server.schemata import Schema


class Person(Schema):

    name = Column(String(20))
    surname = Column(String(20))
    password = Column(String(20))

PersonSchema = SQLAlchemySchemaNode(Person)


class Document(Schema):

    title = Column(String())
    body = Column(Text())

DocumentSchema = SQLAlchemySchemaNode(Document)
