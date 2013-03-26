'''
Sqlalchemy models corresponding to
nouns defined in the ontology.
'''
from sqlalchemy import String, Text

from colanderalchemy import SQLAlchemySchemaNode

from terms.server.schemata import Schema, Column


class Person(Schema):

    name = Column(String(20),
                  terms_schema_type='text',
                  terms_schema_caption='Name',
                  terms_schema_order='1')
    surname = Column(String(20),
                     terms_schema_type='text',
                     terms_schema_caption='Surname',
                     terms_schema_order='2')
    password = Column(String(20),
                      terms_schema_type='password',
                      terms_schema_caption='Password',
                      terms_schema_order='3')

PersonSchema = SQLAlchemySchemaNode(Person)


class Document(Schema):

    title = Column(String(),
                      terms_schema_type='text',
                      terms_schema_caption='Title',
                      terms_schema_order='1')
    body = Column(Text(),
                      terms_schema_type='textarea',
                      terms_schema_caption='Body text',
                      terms_schema_order='2')

DocumentSchema = SQLAlchemySchemaNode(Document)
