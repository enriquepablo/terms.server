'''
Sqlalchemy models corresponding to
nouns defined in the ontology.
'''
from sqlalchemy import Column, String, Text

from colanderalchemy import SQLAlchemySchemaNode
from deform.widget import RichTextWidget, HiddenWidget

from terms.server.schemata import Schema


class Person(Schema):

    name = Column(String())
    surname = Column(String())
    password = Column(String())

PersonSchema = SQLAlchemySchemaNode(Person)


class Document(Schema):

    title = Column(String())
    body = Column(Text())

DocumentSchema = SQLAlchemySchemaNode(Document)

DocumentSchema.get('id').widget = HiddenWidget()
DocumentSchema.get('_id').widget = HiddenWidget()
DocumentSchema.get('ntype').widget = HiddenWidget()
DocumentSchema.get('body').widget = RichTextWidget()


class Task(Schema):

    name = Column(String())
    description = Column(Text())

TaskSchema = SQLAlchemySchemaNode(Task)

TaskSchema.get('id').widget = HiddenWidget()
TaskSchema.get('_id').widget = HiddenWidget()
TaskSchema.get('ntype').widget = HiddenWidget()
TaskSchema.get('description').widget = RichTextWidget()

ProjectSchema = TaskSchema

JobSchema = TaskSchema
