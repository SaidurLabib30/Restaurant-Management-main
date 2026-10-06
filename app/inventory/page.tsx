'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import Modal from '@/components/Modal';
import { Store, uid } from '@/lib/storage';
import { requireAuth, toast } from '@/lib/auth';
import { escapeHtml, onDataChange } from '@/lib/utils';
import { inventoryStatus } from '@/lib/storage';
import type { Session, InventoryItem } from '@/lib/types';
import { Plus, Minus, Search, PencilLine, Trash2 } from 'lucide-react';

export default function InventoryPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const loadData = async () => {
    setInventory(await Store.inventory());
  };

  useEffect(() => {
    const init = async () => {
      const s = await requireAuth(['admin', 'manager', 'waiter', 'kitchen']);
      setSession(s);
      if (s) loadData();
    };
    init();
  }, []);

  useEffect(() => {
    if (!session) return;
    const cleanup = onDataChange(loadData);
    return cleanup;
  }, [session]);

  const canManage = ['admin', 'manager'].includes(session?.role || '');

  const filteredItems = inventory
    .filter(i => i.name.toLowerCase().includes(search.toLowerCase()) && (statusFilter === 'all' || inventoryStatus(i) === statusFilter))
    .sort((a, b) => a.name.localeCompare(b.name));

  const openAddModal = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const saveItem = async () => {
    const name = (document.getElementById('iv-name') as HTMLInputElement | null)?.value.trim() || '';
    const unit = (document.getElementById('iv-unit') as HTMLInputElement | null)?.value.trim() || '';
    const quantity = Number((document.getElementById('iv-qty') as HTMLInputElement | null)?.value || 0);
    const threshold = Number((document.getElementById('iv-threshold') as HTMLInputElement | null)?.value || 0);

    if (!name || !unit || quantity < 0 || threshold < 0) return toast('Please fill in all fields', 'error');

    const inv = await Store.inventory();
    if (editingItem) {
      const item = inv.find(i => i.id === editingItem.id);
      if (item) Object.assign(item, { name, unit, quantity, threshold });
    } else {
      inv.push({ id: uid('inv'), name, unit, quantity, threshold });
    }
    await Store.saveInventory(inv);
    setShowModal(false);
    setEditingItem(null);
    toast(editingItem ? 'Ingredient updated' : 'Ingredient added', 'success');
    loadData();
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this ingredient? Any dish recipes referencing it will keep the reference but it will no longer deduct stock.')) return;
    await Store.saveInventory((await Store.inventory()).filter(i => i.id !== id));
    toast('Ingredient removed', 'success');
    loadData();
  };

  const restock = async (id: string) => {
    const amount = prompt('Add how much stock? (enter a number)');
    const n = parseFloat(amount || '0');
    if (!n || n <= 0) return;
    const inv = await Store.inventory();
    const item = inv.find(i => i.id === id);
    if (!item) return;
    item.quantity = +(item.quantity + n).toFixed(2);
    await Store.saveInventory(inv);
    toast(`${item.name} restocked (+${n} ${item.unit})`, 'success');
    loadData();
  };

  if (!session) return null;

  const stats = {
    total: inventory.length,
    low: inventory.filter(i => inventoryStatus(i) === 'low').length,
    out: inventory.filter(i => inventoryStatus(i) === 'out').length
  };

  return (
    <AppShell activePath="/inventory">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted font-semibold">Inventory</p>
            <h2 className="font-display text-3xl font-semibold text-ink">Stock control</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface border border-line rounded-2xl p-5 shadow-sm">
            <div className="text-xs text-muted font-semibold uppercase tracking-wider mb-1">Total ingredients</div>
            <div className="font-display text-3xl font-bold text-ink">{stats.total}</div>
          </div>
          <div className="bg-surface border border-line rounded-2xl p-5 shadow-sm">
            <div className="text-xs text-muted font-semibold uppercase tracking-wider mb-1">Low stock</div>
            <div className="font-display text-3xl font-bold text-amber">{stats.low}</div>
          </div>
          <div className="bg-surface border border-line rounded-2xl p-5 shadow-sm">
            <div className="text-xs text-muted font-semibold uppercase tracking-wider mb-1">Out of stock</div>
            <div className="font-display text-3xl font-bold text-danger">{stats.out}</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="search-bar">
              <Search className="w-4 h-4" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ingredients..." className="w-full bg-transparent border-none outline-none text-sm" />
            </div>
            <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="ok">In stock</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
            </select>
          </div>
          {canManage && (
            <button type="button" onClick={openAddModal} className="bg-accent text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-accent-ink transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Ingredient
            </button>
          )}
        </div>

        <div className="bg-surface border border-line rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ingredient</th>
                  <th>Quantity</th>
                  <th>Threshold</th>
                  <th>Status</th>
                  {canManage && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 && (
                  <tr><td colSpan={canManage ? 5 : 4}><div className="text-center py-8 text-muted">No ingredients match your filters.</div></td></tr>
                )}
                {filteredItems.map(item => {
                  const s = inventoryStatus(item);
                  return (
                    <tr key={item.id}>
                      <td><strong>{escapeHtml(item.name)}</strong></td>
                      <td className="font-mono text-sm">{item.quantity} {item.unit}</td>
                      <td className="font-mono text-sm">{item.threshold} {item.unit}</td>
                      <td><span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${s === 'ok' ? 'bg-herb-tint text-herb' : s === 'low' ? 'bg-amber-tint text-amber' : 'bg-danger-tint text-danger'}`}>{s === 'ok' ? 'In stock' : s === 'low' ? 'Low' : 'Out'}</span></td>
                      {canManage && (
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button type="button" onClick={() => restock(item.id)} className="bg-surface border border-line text-ink px-3 py-1.5 rounded-lg text-sm font-medium hover:border-accent hover:text-accent-ink transition-colors">+ Restock</button>
                            <button type="button" onClick={() => openEditModal(item)} className="icon-btn px-2 py-1 text-xs">✎</button>
                            <button type="button" onClick={() => deleteItem(item.id)} className="icon-btn px-2 py-1 text-xs text-danger hover:border-danger">🗑</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingItem(null); }}>
          <h3 className="font-display text-xl font-semibold mb-5">{editingItem ? 'Edit ingredient' : 'Add ingredient'}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1">Name</label>
              <input id="iv-name" defaultValue={editingItem?.name || ''} className="w-full border border-line rounded-lg px-3 py-2.5 bg-paper text-ink focus:border-accent focus:outline-none" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1">Unit</label>
                <input id="iv-unit" defaultValue={editingItem?.unit || ''} placeholder="kg, l, pcs" className="w-full border border-line rounded-lg px-3 py-2.5 bg-paper text-ink focus:border-accent focus:outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1">Quantity in stock</label>
                <input id="iv-qty" type="number" step="0.01" min="0" defaultValue={editingItem?.quantity ?? ''} className="w-full border border-line rounded-lg px-3 py-2.5 bg-paper text-ink focus:border-accent focus:outline-none" required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1">Low-stock threshold</label>
              <input id="iv-threshold" type="number" step="0.01" min="0" defaultValue={editingItem?.threshold ?? ''} className="w-full border border-line rounded-lg px-3 py-2.5 bg-paper text-ink focus:border-accent focus:outline-none" required />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-5">
            <button type="button" onClick={() => { setShowModal(false); setEditingItem(null); }} className="px-4 py-2 border border-line rounded-lg text-sm font-medium hover:bg-stone-50">Cancel</button>
            <button type="button" onClick={saveItem} className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-ink">{editingItem ? 'Save changes' : 'Add ingredient'}</button>
          </div>
        </Modal>
      )}
    </AppShell>
  );
}
