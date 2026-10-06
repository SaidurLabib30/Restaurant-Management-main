-- Seed Data for Restaurant Management System
-- Run this AFTER the migration SQL
-- Note: These are demo accounts. Change passwords in production.

-- ============================================
-- USERS (passwords should be hashed in production)
-- ============================================
insert into public.users (id, username, password, role, name) values
  ('u_admin', 'admin', 'admin123', 'admin', 'System Administrator'),
  ('u_manager', 'manager', 'manager123', 'manager', 'Alex Rivera'),
  ('u_waiter', 'waiter', 'waiter123', 'waiter', 'Sam Torres'),
  ('u_waiter2', 'waiter2', 'waiter123', 'waiter', 'Jamie Lee'),
  ('u_kitchen', 'kitchen', 'kitchen123', 'kitchen', 'Chef Morgan')
on conflict (id) do nothing;

-- ============================================
-- SETTINGS
-- ============================================
insert into public.settings (id, tax_rate, currency, restaurant_name) values
  ('global', 0.08, '৳', 'The Copper Fork')
on conflict (id) do nothing;

-- ============================================
-- INVENTORY
-- ============================================
insert into public.inventory (id, name, unit, quantity, threshold) values
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

-- ============================================
-- TABLES
-- ============================================
insert into public.tables (id, number, capacity, status) values
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

-- ============================================
-- MENU ITEMS
-- ============================================
insert into public.menu_items (id, name, category, price, description, status, image, recipe) values
  ('m_1', 'Garden Salad', 'Starters', 175, 'Fresh lettuce, tomato & house dressing', 'available', '/assets/images/0.jpg', '[{"inventoryId":"inv_4","qty":0.15},{"inventoryId":"inv_1","qty":0.1}]'),
  ('m_2', 'Bruschetta', 'Starters', 220, 'Toasted bread, tomato, basil', 'available', '/assets/images/1.jpg', '[{"inventoryId":"inv_1","qty":0.12},{"inventoryId":"inv_12","qty":0.02}]'),
  ('m_3', 'Grilled Chicken', 'Mains', 300, 'Chicken breast, herbs, side of rice', 'available', '/assets/images/2.jpg', '[{"inventoryId":"inv_2","qty":0.3},{"inventoryId":"inv_3","qty":0.2}]'),
  ('m_4', 'Classic Beef Burger', 'Mains', 250, 'Beef patty, cheese, lettuce, fries', 'available', '/assets/images/3.jpg', '[{"inventoryId":"inv_10","qty":1},{"inventoryId":"inv_5","qty":0.05},{"inventoryId":"inv_4","qty":0.05},{"inventoryId":"inv_11","qty":0.2}]'),
  ('m_5', 'Margherita Pizza', 'Mains', 280, 'Mozzarella, tomato, basil', 'available', '/assets/images/4.jpg', '[{"inventoryId":"inv_7","qty":0.25},{"inventoryId":"inv_5","qty":0.15},{"inventoryId":"inv_1","qty":0.1}]'),
  ('m_6', 'Chicken Rice Bowl', 'Mains', 260, 'Grilled chicken over jasmine rice', 'available', '/assets/images/5.jpg', '[{"inventoryId":"inv_2","qty":0.25},{"inventoryId":"inv_3","qty":0.25}]'),
  ('m_7', 'Espresso', 'Beverages', 180, 'Double shot espresso', 'available', '/assets/images/6.webp', '[{"inventoryId":"inv_6","qty":0.02}]'),
  ('m_8', 'Cafe Latte', 'Beverages', 150, 'Espresso with steamed milk', 'available', '/assets/images/7.jpg', '[{"inventoryId":"inv_6","qty":0.02},{"inventoryId":"inv_9","qty":0.2}]'),
  ('m_9', 'Fresh Lemonade', 'Beverages', 100, 'House-made lemonade', 'available', '/assets/images/8.jpg', '[{"inventoryId":"inv_13","qty":2}]'),
  ('m_10', 'Chocolate Lava Cake', 'Desserts', 200, 'Warm cake, molten center', 'available', '/assets/images/9.jpg', '[{"inventoryId":"inv_14","qty":0.1},{"inventoryId":"inv_7","qty":0.05},{"inventoryId":"inv_8","qty":0.05}]'),
  ('m_11', 'Tiramisu', 'Desserts', 240, 'Espresso-soaked layers, mascarpone', 'available', '/assets/images/10.jpg', '[{"inventoryId":"inv_6","qty":0.03}]'),
  ('m_12', 'French Fries', 'Starters', 99, 'Crispy golden fries', 'available', '/assets/images/11.jpg', '[{"inventoryId":"inv_11","qty":0.25}]')
on conflict (id) do nothing;
