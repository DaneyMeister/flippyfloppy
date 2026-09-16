CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE item_status AS ENUM ('SELLING', 'SOLD', 'TESTER', 'COLLECTION', 'USING', 'DEFECTIVE');
CREATE TYPE item_group_type AS ENUM ('PC Set', 'System Unit', 'Bundle Set', 'Individual');

CREATE TABLE item_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_name TEXT NOT NULL,
  group_type item_group_type NOT NULL,
  purchase_date DATE NOT NULL,
  base_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  bought_from TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES item_groups(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  status item_status NOT NULL DEFAULT 'SELLING',
  assigned_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  listed_price NUMERIC(12, 2),
  sold_price NUMERIC(12, 2),
  notes TEXT,
  buyer_name TEXT,
  sale_date TIMESTAMPTZ,
  listing_url TEXT,
  purchase_date DATE,
  bought_from TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE group_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES item_groups(id) ON DELETE CASCADE,
  item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inventory_items_group_id ON inventory_items(group_id);
CREATE INDEX idx_inventory_items_status ON inventory_items(status);
CREATE INDEX idx_group_expenses_group_id ON group_expenses(group_id);
CREATE INDEX idx_group_expenses_item_id ON group_expenses(item_id);
