-- Supabase schema for Restaurant Management System
-- Run this SQL in the Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table
create table if not exists users (
  id text primary key,
  username text unique not null,
  password text not null,
  role text not null check (role in ('admin', 'manager', 'waiter', 'kitchen')),
  name text not null
);

-- Categories table
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text,
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Product sizes table
create table if not exists product_sizes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Products table
create table if not exists products (
  id text primary key,
  name text not null,
  description text,
  price numeric not null,
  cost numeric,
  image text,
  category_id uuid references categories(id) on delete set null,
  size_id uuid references product_sizes(id) on delete set null,
  status text not null default 'available' check (status in ('available', 'unavailable')),
  stock numeric not null default 0,
  unit text not null default 'pcs',
  is_featured boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Product images table
create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references products(id) on delete cascade,
  url text not null,
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Product recipes / ingredients
create table if not exists product_recipes (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references products(id) on delete cascade,
  inventory_id text not null,
  name text not null,
  quantity numeric not null,
  unit text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Inventory / ingredients
create table if not exists inventory (
  id text primary key,
  name text not null,
  unit text not null,
  quantity numeric not null default 0,
  threshold numeric not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tables
create table if not exists tables (
  id text primary key,
  number integer unique not null,
  capacity integer not null,
  status text not null default 'available' check (status in ('available', 'occupied', 'reserved')),
  current_order_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Orders
create table if not exists orders (
  id text primary key,
  table_id text not null references tables(id),
  waiter_id text not null,
  waiter_name text not null,
  items jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'cooking', 'ready', 'served', 'billed')),
  created_at text not null,
  updated_at text not null
);

-- Order items (for more structured querying)
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references orders(id) on delete cascade,
  product_id text,
  menu_item_id text,
  name text not null,
  quantity numeric not null,
  price numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Invoices
create table if not exists invoices (
  id text primary key,
  order_id text not null references orders(id),
  table_id text not null references tables(id),
  items jsonb not null,
  subtotal numeric not null,
  tax numeric not null,
  total numeric not null,
  payment_method text not null,
  waiter_name text not null,
  created_at text not null
);

-- Settings
create table if not exists settings (
  id text primary key default 'global',
  tax_rate numeric not null default 0.08,
  currency text not null default 'BDT',
  restaurant_name text not null default 'Restaurant',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Sessions
create table if not exists sessions (
  id text primary key,
  username text,
  name text,
  role text,
  login_at text
);

-- Seed default data
insert into users (id, username, password, role, name) values
  ('u_admin', 'admin', 'admin123', 'admin', 'System Administrator'),
  ('u_manager', 'manager', 'manager123', 'manager', 'Alex Rivera'),
  ('u_waiter', 'waiter', 'waiter123', 'waiter', 'Sam Torres'),
  ('u_waiter2', 'waiter2', 'waiter123', 'waiter', 'Jamie Lee'),
  ('u_kitchen', 'kitchen', 'kitchen123', 'kitchen', 'Chef Morgan')
on conflict (id) do nothing;

insert into settings (id, tax_rate, currency, restaurant_name) values
  ('global', 0.08, 'BDT', 'The Copper Fork')
on conflict (id) do nothing;

-- Seed categories
insert into categories (name, description, sort_order) values
  ('Starters', 'Appetizers and light bites', 1),
  ('Mains', 'Main course dishes', 2),
  ('Beverages', 'Drinks and refreshments', 3),
  ('Desserts', 'Sweet treats', 4)
on conflict (name) do nothing;

-- Seed inventory
insert into inventory (id, name, unit, quantity, threshold) values
  ('inv_1', 'Tomatoes', 'kg', 20, 5),
  ('inv_2', 'Chicken Breast', 'kg', 15, 4),
  ('inv_3', 'Rice', 'kg', 30, 6),
  ('inv_4', 'Lettuce', 'kg', 8, 3),
  ('inv_5', 'Mozzarella Cheese', 'kg', 3, 4),
  ('inv_6', 'Coffee Beans', 'kg', 6, 2),
  ('inv_7', 'Flour', 'kg', 25, 5),
  ('inv_8', 'Butter', 'kg', 4, 2),
  ('inv_9', 'Milk', 'l', 18, 5),
  ('inv_10', 'Beef Patty', 'pcs', 2, 10),
  ('inv_11', 'Potatoes', 'kg', 22, 5),
  ('inv_12', 'Basil', 'kg', 0, 1),
  ('inv_13', 'Lemons', 'pcs', 40, 10),
  ('inv_14', 'Chocolate', 'kg', 5, 2)
on conflict (id) do nothing;

-- Seed tables
insert into tables (id, number, capacity, status) values
  ('t_1', 1, 2, 'available'),
  ('t_2', 2, 2, 'available'),
  ('t_3', 3, 4, 'available'),
  ('t_4', 4, 4, 'available'),
  ('t_5', 5, 4, 'available'),
  ('t_6', 6, 6, 'available'),
  ('t_7', 7, 2, 'available'),
  ('t_8', 8, 4, 'available'),
  ('t_9', 9, 4, 'available'),
  ('t_10', 10, 6, 'available'),
  ('t_11', 11, 2, 'available'),
  ('t_12', 12, 8, 'available')
on conflict (id) do nothing;

-- Seed products
insert into products (id, name, description, price, cost, image, category_id, size_id, status, stock, unit, is_featured) values
  ('m_1', 'Garden Salad', 'Fresh lettuce, tomato & house dressing', 175, 80, '/assets/images/0.jpg', (select id from categories where name = 'Starters'), null, 'available', 20, 'pcs', false),
  ('m_2', 'Bruschetta', 'Toasted bread, tomato, basil', 220, 100, '/assets/images/1.jpg', (select id from categories where name = 'Starters'), null, 'available', 15, 'pcs', false),
  ('m_3', 'Grilled Chicken', 'Chicken breast, herbs, side of rice', 300, 150, '/assets/images/2.jpg', (select id from categories where name = 'Mains'), null, 'available', 10, 'pcs', true),
  ('m_4', 'Classic Beef Burger', 'Beef patty, cheese, lettuce, fries', 250, 120, '/assets/images/3.jpg', (select id from categories where name = 'Mains'), null, 'available', 12, 'pcs', true),
  ('m_5', 'Margherita Pizza', 'Mozzarella, tomato, basil', 280, 130, '/assets/images/4.jpg', (select id from categories where name = 'Mains'), null, 'available', 8, 'pcs', false),
  ('m_6', 'Chicken Rice Bowl', 'Grilled chicken over jasmine rice', 260, 110, '/assets/images/5.jpg', (select id from categories where name = 'Mains'), null, 'available', 10, 'pcs', false),
  ('m_7', 'Espresso', 'Double shot espresso', 180, 60, '/assets/images/6.webp', (select id from categories where name = 'Beverages'), null, 'available', 50, 'pcs', false),
  ('m_8', 'Cafe Latte', 'Espresso with steamed milk', 150, 70, '/assets/images/7.jpg', (select id from categories where name = 'Beverages'), null, 'available', 45, 'pcs', false),
  ('m_9', 'Fresh Lemonade', 'House-made lemonade', 100, 30, '/assets/images/8.jpg', (select id from categories where name = 'Beverages'), null, 'available', 30, 'pcs', false),
  ('m_10', 'Chocolate Lava Cake', 'Warm cake, molten center', 200, 90, '/assets/images/9.jpg', (select id from categories where name = 'Desserts'), null, 'available', 8, 'pcs', true),
  ('m_11', 'Tiramisu', 'Espresso-soaked layers, mascarpone', 240, 100, '/assets/images/10.jpg', (select id from categories where name = 'Desserts'), null, 'available', 6, 'pcs', false),
  ('m_12', 'French Fries', 'Crispy golden fries', 99, 40, '/assets/images/11.jpg', (select id from categories where name = 'Starters'), null, 'available', 25, 'pcs', false)
on conflict (id) do nothing;

-- Seed product recipes
insert into product_recipes (product_id, inventory_id, name, quantity, unit) values
  ((select id from products where id = 'm_1'), 'inv_4', 'Lettuce', 0.15, 'kg'),
  ((select id from products where id = 'm_1'), 'inv_1', 'Tomatoes', 0.1, 'kg'),
  ((select id from products where id = 'm_2'), 'inv_1', 'Tomatoes', 0.12, 'kg'),
  ((select id from products where id = 'm_2'), 'inv_12', 'Basil', 0.02, 'kg'),
  ((select id from products where id = 'm_3'), 'inv_2', 'Chicken Breast', 0.3, 'kg'),
  ((select id from products where id = 'm_3'), 'inv_3', 'Rice', 0.2, 'kg'),
  ((select id from products where id = 'm_4'), 'inv_10', 'Beef Patty', 1, 'pcs'),
  ((select id from products where id = 'm_4'), 'inv_5', 'Mozzarella Cheese', 0.05, 'kg'),
  ((select id from products where id = 'm_4'), 'inv_4', 'Lettuce', 0.05, 'kg'),
  ((select id from products where id = 'm_4'), 'inv_11', 'Potatoes', 0.2, 'kg'),
  ((select id from products where id = 'm_5'), 'inv_7', 'Flour', 0.25, 'kg'),
  ((select id from products where id = 'm_5'), 'inv_5', 'Mozzarella Cheese', 0.15, 'kg'),
  ((select id from products where id = 'm_5'), 'inv_1', 'Tomatoes', 0.1, 'kg'),
  ((select id from products where id = 'm_6'), 'inv_2', 'Chicken Breast', 0.25, 'kg'),
  ((select id from products where id = 'm_6'), 'inv_3', 'Rice', 0.25, 'kg'),
  ((select id from products where id = 'm_7'), 'inv_6', 'Coffee Beans', 0.02, 'kg'),
  ((select id from products where id = 'm_8'), 'inv_6', 'Coffee Beans', 0.02, 'kg'),
  ((select id from products where id = 'm_8'), 'inv_9', 'Milk', 0.2, 'l'),
  ((select id from products where id = 'm_9'), 'inv_13', 'Lemons', 2, 'pcs'),
  ((select id from products where id = 'm_10'), 'inv_14', 'Chocolate', 0.1, 'kg'),
  ((select id from products where id = 'm_10'), 'inv_7', 'Flour', 0.05, 'kg'),
  ((select id from products where id = 'm_10'), 'inv_8', 'Butter', 0.05, 'kg'),
  ((select id from products where id = 'm_11'), 'inv_6', 'Coffee Beans', 0.03, 'kg'),
  ((select id from products where id = 'm_12'), 'inv_11', 'Potatoes', 0.25, 'kg')
on conflict do nothing;

-- Enable Row Level Security
alter table users enable row level security;
alter table categories enable row level security;
alter table product_sizes enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table product_recipes enable row level security;
alter table inventory enable row level security;
alter table tables enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table invoices enable row level security;
alter table settings enable row level security;
alter table sessions enable row level security;

-- RLS Policies
drop policy if exists "Allow public read access to products" on products;
create policy "Allow public read access to products" on products for select using (true);
drop policy if exists "Allow public read access to categories" on categories;
create policy "Allow public read access to categories" on categories for select using (true);
drop policy if exists "Allow public read access to product_sizes" on product_sizes;
create policy "Allow public read access to product_sizes" on product_sizes for select using (true);
drop policy if exists "Allow public read access to inventory" on inventory;
create policy "Allow public read access to inventory" on inventory for select using (true);
drop policy if exists "Allow public read access to tables" on tables;
create policy "Allow public read access to tables" on tables for select using (true);
drop policy if exists "Allow public read access to orders" on orders;
create policy "Allow public read access to orders" on orders for select using (true);
drop policy if exists "Allow public read access to order_items" on order_items;
create policy "Allow public read access to order_items" on order_items for select using (true);
drop policy if exists "Allow public read access to invoices" on invoices;
create policy "Allow public read access to invoices" on invoices for select using (true);
drop policy if exists "Allow public read access to settings" on settings;
create policy "Allow public read access to settings" on settings for select using (true);

drop policy if exists "Allow authenticated users to manage products" on products;
create policy "Allow authenticated users to manage products" on products for all using (true);
drop policy if exists "Allow authenticated users to manage inventory" on inventory;
create policy "Allow authenticated users to manage inventory" on inventory for all using (true);
drop policy if exists "Allow authenticated users to manage tables" on tables;
create policy "Allow authenticated users to manage tables" on tables for all using (true);
drop policy if exists "Allow authenticated users to manage orders" on orders;
create policy "Allow authenticated users to manage orders" on orders for all using (true);
drop policy if exists "Allow authenticated users to manage order_items" on order_items;
create policy "Allow authenticated users to manage order_items" on order_items for all using (true);
drop policy if exists "Allow authenticated users to manage invoices" on invoices;
create policy "Allow authenticated users to manage invoices" on invoices for all using (true);
drop policy if exists "Allow authenticated users to manage settings" on settings;
create policy "Allow authenticated users to manage settings" on settings for all using (true);
drop policy if exists "Allow authenticated users to manage categories" on categories;
create policy "Allow authenticated users to manage categories" on categories for all using (true);
drop policy if exists "Allow authenticated users to manage product_sizes" on product_sizes;
create policy "Allow authenticated users to manage product_sizes" on product_sizes for all using (true);
drop policy if exists "Allow authenticated users to manage product_images" on product_images;
create policy "Allow authenticated users to manage product_images" on product_images for all using (true);
drop policy if exists "Allow authenticated users to manage product_recipes" on product_recipes;
create policy "Allow authenticated users to manage product_recipes" on product_recipes for all using (true);

drop policy if exists "Users can read their own data" on users;
create policy "Users can read their own data" on users for select using (true);
drop policy if exists "Users can update their own data" on users;
create policy "Users can update their own data" on users for update using (true);
drop policy if exists "Admins can manage users" on users;
create policy "Admins can manage users" on users for all using (true);
