"""
alembic/versions/001_initial_schema.py
Initial database migration:
- Creates users, orders, audit_logs tables
- Seeds one admin user: admin / Admin@123
- Seeds one regular user: user1 / User@1234
"""
from typing import Sequence, Union
import uuid
from datetime import datetime, timezone

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Create orderstatus enum ───────────────────────────────────────────────
    op.execute(
        "CREATE TYPE orderstatus AS ENUM ('Pending', 'Processing', 'Completed', 'Cancelled')"
    )

    # ── Users Table ───────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("username", sa.String(50), nullable=False, unique=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("role", sa.String(20), nullable=False, server_default="user"),
        sa.Column("is_deleted", sa.Boolean, nullable=False, server_default="false"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_users_username", "users", ["username"])
    op.create_index("ix_users_email", "users", ["email"])

    # ── Orders Table ──────────────────────────────────────────────────────────
    op.create_table(
        "orders",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("customer_name", sa.String(255), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(10), nullable=False, server_default="INR"),
        sa.Column("usd_amount", sa.Numeric(12, 2), nullable=True),
        sa.Column(
            "status",
            postgresql.ENUM(
                "Pending", "Processing", "Completed", "Cancelled",
                name="orderstatus",
                create_type=False,
            ),
            nullable=False,
            server_default="Pending",
        ),
        sa.Column("is_deleted", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("created_by", sa.String(36), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_orders_status", "orders", ["status"])
    op.create_index("ix_orders_created_at", "orders", ["created_at"])
    op.create_index("ix_orders_customer_name", "orders", ["customer_name"])
    op.create_index("ix_orders_is_deleted", "orders", ["is_deleted"])

    # ── Audit Logs Table ──────────────────────────────────────────────────────
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("entity_type", sa.String(50), nullable=False),
        sa.Column("entity_id", sa.String(36), nullable=False),
        sa.Column("action", sa.String(50), nullable=False),
        sa.Column("performed_by", sa.String(36), nullable=True),
        sa.Column("before_state", sa.Text, nullable=True),
        sa.Column("after_state", sa.Text, nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # ── Seed Users ────────────────────────────────────────────────────────────
    # Passwords hashed with bcrypt:
    # admin -> Admin@123
    # user1 -> User@1234
    now = datetime.now(timezone.utc).isoformat()
    admin_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())

    op.execute(
        f"""
        INSERT INTO users (id, username, email, hashed_password, role, is_deleted, created_at, updated_at)
        VALUES
        (
            '{admin_id}',
            'admin',
            'admin@orderapp.com',
            '$2b$12$FbIiS9x6VomSwGglp8LfRuK91gTv3xYTYpaV6r03KGBXzxSp34Fp6',
            'admin',
            false,
            '{now}',
            '{now}'
        ),
        (
            '{user_id}',
            'user1',
            'user1@orderapp.com',
            '$2b$12$JUwIR/Hm5ZvePdEhOT26GOFB7bf9CiUkuU/2j6IXYgbZvfmppK.Na',
            'user',
            false,
            '{now}',
            '{now}'
        )
        """
    )


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_index("ix_orders_is_deleted", "orders")
    op.drop_index("ix_orders_customer_name", "orders")
    op.drop_index("ix_orders_created_at", "orders")
    op.drop_index("ix_orders_status", "orders")
    op.drop_table("orders")
    op.drop_index("ix_users_email", "users")
    op.drop_index("ix_users_username", "users")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS orderstatus")
