-- Migration: 001_initial_schema.sql
-- Project: Restaurant Management System (The Copper Fork)
-- Database: Supabase PostgreSQL
-- Description: Initial schema based on actual project data structures

-- ============================================
-- EXTENSIONS
-- ============================================
create extension if not exists "uuid-ossp";

-- ============================================
-- USERS
-- ============================================
create table if not exists public.users (
  id text primary key,
  username text unique not null,
  password text not null,
  role text not null check (role in ('admin', 'manager', 'waiter', 'kitchen')),
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================
-- MENU ITEMS
-- ============================================
create table if not exists public.menu_items (
  id text primary key,
  name text not null,
  category text not null,
  price numeric not null,
  description text,
  status text not null default 'available' check (status in ('available', 'unavailable')),
  image text,
  recipe jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================
-- TABLES
-- ============================================
create table if not exists public.tables (
  id text primary key,
  number integer unique not null,
  capacity integer not null,
  status text not null default 'available' check (status in ('available', 'occupied', 'reserved')),
  current_order_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================
-- INVENTORY
-- ============================================
create table if not exists public.inventory (
  id text primary key,
  name text not null,
  unit text not null,
  quantity numeric not null default 0,
  threshold numeric not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================
-- ORDERS
-- ============================================
create table if not exists public.orders (
  id text primary key,
  table_id text not null references public.tables(id) on delete restrict,
  waiter_id text not null,
  waiter_name text not null,
  items jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'cooking', 'ready', 'served', 'billed')),
  created_at text not null,
  updated_at text not null
);

-- ============================================
-- INVOICES
-- ============================================
create table if not exists public.invoices (
  id text primary key,
  order_id text not null references public.orders(id) on delete restrict,
  table_id text not null references public.tables(id) on delete restrict,
  items jsonb not null,
  subtotal numeric not null,
  tax numeric not null,
  total numeric not null,
  payment_method text not null,
  waiter_name text not null,
  created_at text not null
);

-- ============================================
-- SETTINGS
-- ============================================
create table if not exists public.settings (
  id text primary key default 'global',
  tax_rate numeric not null default 0.08,
  currency text not null default '৳',
  restaurant_name text not null default 'Restaurant',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================
-- INDEXES
-- ============================================

-- Users
create index if not exists idx_users_username on public.users(username);
create index if not exists idx_users_role on public.users(role);

-- Menu Items
create index if not exists idx_menu_items_category on public.menu_items(category);
create index if not exists idx_menu_items_status on public.menu_items(status);

-- Tables
create index if not exists idx_tables_number on public.tables(number);
create index if not exists idx_tables_status on public.tables(status);

-- Inventory
create index if not exists idx_inventory_name on public.inventory(name);

-- Orders
create index if not exists idx_orders_table_id on public.orders(table_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created_at on public.orders(created_at);
create index if not exists idx_orders_waiter_id on public.orders(waiter_id);

-- Invoices
create index if not exists idx_invoices_order_id on public.invoices(order_id);
create index if not exists idx_invoices_created_at on public.invoices(created_at);
create index if not exists idx_invoices_payment_method on public.invoices(payment_method);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

alter table public.users enable row level security;
alter table public.menu_items enable row level security;
alter table public.tables enable row level security;
alter table public.inventory enable row level security;
alter table public.orders enable row level security;
alter table public.invoices enable row level security;
alter table public.settings enable row level security;

-- ============================================
-- RLS POLICIES - USERS
-- ============================================

-- All authenticated users can read users (needed for login)
create policy "Allow authenticated users to read users"
  on public.users for select
  to authenticated
  using (true);

-- Only admins and managers can insert/update/delete users
create policy "Allow admin and manager to manage users"
  on public.users for all
  to authenticated
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()::text
      and users.role in ('admin', 'manager')
    )
  );

-- ============================================
-- RLS POLICIES - MENU ITEMS
-- ============================================

-- Public read access for menu items
create policy "Allow public read access to menu items"
  on public.menu_items for select
  to anon, authenticated
  using (true);

-- Authenticated users can manage menu items
create policy "Allow authenticated users to manage menu items"
  on public.menu_items for all
  to authenticated
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()::text
      and users.role in ('admin', 'manager')
    )
  );

-- ============================================
-- RLS POLICIES - TABLES
-- ============================================

-- Public read access for tables
create policy "Allow public read access to tables"
  on public.tables for select
  to anon, authenticated
  using (true);

-- Authenticated users can manage tables
create policy "Allow authenticated users to manage tables"
  on public.tables for all
  to authenticated
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()::text
      and users.role in ('admin', 'manager', 'waiter')
    )
  );

-- ============================================
-- RLS POLICIES - INVENTORY
-- ============================================

-- Public read access for inventory
create policy "Allow public read access to inventory"
  on public.inventory for select
  to anon, authenticated
  using (true);

-- Authenticated users can manage inventory
create policy "Allow authenticated users to manage inventory"
  on public.inventory for all
  to authenticated
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()::text
      and users.role in ('admin', 'manager')
    )
  );

-- ============================================
-- RLS POLICIES - ORDERS
-- ============================================

-- Public read access for orders
create policy "Allow public read access to orders"
  on public.orders for select
  to anon, authenticated
  using (true);

-- Authenticated users can manage orders
create policy "Allow authenticated users to manage orders"
  on public.orders for all
  to authenticated
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()::text
      and users.role in ('admin', 'manager', 'waiter', 'kitchen')
    )
  );

-- ============================================
-- RLS POLICIES - INVOICES
-- ============================================

-- Public read access for invoices
create policy "Allow public read access to invoices"
  on public.invoices for select
  to anon, authenticated
  using (true);

-- Authenticated users can manage invoices
create policy "Allow authenticated users to manage invoices"
  on public.invoices for all
  to authenticated
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()::text
      and users.role in ('admin', 'manager', 'waiter')
    )
  );

-- ============================================
-- RLS POLICIES - SETTINGS
-- ============================================

-- Public read access for settings
create policy "Allow public read access to settings"
  on public.settings for select
  to anon, authenticated
  using (true);

-- Only admins and managers can update settings
create policy "Allow admin and manager to manage settings"
  on public.settings for all
  to authenticated
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()::text
      and users.role in ('admin', 'manager')
    )
  );
