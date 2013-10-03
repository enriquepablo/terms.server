'''
Sqlalchemy models corresponding to
nouns defined in the ontology.
'''
import bcrypt

from sqlalchemy import Column, String, Text
from colander import null
from colanderalchemy import SQLAlchemySchemaNode
from deform.widget import RichTextWidget, HiddenWidget, CheckedInputWidget

from terms.server.schemata import Schema


class Person(Schema):

    name = Column(String())
    surname = Column(String())
    password = Column(String())

PersonSchema = SQLAlchemySchemaNode(Person)

PersonSchema.get('id').widget = HiddenWidget()
PersonSchema.get('_id').widget = HiddenWidget()
PersonSchema.get('ntype').widget = HiddenWidget()


class PasswordWidget(CheckedInputWidget):
    template = 'checked_password'
    readonly_template = 'readonly/checked_password'
    mismatch_message = 'Password did not match confirm'
    size = None

    def deserialize(self, field, pstruct):
        value = super(PasswordWidget, self).deserialize(field, pstruct)
        if isinstance(value, basestring) and len(value) == 60:
            return value
        try:
            return bcrypt.hashpw(value, bcrypt.gensalt())
        except TypeError:
            return value


PersonSchema.get('password').widget = PasswordWidget()


class Document(Schema):

    title = Column(String())
    body = Column(Text())

DocumentSchema = SQLAlchemySchemaNode(Document)

DocumentSchema.get('id').widget = HiddenWidget()
DocumentSchema.get('_id').widget = HiddenWidget()
DocumentSchema.get('ntype').widget = HiddenWidget()
DocumentSchema.get('body').widget = RichTextWidget()

Folder = Document
FolderSchema = DocumentSchema


class Task(Schema):

    name = Column(String())
    description = Column(Text())

TaskSchema = SQLAlchemySchemaNode(Task)

TaskSchema.get('id').widget = HiddenWidget()
TaskSchema.get('_id').widget = HiddenWidget()
TaskSchema.get('ntype').widget = HiddenWidget()
TaskSchema.get('description').widget = RichTextWidget()

Project = Task
ProjectSchema = TaskSchema

Job = Task
JobSchema = TaskSchema
