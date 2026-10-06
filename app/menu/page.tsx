'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import AppShell from '@/components/AppShell';
import Modal from '@/components/Modal';
import { Store, uid } from '@/lib/storage';
import { requireAuth, toast } from '@/lib/auth';
import { money, escapeHtml, onDataChange } from '@/lib/utils';
import type { Session, MenuItem, InventoryItem } from '@/lib/types';
import { Plus, PencilLine, Trash2, CheckCircle2, CircleOff, Image as ImageIcon } from 'lucide-react';

export default function MenuPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [recipeRows, setRecipeRows] = useState<Array<{ inventoryId: string; qty: number }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    const [menuData, inventoryData] = await Promise.all([
      Store.menu(),
      Store.inventory()
    ]);
    setMenu(menuData);
    setInventory(inventoryData);
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

  const categories = useMemo(() => ['All', ...Array.from(new Set(menu.map(m => m.category)))], [menu]);

  const filteredMenu = useMemo(() => {
    return menu.filter(m => (category === 'All' || m.category === category) && m.name.toLowerCase().includes(search.toLowerCase()));
  }, [menu, category, search]);

  const getImagePath = (imagePath: string | undefined): string => {
    if (!imagePath) return '';
    if (imagePath.startsWith('data:image/')) return imagePath;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('/')) return imagePath;
    try {
      return new URL(imagePath, typeof window !== 'undefined' ? window.location.href : 'http://localhost').href;
    } catch {
      return imagePath;
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setPendingImage(null);
    setRecipeRows([]);
    setShowModal(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setPendingImage(item.image || null);
    setRecipeRows(item.recipe ? item.recipe.map(r => ({ ...r })) : []);
    setShowModal(true);
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this dish from the menu?')) return;
    await Store.saveMenu((await Store.menu()).filter(m => m.id !== id));
    toast('Dish removed', 'success');
    loadData();
  };

  const saveItem = async () => {
    const name = (document.getElementById('mi-name') as HTMLInputElement | null)?.value.trim() || '';
    const categoryVal = (document.getElementById('mi-category') as HTMLInputElement | null)?.value.trim() || '';
    const priceVal = Number((document.getElementById('mi-price') as HTMLInputElement | null)?.value || 0);
    const statusVal = (document.getElementById('mi-status') as HTMLSelectElement | null)?.value || 'available';
    const description = (document.getElementById('mi-desc') as HTMLTextAreaElement | null)?.value.trim() || '';

    if (!name || !categoryVal || !priceVal) return toast('Please fill in name, category and price', 'error');

    const menuData = await Store.menu();
    const recipe = recipeRows.filter(r => r.inventoryId && r.qty > 0);

    if (editingItem) {
      const m = menuData.find(x => x.id === editingItem.id);
      if (m) {
        Object.assign(m, { name, price: priceVal, status: statusVal as 'available' | 'unavailable', description, image: pendingImage || '', recipe });
      }
    } else {
      menuData.push({
        id: uid('m'),
        name,
        category: categoryVal,
        price: priceVal,
        description,
        status: statusVal as 'available' | 'unavailable',
        image: pendingImage || '',
        recipe
      });
    }

    await Store.saveMenu(menuData);
    setShowModal(false);
    setEditingItem(null);
    toast(editingItem ? 'Dish updated' : 'Dish added', 'success');
    loadData();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast('Please choose an image under 2MB', 'error');
    const reader = new FileReader();
    reader.onload = () => setPendingImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  if (!session) return null;

  return (
    <AppShell activePath="/menu">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted font-semibold">Menu</p>
            <h2 className="font-display text-3xl font-semibold text-ink">Menu Management</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <button key={c} type="button" onClick={() => setCategory(c)} className={`px-3 py-1.5 rounded-full text-sm font-medium border ${category === c ? 'bg-accent text-white border-accent' : 'bg-surface border-line text-ink hover:border-accent'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search dishes..." className="w-full pl-9 pr-3 py-2 border border-line rounded-lg bg-paper text-ink text-sm focus:border-accent focus:outline-none" />
          </div>
          {canManage && (
            <button type="button" onClick={openAddModal} className="bg-accent text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-accent-ink transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Dish
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredMenu.map(m => {
            const imagePath = getImagePath(m.image);
            return (
              <div key={m.id} className={`bg-surface border border-line rounded-xl shadow-sm flex flex-col overflow-hidden border-l-4 ${m.status === 'available' ? 'border-l-herb' : 'border-l-danger'}`}>
                <div className="relative w-full h-40 bg-stone-100 overflow-hidden">
                  {imagePath ? (
                    <img src={imagePath} alt={m.name} loading="lazy" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : null}
                  {!imagePath && (
                    <div className="absolute inset-0 flex items-center justify-center text-muted text-2xl font-bold bg-stone-200">
                      {m.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="p-3 flex flex-col gap-1.5 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm text-ink truncate">{escapeHtml(m.name)}</h3>
                      <p className="text-[11px] text-muted truncate">{escapeHtml(m.category)}</p>
                    </div>
                    <span className="text-xs font-semibold text-accent-ink whitespace-nowrap">{money(m.price)}</span>
                  </div>
                  <p className="text-[11px] text-muted line-clamp-2 leading-snug">{escapeHtml(m.description || '')}</p>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${m.status === 'available' ? 'bg-herb-tint text-herb' : 'bg-stone-200 text-muted'}`}>{m.status}</span>
                    {canManage && (
                      <div className="flex gap-1">
                        <button type="button" onClick={() => openEditModal(m)} className="p-1.5 rounded-md hover:bg-stone-100 text-xs text-ink-soft hover:text-accent-ink transition-colors">✎</button>
                        <button type="button" onClick={() => deleteItem(m.id)} className="p-1.5 rounded-md hover:bg-stone-100 text-xs text-danger hover:bg-danger-tint transition-colors">🗑</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {filteredMenu.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted">
              <p>No dishes found</p>
              <p className="text-sm mt-1">Try a different search or category.</p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingItem(null); }} wide>
          <h3 className="font-display text-xl font-semibold mb-5">{editingItem ? 'Edit dish' : 'Add dish'}</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1">Name</label>
                <input id="mi-name" defaultValue={editingItem?.name || ''} className="w-full border border-line rounded-lg px-3 py-2.5 bg-paper text-ink focus:border-accent focus:outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1">Category</label>
                <input id="mi-category" defaultValue={editingItem?.category || ''} placeholder="e.g. Mains" className="w-full border border-line rounded-lg px-3 py-2.5 bg-paper text-ink focus:border-accent focus:outline-none" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1">Price</label>
                <input id="mi-price" type="number" step="0.01" min="0" defaultValue={editingItem?.price || ''} className="w-full border border-line rounded-lg px-3 py-2.5 bg-paper text-ink focus:border-accent focus:outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1">Status</label>
                <select id="mi-status" className="w-full border border-line rounded-lg px-3 py-2.5 bg-paper text-ink focus:border-accent focus:outline-none">
                  <option value="available" selected={!editingItem || editingItem.status === 'available'}>Available</option>
                  <option value="unavailable" selected={editingItem?.status === 'unavailable'}>Unavailable</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1">Description</label>
              <textarea id="mi-desc" rows={2} defaultValue={editingItem?.description || ''} className="w-full border border-line rounded-lg px-3 py-2.5 bg-paper text-ink focus:border-accent focus:outline-none"></textarea>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-2">Photo (optional)</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-lg border border-line bg-stone-100 overflow-hidden flex items-center justify-center text-muted text-xs">
                  {pendingImage ? <img src={pendingImage} alt="" className="w-full h-full object-cover" /> : <span>No photo</span>}
                </div>
                <div className="flex flex-col gap-2">
                  <input type="file" id="mi-photo-input" accept="image/*" className="hidden" onChange={handleFileChange} ref={fileInputRef} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 border border-line rounded-lg text-sm font-medium hover:border-accent">Choose image</button>
                  {pendingImage && <button type="button" onClick={() => setPendingImage(null)} className="px-3 py-1.5 border border-line rounded-lg text-sm font-medium hover:border-danger text-danger">Remove</button>}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1">Recipe (ingredients consumed per serving) — optional</label>
              <div id="recipe-rows" className="space-y-2">
                {recipeRows.length === 0 && <p className="text-xs text-muted">No ingredients linked yet.</p>}
                {recipeRows.map((r, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <select value={r.inventoryId} onChange={e => setRecipeRows(prev => prev.map((row, i) => i === idx ? { ...row, inventoryId: e.target.value } : row))} className="flex-1 border border-line rounded-lg px-3 py-2 bg-paper text-sm">
                      {inventory.map(inv => <option key={inv.id} value={inv.id}>{escapeHtml(inv.name)} ({inv.unit})</option>)}
                    </select>
                    <input type="number" step="0.01" min="0" value={r.qty} onChange={e => setRecipeRows(prev => prev.map((row, i) => i === idx ? { ...row, qty: Number(e.target.value) } : row))} className="w-20 border border-line rounded-lg px-3 py-2 bg-paper text-sm" />
                    <button type="button" onClick={() => setRecipeRows(prev => prev.filter((_, i) => i !== idx))} className="p-1.5 rounded-md hover:bg-stone-100 text-xs text-danger hover:border-danger transition-colors">✕</button>
                  </div>
                ))}
              </div>
              {inventory.length > 0 && (
                <button type="button" onClick={() => setRecipeRows(prev => [...prev, { inventoryId: inventory[0].id, qty: 0.1 }])} className="mt-2 px-3 py-1.5 border border-line rounded-lg text-sm font-medium hover:border-accent">+ Add ingredient</button>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-5">
            <button type="button" onClick={() => { setShowModal(false); setEditingItem(null); }} className="px-4 py-2 border border-line rounded-lg text-sm font-medium hover:bg-stone-50">Cancel</button>
            <button type="button" onClick={saveItem} className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-ink">{editingItem ? 'Save changes' : 'Add dish'}</button>
          </div>
        </Modal>
      )}
    </AppShell>
  );
}
