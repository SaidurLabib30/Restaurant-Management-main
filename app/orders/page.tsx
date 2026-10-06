'use client';

import { useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/AppShell';
import Modal from '@/components/Modal';
import { Store, uid } from '@/lib/storage';
import { requireAuth, toast } from '@/lib/auth';
import { money, timeAgo, escapeHtml, onDataChange } from '@/lib/utils';
import { inventoryStatus } from '@/lib/storage';
import type { Session, MenuItem, Order, Table, InventoryItem, Settings } from '@/lib/types';
import { Plus, Minus, ChefHat, CheckCheck, CircleEllipsis } from 'lucide-react';

const STATUS_ORDER: Order['status'][] = ['pending', 'cooking', 'ready', 'served', 'billed'];

export default function OrdersPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'foh' | 'kitchen'>('foh');
  const [statusFilter, setStatusFilter] = useState('active');
  const [cart, setCart] = useState<Array<{ menuItemId: string; name: string; price: number; qty: number }>>([]);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceOrderId, setInvoiceOrderId] = useState<string | null>(null);
  const [menuSearch, setMenuSearch] = useState('');
  const [menuCategory, setMenuCategory] = useState('All');
  const [selectedTableId, setSelectedTableId] = useState('');
  const [settings, setSettings] = useState<Settings>({ taxRate: 0.08, currency: '৳', restaurantName: 'Restaurant' });

  const loadData = async () => {
    const [tablesData, ordersData, menuData, inventoryData, settingsData] = await Promise.all([
      Store.tables(),
      Store.orders(),
      Store.menu(),
      Store.inventory(),
      Store.settings()
    ]);
    setTables(tablesData);
    setOrders(ordersData);
    setMenu(menuData);
    setInventory(inventoryData);
    setSettings(settingsData);
  };

  useEffect(() => {
    const init = async () => {
      const s = await requireAuth(['admin', 'manager', 'waiter', 'kitchen']);
      setSession(s);
      if (s) {
        loadData();
        if (s.role === 'kitchen') setActiveTab('kitchen');
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!session) return;
    const cleanup = onDataChange(loadData);
    return cleanup;
  }, [session]);

  const isKitchenOnly = session?.role === 'kitchen';
  const isWaiterOnly = session?.role === 'waiter';
  const canSeeBoth = ['admin', 'manager'].includes(session?.role || '');
  const canAdvance = ['admin', 'manager', 'kitchen'].includes(session?.role || '');
  const canCancel = ['admin', 'manager'].includes(session?.role || '');

  const tableMap = useMemo(() => {
    const map: Record<string, number> = {};
    tables.forEach(t => { map[t.id] = t.number; });
    return map;
  }, [tables]);

  const filteredOrders = useMemo(() => {
    let result = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (statusFilter === 'active') result = result.filter(o => o.status !== 'billed');
    else if (statusFilter !== 'all') result = result.filter(o => o.status === statusFilter);
    return result;
  }, [orders, statusFilter]);

  const filteredMenu = useMemo(() => {
    return menu.filter(m => m.status === 'available' && (menuCategory === 'All' || m.category === menuCategory) && m.name.toLowerCase().includes(menuSearch.toLowerCase()));
  }, [menu, menuCategory, menuSearch]);

  const menuCategories = useMemo(() => ['All', ...Array.from(new Set(menu.map(m => m.category)))], [menu]);

  const invoiceOrder = invoiceOrderId ? orders.find(o => o.id === invoiceOrderId) : null;
  const invoiceTableNumber = invoiceOrder ? (tables.find(t => t.id === invoiceOrder.tableId)?.number ?? '—') : '—';

  if (!session) return null;

  const openOrderBuilder = (existingOrder: Order | null = null, presetTableId?: string) => {
    setCart([]);
    setEditingOrderId(existingOrder?.id ?? null);
    setMenuSearch('');
    setMenuCategory('All');
    const availableTables = tables.filter(t => t.status === 'available' || t.id === presetTableId || (existingOrder && t.id === existingOrder.tableId));
    if (!existingOrder && availableTables.length > 0 && !presetTableId) {
      setSelectedTableId(availableTables[0].id);
    }
    setShowOrderModal(true);
  };

  const addToCart = (menuItemId: string) => {
    const m = menu.find(x => x.id === menuItemId);
    if (!m) return;
    setCart(prev => {
      const existing = prev.find(c => c.menuItemId === menuItemId);
      if (existing) return prev.map(c => c.menuItemId === menuItemId ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { menuItemId, name: m.name, price: m.price, qty: 1 }];
    });
  };

  const updateCartQty = (idx: number, delta: number) => {
    setCart(prev => {
      const next = prev.map((c, i) => i === idx ? { ...c, qty: Math.max(0, c.qty + delta) } : c).filter(c => c.qty > 0);
      return next;
    });
  };

  const cartSubtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);

  const submitOrder = async () => {
    if (!cart.length) return toast('Add at least one item to the order', 'error');
    const currentOrders = await Store.orders();
    const currentTables = await Store.tables();

    if (editingOrderId) {
      const order = currentOrders.find(o => o.id === editingOrderId);
      if (!order) return;
      cart.forEach(c => {
        const line = order.items.find(i => i.menuItemId === c.menuItemId);
        if (line) line.qty += c.qty; else order.items.push({ ...c });
      });
      order.updatedAt = new Date().toISOString();
      await Store.saveOrders(currentOrders);
      toast('Items added to order', 'success');
    } else {
      const tableId = selectedTableId || (availableTablesFromCurrent()?.[0]?.id) || '';
      if (!tableId) return toast('Please choose a table', 'error');
      const newOrder: Order = {
        id: uid('o'),
        tableId,
        waiterId: session.id,
        waiterName: session.name,
        items: cart.map(c => ({ ...c })),
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      currentOrders.push(newOrder);
      await Store.saveOrders(currentOrders);
      const t = currentTables.find(x => x.id === tableId);
      if (t) { t.status = 'occupied'; t.currentOrderId = newOrder.id; await Store.saveTables(currentTables); }
      toast('Order sent to kitchen', 'success');
    }
    setShowOrderModal(false);
    setEditingOrderId(null);
    setCart([]);
    loadData();
  };

  const availableTablesFromCurrent = () => tables.filter(t => t.status === 'available' || t.id === selectedTableId);

  const handleOrderAction = async (action: string, id: string) => {
    const currentOrders = await Store.orders();
    const order = currentOrders.find(o => o.id === id);
    if (!order) return;

    if (action === 'add-items') {
      openOrderBuilder(order, order.tableId);
      return;
    }
    if (action === 'serve') {
      order.status = 'served';
      order.updatedAt = new Date().toISOString();
      await Store.saveOrders(currentOrders);
      toast('Order marked served');
      loadData();
      return;
    }
    if (action === 'bill') {
      setInvoiceOrderId(id);
      setShowInvoiceModal(true);
      return;
    }
    if (action === 'cancel') {
      if (!confirm('Cancel this order and restock its ingredients?')) return;
      await restockInventoryForItems(order.items);
      const currentTables = await Store.tables();
      const t = currentTables.find(x => x.id === order.tableId);
      if (t) { t.status = 'available'; t.currentOrderId = null; await Store.saveTables(currentTables); }
      await Store.saveOrders(currentOrders.filter(o => o.id !== id));
      toast('Order cancelled', 'success');
      loadData();
    }
  };

  const restockInventoryForItems = async (items: Order['items']) => {
    const inv = await Store.inventory();
    const invMap: Record<string, InventoryItem> = {};
    inv.forEach(i => { invMap[i.id] = i; });
    const menuMap: Record<string, MenuItem> = {};
    const menuData = await Store.menu();
    menuData.forEach(m => { menuMap[m.id] = m; });
    items.forEach(oi => {
      const mi = menuMap[oi.menuItemId];
      if (!mi || !mi.recipe) return;
      mi.recipe.forEach(r => {
        const invItem = invMap[r.inventoryId];
        if (invItem) invItem.quantity = +(invItem.quantity + r.qty * oi.qty).toFixed(2);
      });
    });
    await Store.saveInventory(inv);
  };

  const confirmInvoice = async () => {
    if (!invoiceOrder) return;
    const settings = await Store.settings();
    const subtotal = invoiceOrder.items.reduce((s, i) => s + i.price * i.qty, 0);
    const tax = subtotal * settings.taxRate;
    const total = subtotal + tax;
    const paymentMethod = (document.getElementById('inv-payment') as HTMLSelectElement | null)?.value || 'Cash';

    const invoices = await Store.invoices();
    const invoice = {
      id: uid('inv'),
      orderId: invoiceOrder.id,
      tableId: invoiceOrder.tableId,
      items: invoiceOrder.items,
      subtotal,
      tax,
      total,
      paymentMethod,
      waiterName: invoiceOrder.waiterName,
      createdAt: new Date().toISOString()
    };
    invoices.push(invoice);
    await Store.saveInvoices(invoices);

    const currentOrders = await Store.orders();
    const o = currentOrders.find(x => x.id === invoiceOrder.id);
    if (o) { o.status = 'billed'; await Store.saveOrders(currentOrders); }

    const currentTables = await Store.tables();
    const t = currentTables.find(x => x.id === invoiceOrder.tableId);
    if (t) { t.status = 'available'; t.currentOrderId = null; await Store.saveTables(currentTables); }

    setShowInvoiceModal(false);
    setInvoiceOrderId(null);
    toast('Invoice generated — table cleared', 'success');
    loadData();
  };

  const advanceKitchenStatus = async (id: string, newStatus: Order['status']) => {
    const currentOrders = await Store.orders();
    const order = currentOrders.find(o => o.id === id);
    if (!order) return;
    order.status = newStatus;
    order.updatedAt = new Date().toISOString();
    await Store.saveOrders(currentOrders);
    toast(`Ticket #${id.slice(-5).toUpperCase()} → ${newStatus}`, 'success');
    loadData();
  };

  const kitchenColumns = [
    { key: 'pending' as Order['status'], label: 'Pending' },
    { key: 'cooking' as Order['status'], label: 'Cooking' },
    { key: 'ready' as Order['status'], label: 'Ready' },
    { key: 'served' as Order['status'], label: 'Served' }
  ];

  return (
    <AppShell activePath="/orders">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted font-semibold">Orders</p>
            <h2 className="font-display text-3xl font-semibold text-ink">{isKitchenOnly ? 'Kitchen Display' : 'Orders & Kitchen'}</h2>
          </div>
          {!isKitchenOnly && canSeeBoth && (
            <div className="inline-flex rounded-xl bg-surface border border-line p-1">
              <button type="button" onClick={() => setActiveTab('foh')} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'foh' ? 'bg-accent text-white' : 'text-ink hover:bg-stone-50'}`}>Front of House</button>
              <button type="button" onClick={() => setActiveTab('kitchen')} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'kitchen' ? 'bg-accent text-white' : 'text-ink hover:bg-stone-50'}`}>Kitchen Display</button>
            </div>
          )}
        </div>

        {(!isKitchenOnly && activeTab === 'foh') ? (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="active">Active orders</option>
                  <option value="pending">Pending</option>
                  <option value="cooking">Cooking</option>
                  <option value="ready">Ready</option>
                  <option value="served">Served (awaiting bill)</option>
                  <option value="all">All orders</option>
                </select>
              </div>
              <button type="button" onClick={() => openOrderBuilder()} className="bg-accent text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-accent-ink transition-colors flex items-center gap-2">
                <Plus className="w-4 h-4" /> New Order
              </button>
            </div>

            <div className="space-y-4">
              {filteredOrders.length === 0 && (
                <div className="text-center py-12 text-muted">
                  <p>No orders here</p>
                  <p className="text-sm mt-1">Start a new order from an available table.</p>
                </div>
              )}
              {filteredOrders.map(o => {
                const subtotal = o.items.reduce((s, i) => s + i.price * i.qty, 0);
                const itemsSummary = o.items.map(i => `${i.qty}× ${i.name}`).join(', ');
                return (
                  <div key={o.id} className="bg-surface border border-line rounded-2xl p-5 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-1">
                          <span className="font-mono font-bold text-ink">#{o.id.slice(-5).toUpperCase()}</span>
                          <span className="text-sm text-muted">Table {tableMap[o.tableId] || '—'}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${statusBadge(o.status)}`}>{o.status}</span>
                        </div>
                        <div className="text-sm text-muted">{escapeHtml(itemsSummary)} · {money(subtotal)} · {timeAgo(o.createdAt)}</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {['pending', 'cooking'].includes(o.status) && (
                          <>
                            <button type="button" onClick={() => handleOrderAction('add-items', o.id)} className="bg-surface border border-line text-ink px-3 py-1.5 rounded-lg text-sm font-medium hover:border-accent hover:text-accent-ink transition-colors">Add Items</button>
                            {canCancel && <button type="button" onClick={() => handleOrderAction('cancel', o.id)} className="bg-danger-tint text-danger px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-danger hover:text-white transition-colors">Cancel</button>}
                          </>
                        )}
                        {o.status === 'ready' && <button type="button" onClick={() => handleOrderAction('serve', o.id)} className="bg-accent text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-accent-ink transition-colors">Mark Served</button>}
                        {o.status === 'served' && <button type="button" onClick={() => handleOrderAction('bill', o.id)} className="bg-accent text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-accent-ink transition-colors">Generate Bill</button>}
                        {o.status === 'billed' && <span className="px-2 py-1 rounded-full text-xs font-mono font-bold bg-stone-200 text-muted">Paid</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {kitchenColumns.map(col => {
              const colOrders = orders.filter(o => o.status === col.key).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
              if (col.key === 'served') colOrders.splice(5);
              return (
                <div key={col.key}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted">{col.label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${statusBadge(col.key)}`}>{colOrders.length}</span>
                  </div>
                  <div className="space-y-3">
                    {colOrders.length === 0 && <p className="text-xs text-muted">No tickets</p>}
                    {colOrders.map(o => (
                      <div key={o.id} className="bg-surface border border-line rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-sm">Table {tableMap[o.tableId] || '—'}</span>
                          <span className="text-xs text-muted">#{o.id.slice(-5).toUpperCase()} · {timeAgo(o.createdAt)}</span>
                        </div>
                        <ul className="space-y-1 mb-3">
                          {o.items.map((item, idx) => (
                            <li key={idx} className="flex justify-between text-sm">
                              <span><span className="font-bold text-accent-ink">{item.qty}×</span> {escapeHtml(item.name)}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="flex items-center justify-between pt-2 border-t border-line-soft">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ticket-status-${o.status}`}>{o.status}</span>
                          {canAdvance && o.status !== 'served' && (
                            <button type="button" onClick={() => advanceKitchenStatus(o.id, STATUS_ORDER[STATUS_ORDER.indexOf(o.status) + 1] || 'billed')} className="bg-accent text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-accent-ink transition-colors">
                              {o.status === 'pending' ? 'Start Cooking' : o.status === 'cooking' ? 'Mark Ready' : 'Advance'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showOrderModal && (
        <Modal isOpen={showOrderModal} onClose={() => { setShowOrderModal(false); setEditingOrderId(null); setCart([]); }} wide>
          <h3 className="font-display text-xl font-semibold mb-5">{editingOrderId ? 'Add items to order' : 'New order'}</h3>
          {editingOrderId ? (
            <p className="text-sm text-muted mb-4">Adding items to Table {tables.find(t => t.id === orders.find(o => o.id === editingOrderId)?.tableId)?.number} · Ticket #{editingOrderId.slice(-5).toUpperCase()}</p>
          ) : (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-ink-soft mb-1">Table</label>
              <select className="filter-select w-full" value={selectedTableId} onChange={e => setSelectedTableId(e.target.value)}>
                {availableTablesFromCurrent().map(t => <option key={t.id} value={t.id}>Table {t.number} (seats {t.capacity})</option>)}
                {availableTablesFromCurrent().length === 0 && <option disabled>No available tables</option>}
              </select>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-xs font-semibold text-ink-soft mb-1">Search menu</label>
            <div className="search-bar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
              <input type="text" value={menuSearch} onChange={e => setMenuSearch(e.target.value)} placeholder="Search dishes..." className="w-full bg-transparent border-none outline-none text-sm" />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-ink-soft mb-1">Category</label>
            <select className="filter-select w-full" value={menuCategory} onChange={e => setMenuCategory(e.target.value)}>
              {menuCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="menu-pick-list mb-4">
            {filteredMenu.map(m => (
              <div key={m.id} className="flex items-center justify-between p-3 border border-line rounded-lg">
                <div>
                  <div className="font-semibold text-sm">{escapeHtml(m.name)}</div>
                  <div className="text-xs text-muted">{money(m.price)} · {m.category}</div>
                </div>
                <button type="button" onClick={() => addToCart(m.id)} className="bg-surface border border-line text-ink px-3 py-1.5 rounded-lg text-sm font-medium hover:border-accent hover:text-accent-ink transition-colors">Add</button>
              </div>
            ))}
            {filteredMenu.length === 0 && <p className="text-sm text-muted">No dishes match.</p>}
          </div>

          <h4 className="font-semibold text-sm mb-2">Order cart</h4>
          <ul className="cart-list mb-3">
            {cart.length === 0 && <li className="text-sm text-muted border-none">Cart is empty — add dishes above.</li>}
            {cart.map((c, idx) => (
              <li key={idx} className="flex items-center justify-between py-2 border-b border-line-soft">
                <span className="text-sm">{escapeHtml(c.name)}</span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => updateCartQty(idx, -1)} className="w-7 h-7 rounded-md border border-line bg-paper flex items-center justify-center text-xs font-bold">−</button>
                  <span className="text-sm font-mono w-6 text-center">{c.qty}</span>
                  <button type="button" onClick={() => updateCartQty(idx, 1)} className="w-7 h-7 rounded-md border border-line bg-paper flex items-center justify-center text-xs font-bold">+</button>
                  <span className="text-sm font-mono w-16 text-right">{money(c.price * c.qty)}</span>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex justify-between font-bold text-sm py-2 border-t border-line">
            <span>Subtotal</span>
            <span>{money(cartSubtotal)}</span>
          </div>

          <div className="flex justify-end gap-3 mt-5">
            <button type="button" onClick={() => { setShowOrderModal(false); setEditingOrderId(null); setCart([]); }} className="px-4 py-2 border border-line rounded-lg text-sm font-medium hover:bg-stone-50">Cancel</button>
            <button type="button" onClick={submitOrder} className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-ink">{editingOrderId ? 'Add to order' : 'Send to kitchen'}</button>
          </div>
        </Modal>
      )}

      {showInvoiceModal && invoiceOrder && (
        <Modal isOpen={showInvoiceModal} onClose={() => { setShowInvoiceModal(false); setInvoiceOrderId(null); }}>
          <h3 className="font-display text-xl font-semibold mb-4">Bill — Table {invoiceTableNumber}</h3>
          <ul className="cart-list mb-3">
            {invoiceOrder.items.map((i, idx) => (
              <li key={idx} className="flex justify-between py-2 border-b border-line-soft text-sm">
                <span>{i.qty}× {escapeHtml(i.name)}</span>
                <span className="font-mono">{money(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>
          {(() => {
            const subtotal = invoiceOrder.items.reduce((s, i) => s + i.price * i.qty, 0);
            const tax = subtotal * settings.taxRate;
            const total = subtotal + tax;
            return (
              <div className="text-sm space-y-2 mb-4">
                <div className="flex justify-between"><span>Subtotal</span><span>{money(subtotal)}</span></div>
                <div className="flex justify-between text-muted"><span>Tax ({(settings.taxRate * 100).toFixed(0)}%)</span><span>{money(tax)}</span></div>
                <div className="flex justify-between font-bold text-base border-t border-line pt-2"><span>Total</span><span>{money(total)}</span></div>
              </div>
            );
          })()}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-ink-soft mb-1">Payment method</label>
            <select id="inv-payment" className="filter-select w-full">
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Mobile Payment">Mobile Payment</option>
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => { setShowInvoiceModal(false); setInvoiceOrderId(null); }} className="px-4 py-2 border border-line rounded-lg text-sm font-medium hover:bg-stone-50">Cancel</button>
            <button type="button" onClick={confirmInvoice} className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-ink">Confirm & Close Bill</button>
          </div>
        </Modal>
      )}
    </AppShell>
  );
}

function statusBadge(status: Order['status']): string {
  const map: Record<Order['status'], string> = {
    pending: 'bg-danger-tint text-danger',
    cooking: 'bg-amber-tint text-amber',
    ready: 'bg-steel-tint text-steel',
    served: 'bg-herb-tint text-herb',
    billed: 'bg-stone-200 text-muted'
  };
  return map[status] || 'bg-stone-200 text-muted';
}
