'use client';

import { useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/AppShell';
import { Store } from '@/lib/storage';
import { requireAuth } from '@/lib/auth';
import { money, fmtDateTime, onDataChange, escapeHtml } from '@/lib/utils';
import type { Invoice, Session } from '@/lib/types';
import { BarChart3, Receipt, TrendingUp, Wallet } from 'lucide-react';

export default function ReportsPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [range, setRange] = useState<'today' | 'week' | 'month' | 'custom'>('week');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [tableMap, setTableMap] = useState<Record<string, number>>({});

  const loadData = async () => {
    const [invoicesData, tablesData] = await Promise.all([
      Store.invoices(),
      Store.tables()
    ]);
    setInvoices(invoicesData);
    const map: Record<string, number> = {};
    tablesData.forEach(t => { map[t.id] = t.number; });
    setTableMap(map);
  };

  useEffect(() => {
    const init = async () => {
      const s = await requireAuth(['admin', 'manager']);
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

  if (!session) return null;

  const rangeDates = () => {
    const now = new Date();
    let from: Date, to: Date = new Date(now);
    to.setHours(23, 59, 59, 999);
    if (range === 'today') { from = new Date(now); from.setHours(0, 0, 0, 0); }
    else if (range === 'week') { from = new Date(now); from.setDate(from.getDate() - 6); from.setHours(0, 0, 0, 0); }
    else if (range === 'month') { from = new Date(now); from.setDate(from.getDate() - 29); from.setHours(0, 0, 0, 0); }
    else { from = customFrom ? new Date(customFrom) : new Date(now); from.setHours(0, 0, 0, 0); to = customTo ? new Date(customTo) : new Date(now); to.setHours(23, 59, 59, 999); }
    return { from, to };
  };

  const { from, to } = rangeDates();

  const filteredInvoices = useMemo(() => {
    return invoices.filter(i => {
      const d = new Date(i.createdAt);
      return d >= from && d <= to;
    });
  }, [invoices, from, to]);

  const revenue = filteredInvoices.reduce((s, i) => s + i.total, 0);
  const avgOrder = filteredInvoices.length ? revenue / filteredInvoices.length : 0;

  const itemTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    filteredInvoices.forEach(inv => inv.items.forEach(it => {
      totals[it.name] = (totals[it.name] || 0) + it.qty;
    }));
    return Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [filteredInvoices]);

  const maxQty = itemTotals.length ? itemTotals[0][1] : 1;

  const chartData = useMemo(() => {
    const days: Array<{ label: string; value: number }> = [];
    const cursor = new Date(from);
    while (cursor <= to && days.length < 31) {
      const dayTotal = filteredInvoices.filter(i => new Date(i.createdAt).toDateString() === cursor.toDateString()).reduce((s, i) => s + i.total, 0);
      days.push({ label: cursor.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }), value: dayTotal });
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }, [filteredInvoices, from, to]);

  const sortedInvoices = useMemo(() => {
    return [...filteredInvoices].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [filteredInvoices]);

  return (
    <AppShell activePath="/reports">
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted font-semibold">Reports</p>
          <h2 className="font-display text-3xl font-semibold text-ink">Sales Reports</h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <select className="filter-select" value={range} onChange={e => setRange(e.target.value as typeof range)}>
            <option value="today">Today</option>
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="custom">Custom range</option>
          </select>
          {range === 'custom' && (
            <div className="flex items-center gap-3">
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="filter-select" />
              <span className="text-muted text-sm">to</span>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="filter-select" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="bg-surface border border-line rounded-2xl p-5 shadow-sm">
            <div className="text-xs text-muted font-semibold uppercase tracking-wider mb-1">Total revenue</div>
            <div className="font-display text-3xl font-bold text-ink">{money(revenue)}</div>
            <div className="text-xs text-muted mt-1">{from.toLocaleDateString()} – {to.toLocaleDateString()}</div>
          </div>
          <div className="bg-surface border border-line rounded-2xl p-5 shadow-sm">
            <div className="text-xs text-muted font-semibold uppercase tracking-wider mb-1">Orders billed</div>
            <div className="font-display text-3xl font-bold text-ink">{filteredInvoices.length}</div>
          </div>
          <div className="bg-surface border border-line rounded-2xl p-5 shadow-sm">
            <div className="text-xs text-muted font-semibold uppercase tracking-wider mb-1">Average order value</div>
            <div className="font-display text-3xl font-bold text-ink">{money(avgOrder)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-surface border border-line rounded-2xl p-5 shadow-sm">
            <h3 className="font-display text-lg font-semibold mb-4">Revenue by day</h3>
            <div className="bar-chart">
              {chartData.map((d, idx) => {
                const max = Math.max(...chartData.map(c => c.value), 1);
                return (
                  <div key={idx} className="bar-col">
                    {d.value > 0 && <span className="bar-val">{money(d.value)}</span>}
                    <div className="bar" style={{ height: `${Math.max(4, (d.value / max) * 100)}%` }}></div>
                    <span className="bar-label">{d.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-surface border border-line rounded-2xl p-5 shadow-sm">
            <h3 className="font-display text-lg font-semibold mb-4">Top-selling dishes</h3>
            {itemTotals.length === 0 ? (
              <div className="text-center py-8 text-muted">No sales in this range yet.</div>
            ) : (
              <ul className="rank-list">
                {itemTotals.map(([name, qty], idx) => (
                  <li key={name} className="rank-row">
                    <span className="rank-num">{idx + 1}</span>
                    <span className="w-28 text-sm">{escapeHtml(name)}</span>
                    <span className="rank-bar-track"><span className="rank-bar-fill" style={{ width: `${(qty / maxQty) * 100}%` }}></span></span>
                    <span className="rank-val">{qty} sold</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="bg-surface border border-line rounded-2xl p-5 shadow-sm">
          <h3 className="font-display text-lg font-semibold mb-4">Invoice log</h3>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Table</th>
                  <th>Waiter</th>
                  <th>Payment</th>
                  <th>Total</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {sortedInvoices.length === 0 && (
                  <tr><td colSpan={6}><div className="text-center py-8 text-muted">No invoices in this range.</div></td></tr>
                )}
                {sortedInvoices.map(inv => (
                  <tr key={inv.id}>
                    <td className="font-mono text-sm">#{inv.id.slice(-5).toUpperCase()}</td>
                    <td>Table {tableMap[inv.tableId] || '—'}</td>
                    <td>{escapeHtml(inv.waiterName || '—')}</td>
                    <td>{inv.paymentMethod}</td>
                    <td className="font-mono">{money(inv.total)}</td>
                    <td className="text-sm text-muted">{fmtDateTime(inv.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
