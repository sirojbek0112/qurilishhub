import { useState } from 'react';
import { Minus, Plus, ShieldCheck, Trash2, X } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { formatUzs, pickLocalized, t, UZBEKISTAN_REGIONS } from '../i18n/translations.ts';
import { apiFetch } from '../lib/api.ts';
import { ResilientImage } from './ui/ResilientImage.tsx';

export function CartDrawer() {
  const { user, lang, cart, cartOpen, setCartOpen, updateCartQty, removeFromCart, clearCart, navigate, showToast } =
    useApp();
  const [address, setAddress] = useState('Toshkent sh., Chilonzor tumani, 9-kvartal');
  const [region, setRegion] = useState<string>(UZBEKISTAN_REGIONS[0]);
  const [provider, setProvider] = useState<'PAYME' | 'CLICK' | 'UZUM'>('PAYME');
  const [submitting, setSubmitting] = useState(false);

  if (!cartOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.product.price_uzs * item.quantity, 0);

  const handleCheckout = async () => {
    if (!user) {
      setCartOpen(false);
      navigate('/login');
      showToast('Buyurtma berish uchun avval tizimga kiring', 'info');
      return;
    }
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const orderRes = await apiFetch<{ orders: Array<{ id: number; orderNumber: string; totalUzs: number }> }>(
        '/api/orders',
        {
          method: 'POST',
          body: JSON.stringify({
            deliveryAddress: address,
            region,
            items: cart.map((c) => ({ productId: c.product.id, quantity: c.quantity })),
          }),
        }
      );

      for (const ord of orderRes.orders) {
        const pay = await apiFetch<{ id: number }>('/api/payments/initiate', {
          method: 'POST',
          body: JSON.stringify({ provider, orderId: ord.id }),
        });
        await apiFetch(`/api/payments/${pay.id}/confirm-sandbox`, { method: 'POST' });
      }

      clearCart();
      setCartOpen(false);
      showToast(
        `${orderRes.orders.length} ta buyurtma yaratildi va ${provider} Sandbox orqali tasdiqlandi!`,
        'success'
      );
      navigate('/dashboard');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Buyurtmada xatolik', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-xs no-print">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full flex flex-col border-l border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            {t(lang, 'cartTitle')} ({cart.length})
          </h2>
          <button
            type="button"
            onClick={() => setCartOpen(false)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <p className="text-sm text-slate-500 dark:text-slate-400">{t(lang, 'emptyCart')}</p>
              <button
                type="button"
                onClick={() => {
                  setCartOpen(false);
                  navigate('/materials');
                }}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-[#1E40AF] text-white"
              >
                {t(lang, 'navMaterials')}
              </button>
            </div>
          ) : (
            <>
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                >
                  <ResilientImage
                    src={item.product.image_url}
                    alt={pickLocalized(item.product as unknown as Record<string, unknown>, 'name', lang)}
                    className="w-16 h-16 rounded-md object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {pickLocalized(item.product as unknown as Record<string, unknown>, 'name', lang)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-0.5">
                      {formatUzs(item.product.price_uzs)} / {item.product.unit}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900">
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.product.id, item.quantity - 1)}
                          className="p-1.5 text-slate-600 dark:text-slate-300"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2 text-xs font-mono tabular-nums font-medium">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.product.id, item.quantity + 1)}
                          className="p-1.5 text-slate-600 dark:text-slate-300"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Hudud</label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                  >
                    {UZBEKISTAN_REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Yetkazib berish manzili
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    To&apos;lov usuli (Sandbox rejim)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['PAYME', 'CLICK', 'UZUM'] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setProvider(p)}
                        className={`py-2 text-xs font-semibold rounded-lg border transition-colors ${
                          provider === p
                            ? 'bg-[#1E40AF] text-white border-[#1E40AF]'
                            : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Karta ma&apos;lumotlari saqlanmaydi. Sandbox webhook sinovi.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-5 border-t border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50 dark:bg-slate-950">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">{t(lang, 'total')}</span>
              <span className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {formatUzs(subtotal)}
              </span>
            </div>
            <button
              type="button"
              disabled={submitting}
              onClick={handleCheckout}
              className="w-full py-2.5 px-4 rounded-lg bg-[#EA580C] hover:bg-orange-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
            >
              {submitting ? 'Rasmiylashtirilmoqda...' : t(lang, 'checkout')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
