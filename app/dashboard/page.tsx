'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { Store } from '@/lib/storage';
import { requireAuth, getSession } from '@/lib/auth';
import { money, fmtDateTime, timeAgo, escapeHtml, onDataChange } from '@/lib/utils';
import { inventoryStatus } from '@/lib/storage';
import type { Session, Order, Invoice, Table, InventoryItem } from '@/lib/types';
import { BarChart } from '@/components/charts/BarChart';
import { AlertTriangle, Package, Users, CreditCard } from 'lucide-react';

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const n = new Date();
  return d.toDateString() === n.toDateString();
}

function statusBadge(status: string): string {
  const map: Record<string, string> = {
    pending: 'badge-danger',
    cooking: 'badge-amber',
    ready: 'badge-steel',
    served: 'badge-herb',
    billed: 'badge-muted'
  };
  return map[status] || 'badge-muted';
}

function StatCard({ label, value, sub, icon, iconBg, iconColor }: {
  label: string;
  value: React.ReactNode;
  sub: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="bg-accent-light border border-accent/20 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-wider font-semibold text-accent-ink">{label}</span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconBg}`}>
          <span className={iconColor}>{icon}</span>
        </div>
      </div>
      <div className="font-display text-3xl font-bold text-ink">{value}</div>
      <div className="text-xs text-ink-soft mt-1">{sub}</div>
    </div>
  );
}

function LowStockAlerts({ items }: { items: InventoryItem[] }) {
  if (!items.length) {
    return (
      <ul className="space-y-3">
        <li className="flex items-center justify-between p-3 rounded-lg bg-white/80">
          <span className="text-sm font-medium text-ink">All ingredients well stocked</span>
        </li>
      </ul>
    );
  }

  return (
    <ul className="space-y-3">
      {items.slice(0, 8).map(item => {
        const status = inventoryStatus(item);
        return (
          <li key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-white/80">
            <span className="text-sm font-medium text-ink">{escapeHtml(item.name)}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-soft font-mono">{item.quantity}{item.unit} left</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                status === 'out' ? 'bg-danger-tint text-danger' : 'bg-amber-tint text-amber'
              }`}>
                {status === 'out' ? 'Out' : 'Low'}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function RecentOrdersTable({ orders, tables }: { orders: Order[]; tables: Table[] }) {
  const tableMap: Record<string, number> = {};
  tables.forEach(t => { tableMap[t.id] = t.number; });

  const recent = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8);

  if (!recent.length) {
    return (
      <div className="text-center py-10 text-ink-soft">
        <p>No orders placed yet today.</p>
      </div>
    );
  }

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b border-accent/20">
          <th className="text-left px-3 py-2.5 text-xs uppercase tracking-wider font-semibold text-ink-soft">Ticket</th>
          <th className="text-left px-3 py-2.5 text-xs uppercase tracking-wider font-semibold text-ink-soft">Table</th>
          <th className="text-left px-3 py-2.5 text-xs uppercase tracking-wider font-semibold text-ink-soft">Items</th>
          <th className="text-left px-3 py-2.5 text-xs uppercase tracking-wider font-semibold text-ink-soft">Status</th>
          <th className="text-left px-3 py-2.5 text-xs uppercase tracking-wider font-semibold text-ink-soft">Placed</th>
        </tr>
      </thead>
      <tbody>
        {recent.map(order => (
          <tr key={order.id} className="border-b border-accent/10 hover:bg-white/60">
            <td className="px-3 py-3 font-mono text-sm text-ink">#{order.id.slice(-5).toUpperCase()}</td>
            <td className="px-3 py-3 text-sm text-ink">Table {tableMap[order.tableId] || '—'}</td>
            <td className="px-3 py-3 text-sm text-ink">{order.items.reduce((s, i) => s + i.qty, 0)} items</td>
            <td className="px-3 py-3">
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${statusBadge(order.status)}`}>
                {order.status}
              </span>
            </td>
            <td className="px-3 py-3 text-sm text-ink-soft">{timeAgo(order.createdAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function DashboardPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  useEffect(() => {
    const init = async () => {
      const s = await requireAuth(['admin', 'manager']);
      setSession(s);
      if (s) loadData();
    };
    init();
  }, []);

  const loadData = async () => {
    const [ordersData, invoicesData, tablesData, inventoryData] = await Promise.all([
      Store.orders(),
      Store.invoices(),
      Store.tables(),
      Store.inventory()
    ]);
    setOrders(ordersData);
    setInvoices(invoicesData);
    setTables(tablesData);
    setInventory(inventoryData);
  };

  useEffect(() => {
    if (!session) return;
    const cleanup = onDataChange(loadData);
    return cleanup;
  }, [session]);

  if (!session) return null;

  const salesToday = invoices.filter(i => isToday(i.createdAt)).reduce((s, i) => s + i.total, 0);
  const ordersToday = orders.filter(o => isToday(o.createdAt)).length;
  const available = tables.filter(t => t.status === 'available').length;
  const occupied = tables.filter(t => t.status === 'occupied').length;
  const reserved = tables.filter(t => t.status === 'reserved').length;
  const pending = orders.filter(o => ['pending', 'cooking', 'ready'].includes(o.status)).length;
  const lowStockItems = inventory.filter(i => inventoryStatus(i) !== 'ok');

  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const total = invoices
      .filter(inv => new Date(inv.createdAt).toDateString() === d.toDateString())
      .reduce((s, i) => s + i.total, 0);
    chartData.push({ label: d.toLocaleDateString(undefined, { weekday: 'short' }), value: total });
  }

  return (
    <AppShell activePath="/dashboard">
      <div className="bg-ink text-paper min-h-[calc(100vh-4rem)]">
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              label="Sales Today"
              value={money(salesToday)}
              sub={`${invoices.filter(i => isToday(i.createdAt)).length} invoices billed`}
              icon={<CreditCard className="w-4 h-4" />}
              iconBg="bg-accent-tint"
              iconColor="text-accent-ink"
            />
            <StatCard
              label="Orders Today"
              value={ordersToday.toString()}
              sub={`${pending} currently pending`}
              icon={<Package className="w-4 h-4" />}
              iconBg="bg-steel-tint"
              iconColor="text-steel"
            />
            <StatCard
              label="Tables"
              value={<><span>{available}/{tables.length}</span> <span className="text-base text-paper/70 font-body">free</span></>}
              sub={`${occupied} occupied · ${reserved} reserved`}
              icon={<Users className="w-4 h-4" />}
              iconBg="bg-herb-tint"
              iconColor="text-herb"
            />
            <StatCard
              label="Inventory Alerts"
              value={lowStockItems.length.toString()}
              sub={`${inventory.filter(i => inventoryStatus(i) === 'out').length} out of stock`}
              icon={<AlertTriangle className="w-4 h-4" />}
              iconBg="bg-amber-tint"
              iconColor="text-amber"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-7 gap-5">
            <div className="lg:col-span-4">
              <div className="bg-accent-light border border-accent/20 rounded-2xl p-5 shadow-sm">
                <h3 className="font-display text-lg font-semibold mb-4 text-ink">Revenue — last 7 days</h3>
                <BarChart data={chartData} color="accent" height={160} />
              </div>
            </div>
            <div className="lg:col-span-3">
              <div className="bg-accent-light border border-accent/20 rounded-2xl p-5 shadow-sm">
                <h3 className="font-display text-lg font-semibold mb-4 text-ink">Low stock & out of stock</h3>
                <LowStockAlerts items={lowStockItems} />
              </div>
            </div>
          </div>

          <div className="bg-accent-light border border-accent/20 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold text-ink">Recent orders</h3>
              <a href="/orders" className="text-sm font-medium text-accent hover:underline">View all</a>
            </div>
            <RecentOrdersTable orders={orders} tables={tables} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}