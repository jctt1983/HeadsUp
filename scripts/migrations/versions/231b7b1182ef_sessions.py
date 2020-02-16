"""sessions

Revision ID: 231b7b1182ef
Revises: 7d87ed1b0f63
Create Date: 2020-02-16 06:07:27.545417

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '231b7b1182ef'
down_revision = '7d87ed1b0f63'
branch_labels = None
depends_on = None


# CREATE TABLE sessions (
# 	id INTEGER NOT NULL AUTO_INCREMENT,
# 	session_id VARCHAR(255),
# 	data BLOB,
# 	expiry DATETIME,
# 	PRIMARY KEY (id),
# 	UNIQUE (session_id)
# )


def upgrade():
    op.create_table('sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.String(255), nullable=False),
        sa.Column('data', sa.LargeBinary(), nullable=True),
        sa.Column('expiry', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        mysql_collate=u'utf8_unicode_ci',
        mysql_default_charset=u'utf8',
        mysql_engine=u'InnoDB')
    op.create_index(op.f('ix_session_id'), 'sessions', ['session_id'], unique=True)


def downgrade():
    op.drop_table('comments')
