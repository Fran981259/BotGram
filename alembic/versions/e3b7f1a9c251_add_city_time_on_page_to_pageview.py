"""Add city, country, time_on_page, device_type to PageView

Revision ID: e3b7f1a9c251
Revises: fd2de82e095a
Create Date: 2026-10-31 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'e3b7f1a9c251'
down_revision = 'c9f2a1e8d047'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('page_views', sa.Column('city', sa.String(100), nullable=True))
    op.add_column('page_views', sa.Column('country', sa.String(100), nullable=True))
    op.add_column('page_views', sa.Column('time_on_page', sa.Integer(), nullable=True))
    op.add_column('page_views', sa.Column('device_type', sa.String(20), nullable=True))
    op.create_index('ix_page_views_city', 'page_views', ['city'])


def downgrade() -> None:
    op.drop_index('ix_page_views_city', table_name='page_views')
    op.drop_column('page_views', 'device_type')
    op.drop_column('page_views', 'time_on_page')
    op.drop_column('page_views', 'country')
    op.drop_column('page_views', 'city')
