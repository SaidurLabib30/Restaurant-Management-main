import { supabase } from './supabase';
import type {
  User,
  MenuItem,
  Table,
  InventoryItem,
  Order,
  OrderItem,
  Invoice,
  Settings,
  Session,
  InventoryStatus,
  RecipeItem
} from './types';

function uid(prefix: string): string {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

async function seedDatabase(): Promise<void> {
  const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
  if (userCount && userCount > 0) return;

  const users: User[] = [
    { id: 'u_admin', username: 'admin', password: 'admin123', role: 'admin', name: 'System Administrator' },
    { id: 'u_manager', username: 'manager', password: 'manager123', role: 'manager', name: 'Alex Rivera' },
    { id: 'u_waiter', username: 'waiter', password: 'waiter123', role: 'waiter', name: 'Sam Torres' },
    { id: 'u_waiter2', username: 'waiter2', password: 'waiter123', role: 'waiter', name: 'Jamie Lee' },
    { id: 'u_kitchen', username: 'kitchen', password: 'kitchen123', role: 'kitchen', name: 'Chef Morgan' }
  ];

  const inventory: InventoryItem[] = [
    { id: 'inv_1', name: 'Tomatoes', unit: 'kg', quantity: 20, threshold: 5 },
    { id: 'inv_2', name: 'Chicken Breast', unit: 'kg', quantity: 15, threshold: 4 },
    { id: 'inv_3', name: 'Rice', unit: 'kg', quantity: 30, threshold: 6 },
    { id: 'inv_4', name: 'Lettuce', unit: 'kg', quantity: 8, threshold: 3 },
    { id: 'inv_5', name: 'Mozzarella Cheese', unit: 'kg', quantity: 3, threshold: 4 },
    { id: 'inv_6', name: 'Coffee Beans', unit: 'kg', quantity: 6, threshold: 2 },
    { id: 'inv_7', name: 'Flour', unit: 'kg', quantity: 25, threshold: 5 },
    { id: 'inv_8', name: 'Butter', unit: 'kg', quantity: 4, threshold: 2 },
    { id: 'inv_9', name: 'Milk', unit: 'l', quantity: 18, threshold: 5 },
    { id: 'inv_10', name: 'Beef Patty', unit: 'pcs', quantity: 2, threshold: 10 },
    { id: 'inv_11', name: 'Potatoes', unit: 'kg', quantity: 22, threshold: 5 },
    { id: 'inv_12', name: 'Basil', unit: 'kg', quantity: 0, threshold: 1 },
    { id: 'inv_13', name: 'Lemons', unit: 'pcs', quantity: 40, threshold: 10 },
    { id: 'inv_14', name: 'Chocolate', unit: 'kg', quantity: 5, threshold: 2 }
  ];

  const menu: MenuItem[] = [
    {
      id: 'm_1', name: 'Garden Salad', category: 'Starters', price: 175,
      description: 'Fresh lettuce, tomato & house dressing', status: 'available',
      image: '/assets/images/0.jpg',
      recipe: [ { inventoryId: 'inv_4', qty: 0.15 }, { inventoryId: 'inv_1', qty: 0.1 } ]
    },
    {
      id: 'm_2', name: 'Bruschetta', category: 'Starters', price: 220,
      description: 'Toasted bread, tomato, basil', status: 'available',
      image: '/assets/images/1.jpg',
      recipe: [ { inventoryId: 'inv_1', qty: 0.12 }, { inventoryId: 'inv_12', qty: 0.02 } ]
    },
    {
      id: 'm_3', name: 'Grilled Chicken', category: 'Mains', price: 300,
      description: 'Chicken breast, herbs, side of rice', status: 'available',
      image: '/assets/images/2.jpg',
      recipe: [ { inventoryId: 'inv_2', qty: 0.3 }, { inventoryId: 'inv_3', qty: 0.2 } ]
    },
    {
      id: 'm_4', name: 'Classic Beef Burger', category: 'Mains', price: 250,
      description: 'Beef patty, cheese, lettuce, fries', status: 'available',
      image: '/assets/images/3.jpg',
      recipe: [ { inventoryId: 'inv_10', qty: 1 }, { inventoryId: 'inv_5', qty: 0.05 }, { inventoryId: 'inv_4', qty: 0.05 }, { inventoryId: 'inv_11', qty: 0.2 } ]
    },
    {
      id: 'm_5', name: 'Margherita Pizza', category: 'Mains', price: 280,
      description: 'Mozzarella, tomato, basil', status: 'available',
      image: '/assets/images/4.jpg',
      recipe: [ { inventoryId: 'inv_7', qty: 0.25 }, { inventoryId: 'inv_5', qty: 0.15 }, { inventoryId: 'inv_1', qty: 0.1 } ]
    },
    {
      id: 'm_6', name: 'Chicken Rice Bowl', category: 'Mains', price: 260,
      description: 'Grilled chicken over jasmine rice', status: 'available',
      image: '/assets/images/5.jpg',
      recipe: [ { inventoryId: 'inv_2', qty: 0.25 }, { inventoryId: 'inv_3', qty: 0.25 } ]
    },
    {
      id: 'm_7', name: 'Espresso', category: 'Beverages', price: 180,
      description: 'Double shot espresso', status: 'available',
      image: '/assets/images/6.webp',
      recipe: [ { inventoryId: 'inv_6', qty: 0.02 } ]
    },
    {
      id: 'm_8', name: 'Cafe Latte', category: 'Beverages', price: 150,
      description: 'Espresso with steamed milk', status: 'available',
      image: '/assets/images/7.jpg',
      recipe: [ { inventoryId: 'inv_6', qty: 0.02 }, { inventoryId: 'inv_9', qty: 0.2 } ]
    },
    {
      id: 'm_9', name: 'Fresh Lemonade', category: 'Beverages', price: 100,
      description: 'House-made lemonade', status: 'available',
      image: '/assets/images/8.jpg',
      recipe: [ { inventoryId: 'inv_13', qty: 2 } ]
    },
    {
      id: 'm_10', name: 'Chocolate Lava Cake', category: 'Desserts', price: 200,
      description: 'Warm cake, molten center', status: 'available',
      image: '/assets/images/9.jpg',
      recipe: [ { inventoryId: 'inv_14', qty: 0.1 }, { inventoryId: 'inv_7', qty: 0.05 }, { inventoryId: 'inv_8', qty: 0.05 } ]
    },
    {
      id: 'm_11', name: 'Tiramisu', category: 'Desserts', price: 240,
      description: 'Espresso-soaked layers, mascarpone', status: 'available',
      image: '/assets/images/10.jpg',
      recipe: [ { inventoryId: 'inv_6', qty: 0.03 } ]
    },
    {
      id: 'm_12', name: 'French Fries', category: 'Starters', price: 99,
      description: 'Crispy golden fries', status: 'available',
      image: '/assets/images/11.jpg',
      recipe: [ { inventoryId: 'inv_11', qty: 0.25 } ]
    }
  ];

  const tables: Table[] = [];
  for (let i = 1; i <= 12; i++) {
    tables.push({
      id: 't_' + i,
      number: i,
      capacity: [2, 2, 4, 4, 4, 6, 2, 4, 4, 6, 2, 8][i - 1] || 4,
      status: 'available',
      currentOrderId: null
    });
  }

  await supabase.from('users').insert(users);
  await supabase.from('inventory').insert(inventory);
  await supabase.from('menu_items').insert(menu);
  await supabase.from('tables').insert(tables);
  await supabase.from('settings').upsert({ id: 'global', tax_rate: 0.08, currency: '৳', restaurant_name: 'The Copper Fork' });
}

if (typeof window !== 'undefined') {
  seedDatabase();
}

const Store = {
  users: async (): Promise<User[]> => {
    const { data } = await supabase.from('users').select('*');
    return data ?? [];
  },

  menu: async (): Promise<MenuItem[]> => {
    const { data } = await supabase.from('menu_items').select('*');
    return (data ?? []) as MenuItem[];
  },

  saveMenu: async (v: MenuItem[]): Promise<boolean> => {
    const { error } = await supabase.from('menu_items').upsert(v);
    return !error;
  },

  tables: async (): Promise<Table[]> => {
    const { data } = await supabase.from('tables').select('*');
    return (data ?? []) as Table[];
  },

  saveTables: async (v: Table[]): Promise<boolean> => {
    const { error } = await supabase.from('tables').upsert(v);
    return !error;
  },

  inventory: async (): Promise<InventoryItem[]> => {
    const { data } = await supabase.from('inventory').select('*');
    return (data ?? []) as InventoryItem[];
  },

  saveInventory: async (v: InventoryItem[]): Promise<boolean> => {
    const { error } = await supabase.from('inventory').upsert(v);
    return !error;
  },

  orders: async (): Promise<Order[]> => {
    const { data } = await supabase.from('orders').select('*');
    return (data ?? []) as Order[];
  },

  saveOrders: async (v: Order[]): Promise<boolean> => {
    const { error } = await supabase.from('orders').upsert(v);
    return !error;
  },

  invoices: async (): Promise<Invoice[]> => {
    const { data } = await supabase.from('invoices').select('*');
    return (data ?? []) as Invoice[];
  },

  saveInvoices: async (v: Invoice[]): Promise<boolean> => {
    const { error } = await supabase.from('invoices').upsert(v);
    return !error;
  },

  settings: async (): Promise<Settings> => {
    const { data } = await supabase.from('settings').select('*').eq('id', 'global').maybeSingle();
    if (data) {
      return {
        taxRate: data.tax_rate,
        currency: data.currency,
        restaurantName: data.restaurant_name
      } as Settings;
    }
    return { taxRate: 0.08, currency: '৳', restaurantName: 'Restaurant' };
  },

  saveSettings: async (v: Settings): Promise<boolean> => {
    const { error } = await supabase.from('settings').upsert({
      id: 'global',
      tax_rate: v.taxRate,
      currency: v.currency,
      restaurant_name: v.restaurantName
    });
    return !error;
  },

  session: async (): Promise<Session | null> => {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('RMS_SESSION');
    return raw ? JSON.parse(raw) : null;
  },

  saveSession: async (v: Session | null): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    if (v) localStorage.setItem('RMS_SESSION', JSON.stringify(v));
    else localStorage.removeItem('RMS_SESSION');
    return true;
  },

  clearSession: async (): Promise<void> => {
    if (typeof window !== 'undefined') localStorage.removeItem('RMS_SESSION');
  }
};

function inventoryStatus(item: InventoryItem): InventoryStatus {
  if (item.quantity <= 0) return 'out';
  if (item.quantity <= item.threshold) return 'low';
  return 'ok';
}

async function deductInventoryForItems(orderItems: OrderItem[]): Promise<void> {
  const inv = await Store.inventory();
  const invMap: Record<string, InventoryItem> = {};
  inv.forEach(i => { invMap[i.id] = i; });

  const menu = await Store.menu();
  const menuMap: Record<string, MenuItem> = {};
  menu.forEach(m => { menuMap[m.id] = m; });

  orderItems.forEach(oi => {
    const menuItem = menuMap[oi.menuItemId];
    if (!menuItem || !menuItem.recipe) return;
    menuItem.recipe.forEach(r => {
      const invItem = invMap[r.inventoryId];
      if (invItem) {
        invItem.quantity = Math.max(0, +(invItem.quantity - (r.qty * oi.qty)).toFixed(2));
      }
    });
  });

  await Store.saveInventory(inv);
}

export { Store, inventoryStatus, deductInventoryForItems, uid };
