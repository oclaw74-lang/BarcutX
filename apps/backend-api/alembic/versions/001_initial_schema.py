"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-03-24

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable PostGIS and uuid-ossp
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    # user_role enum
    op.execute("CREATE TYPE user_role AS ENUM ('client', 'barber', 'barbershop_owner', 'admin')")

    # users
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("supabase_id", sa.String(36), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("role", sa.Enum("client", "barber", "barbershop_owner", "admin", name="user_role"), nullable=False, server_default="client"),
        sa.Column("full_name", sa.String(255), nullable=True),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("avatar_url", sa.String(500), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_users_supabase_id", "users", ["supabase_id"], unique=True)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # barbershops
    op.create_table(
        "barbershops",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("owner_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(255), nullable=False),
        sa.Column("description", sa.String(1000), nullable=True),
        sa.Column("address", sa.String(500), nullable=False),
        sa.Column("city", sa.String(100), nullable=False),
        sa.Column("location", sa.Column("location", sa.String()), nullable=True),
        sa.Column("logo_url", sa.String(500), nullable=True),
        sa.Column("cover_url", sa.String(500), nullable=True),
        sa.Column("stripe_account_id", sa.String(100), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_barbershops_slug", "barbershops", ["slug"], unique=True)
    op.create_index("ix_barbershops_owner_id", "barbershops", ["owner_id"])
    # PostGIS spatial index (created after adding geometry column)
    op.execute("ALTER TABLE barbershops ALTER COLUMN location TYPE geometry(Point, 4326) USING NULL")
    op.execute("CREATE INDEX ix_barbershops_location ON barbershops USING GIST (location)")

    # business_hours
    op.create_table(
        "business_hours",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("barbershop_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("barbershops.id", ondelete="CASCADE"), nullable=False),
        sa.Column("day_of_week", sa.Integer(), nullable=False),
        sa.Column("open_time", sa.Time(), nullable=False),
        sa.Column("close_time", sa.Time(), nullable=False),
        sa.Column("is_closed", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.create_index("ix_business_hours_barbershop_id", "business_hours", ["barbershop_id"])

    # barbers
    op.create_table(
        "barbers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("barbershop_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("barbershops.id", ondelete="CASCADE"), nullable=False),
        sa.Column("bio", sa.String(500), nullable=True),
        sa.Column("photo_url", sa.String(500), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_barbers_user_id", "barbers", ["user_id"], unique=True)
    op.create_index("ix_barbers_barbershop_id", "barbers", ["barbershop_id"])

    # services
    op.create_table(
        "services",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("barbershop_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("barbershops.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.String(500), nullable=True),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_services_barbershop_id", "services", ["barbershop_id"])


def downgrade() -> None:
    op.drop_table("services")
    op.drop_table("barbers")
    op.drop_table("business_hours")
    op.execute("DROP INDEX IF EXISTS ix_barbershops_location")
    op.drop_table("barbershops")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS user_role")
