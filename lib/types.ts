export type Role = 'admin' | 'manager' | 'waiter' | 'kitchen';

export interface User {
  id: string;
  username: string;
  password: string;
  role: Role;
  name: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  status: 'available' | 'unavailable';
  image: string;
  recipe: RecipeItem[];
}

export interface RecipeItem {
  inventoryId: string;
  qty: number;
}

export interface Table {
  id: string;
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  currentOrderId: string | null;
}

export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  threshold: number;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  qty: number;
}

export interface Order {
  id: string;
  tableId: string;
  waiterId: string;
  waiterName: string;
  items: OrderItem[];
  status: 'pending' | 'cooking' | 'ready' | 'served' | 'billed';
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  orderId: string;
  tableId: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  waiterName: string;
  createdAt: string;
}

export interface Settings {
  taxRate: number;
  currency: string;
  restaurantName: string;
}

export interface Session {
  id: string;
  username: string;
  name: string;
  role: Role;
  loginAt: string;
}

export type InventoryStatus = 'ok' | 'low' | 'out';

export const DB_KEYS = {
  USERS: 'RMS_USERS',
  MENU: 'RMS_MENU',
  TABLES: 'RMS_TABLES',
  INVENTORY: 'RMS_INVENTORY',
  ORDERS: 'RMS_ORDERS',
  INVOICES: 'RMS_INVOICES',
  SESSION: 'RMS_SESSION',
  SETTINGS: 'RMS_SETTINGS',
  SEEDED: 'RMS_SEEDED_V1'
} as const;

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Administrator',
  manager: 'Manager',
  waiter: 'Waiter',
  kitchen: 'Kitchen Staff'
};

export const ROLE_HOME: Record<Role, string> = {
  admin: '/dashboard',
  manager: '/dashboard',
  waiter: '/tables',
  kitchen: '/orders'
};

export const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: 'grid', roles: ['admin', 'manager'] as Role[] },
  { href: '/tables', label: 'Tables', icon: 'layout', roles: ['admin', 'manager', 'waiter'] as Role[] },
  { href: '/orders', label: 'Orders & Kitchen', icon: 'ticket', roles: ['admin', 'manager', 'waiter', 'kitchen'] as Role[] },
  { href: '/menu', label: 'Menu', icon: 'book', roles: ['admin', 'manager', 'waiter', 'kitchen'] as Role[] },
  { href: '/inventory', label: 'Inventory', icon: 'box', roles: ['admin', 'manager', 'waiter', 'kitchen'] as Role[] },
  { href: '/reports', label: 'Reports', icon: 'chart', roles: ['admin', 'manager'] as Role[] }
] as const;