"""Add category_corrections table

Revision ID: c9f2a1e8d047
Revises: b3a8e4f7c2d1
Create Date: 2026-10-24 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'c9f2a1e8d047'
down_revision = 'b3a8e4f7c2d1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'category_corrections',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('article_id', sa.Integer(), sa.ForeignKey('news_articles.id', ondelete='CASCADE'), nullable=False),
        sa.Column('original_category', sa.String(length=50), nullable=False),
        sa.Column('corrected_category', sa.String(length=50), nullable=False),
        sa.Column('used_in_training', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_category_corrections_article_id', 'category_corrections', ['article_id'])
    op.create_index('ix_category_corrections_used_in_training', 'category_corrections', ['used_in_training'])


def downgrade() -> None:
    op.drop_index('ix_category_corrections_used_in_training', table_name='category_corrections')
    op.drop_index('ix_category_corrections_article_id', table_name='category_corrections')
    op.drop_table('category_corrections')
