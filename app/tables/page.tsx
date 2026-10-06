'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import Modal from '@/components/Modal';
import { Store, uid } from '@/lib/storage';
import { requireAuth, getSession, toast } from '@/lib/auth';
import { escapeHtml, onDataChange } from '@/lib/utils';
import type { Session, Table, Order } from '@/lib/types';
import { Plus, X, Check, Clock, Trash2 } from 'lucide-react';

function statusBadge(status: Table['status']) {
  const map = {
    available: 'bg-herb-tint text-herb',
    occupied: 'bg-danger-tint text-danger',
    reserved: 'bg-steel-tint text-steel'
  };
  return map[status];
}

function statusLabel(status: Table['status']) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function TableCard({ table, activeOrder, onAction, canManage }: {
  table: Table;
  activeOrder: Order | undefined;
  onAction: (action: string, id: string) => void;
  canManage: boolean;
}) {

  return (
    <div className={`bg-surface border border-line rounded-2xl p-4 shadow-sm flex flex-col gap-3 border-l-4 ${statusBadge(table.status).replace('text-', 'border-l-')}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="font-display text-xl font-semibold text-ink">Table {table.number}</div>
          <div className="text-sm text-muted mt-0.5">Seats {table.capacity}</div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-mono font-bold ${statusBadge(table.status)}`}>
          {statusLabel(table.status)}
        </span>
      </div>

      {activeOrder && (
        <div className="text-xs text-muted font-mono">
          Ticket #{activeOrder.id.slice(-5).toUpperCase()} · {activeOrder.status}
        </div>
      )}

      <div className="flex flex-col gap-2 mt-auto">
        {table.status === 'available' && (
          <>
            <button
              onClick={() => onAction('seat', table.id)}
              className="w-full bg-accent text-white py-2 px-3 rounded-lg font-semibold text-sm hover:bg-accent-ink transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Seat & Start Order
            </button>
            <button
              onClick={() => onAction('reserve', table.id)}
              className="w-full bg-surface border border-line text-ink py-2 px-3 rounded-lg font-semibold text-sm hover:border-accent hover:text-accent-ink transition-colors flex items-center justify-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Mark Reserved
            </button>
          </>
        )}

        {table.status === 'reserved' && (
          <>
            <button
              onClick={() => onAction('seat', table.id)}
              className="w-full bg-accent text-white py-2 px-3 rounded-lg font-semibold text-sm hover:bg-accent-ink transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Seat Now
            </button>
            <button
              onClick={() => onAction('unreserve', table.id)}
              className="w-full bg-surface border border-line text-ink py-2 px-3 rounded-lg font-semibold text-sm hover:border-accent hover:text-accent-ink transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel Reservation
            </button>
          </>
        )}

        {table.status === 'occupied' && (
          <>
            <a
              href={`/orders?table=${table.id}`}
              className="w-full bg-surface border border-line text-ink py-2 px-3 rounded-lg font-semibold text-sm hover:border-accent hover:text-accent-ink transition-colors flex items-center justify-center gap-2 text-center"
            >
              View Order
            </a>
            {!activeOrder && (
              <button
                onClick={() => onAction('free', table.id)}
                className="w-full bg-accent text-white py-2 px-3 rounded-lg font-semibold text-sm hover:bg-accent-ink transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Clear Table
              </button>
            )}
          </>
        )}

        {canManage && table.status === 'available' && (
          <button
            onClick={() => onAction('delete', table.id)}
            className="w-full bg-danger-tint text-danger py-2 px-3 rounded-lg font-semibold text-sm hover:bg-danger hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Remove Table
          </button>
        )}
      </div>
    </div>
  );
}

function AddTableModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [number, setNumber] = useState('');
  const [capacity, setCapacity] = useState('4');

  const handleSubmit = async () => {
    const num = parseInt(number);
    const cap = parseInt(capacity);
    if (!num || !cap) return toast('Please fill in both fields', 'error');

    const currentTables = await Store.tables();
    if (currentTables.some(t => t.number === num)) return toast('That table number already exists', 'error');

    currentTables.push({ id: uid('t'), number: num, capacity: cap, status: 'available', currentOrderId: null });
    await Store.saveTables(currentTables);
    onClose();
    toast(`Table ${num} added`, 'success');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h3 className="font-display text-xl font-semibold mb-5">Add table</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-ink-soft mb-1">Table number</label>
          <input
            type="number"
            min="1"
            value={number}
            onChange={e => setNumber(e.target.value)}
            className="w-full px-3 py-2.5 border border-line rounded-lg bg-surface text-ink focus:border-accent focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-soft mb-1">Seating capacity</label>
          <input
            type="number"
            min="1"
            value={capacity}
            onChange={e => setCapacity(e.target.value)}
            className="w-full px-3 py-2.5 border border-line rounded-lg bg-surface text-ink focus:border-accent focus:outline-none"
            required
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="px-4 py-2 border border-line rounded-lg text-sm font-medium hover:bg-stone-50">Cancel</button>
        <button onClick={handleSubmit} className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-ink">Add table</button>
      </div>
    </Modal>
  );
}

export default function TablesPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const init = async () => {
      const s = await requireAuth(['admin', 'manager', 'waiter']);
      setSession(s);
      if (s) loadData();
    };
    init();
  }, []);

  const loadData = async () => {
    const [tablesData, ordersData] = await Promise.all([
      Store.tables(),
      Store.orders()
    ]);
    setTables(tablesData.sort((a, b) => a.number - b.number));
    setOrders(ordersData);
  };

  useEffect(() => {
    if (!session) return;
    const cleanup = onDataChange(loadData);
    return cleanup;
  }, [session]);

  const canManage = ['admin', 'manager'].includes(session?.role || '');

  const handleAction = async (action: string, id: string) => {
    const currentTables = await Store.tables();
    const table = currentTables.find(t => t.id === id);
    if (!table) return;

    switch (action) {
      case 'seat':
        table.status = 'occupied';
        await Store.saveTables(currentTables);
        window.location.href = `/orders?table=${table.id}&new=1`;
        return;
      case 'reserve':
        table.status = 'reserved';
        await Store.saveTables(currentTables);
        toast(`Table ${table.number} marked reserved`, 'success');
        break;
      case 'unreserve':
        table.status = 'available';
        await Store.saveTables(currentTables);
        toast(`Reservation cancelled for Table ${table.number}`);
        break;
      case 'free':
        table.status = 'available';
        table.currentOrderId = null;
        await Store.saveTables(currentTables);
        toast(`Table ${table.number} cleared`);
        break;
      case 'delete':
        if (!confirm(`Remove Table ${table.number}? This cannot be undone.`)) return;
        await Store.saveTables(currentTables.filter(t => t.id !== id));
        toast(`Table ${table.number} removed`, 'success');
        break;
    }
    loadData();
  };

  if (!session) return null;

  return (
    <AppShell activePath="/tables">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-herb-tint text-herb">
              {tables.filter(t => t.status === 'available').length} available
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-danger-tint text-danger">
              {tables.filter(t => t.status === 'occupied').length} occupied
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-steel-tint text-steel">
              {tables.filter(t => t.status === 'reserved').length} reserved
            </span>
          </div>
          {canManage && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-accent text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-accent-ink transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Table
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tables.map(table => {
            const activeOrder = orders.find(o => o.id === table.currentOrderId && o.status !== 'billed');
            return (
              <TableCard key={table.id} table={table} activeOrder={activeOrder} onAction={handleAction} canManage={canManage} />
            );
          })}
          {tables.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted">
              <p>No tables set up yet.</p>
            </div>
          )}
        </div>

        <AddTableModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
      </div>
    </AppShell>
  );
}