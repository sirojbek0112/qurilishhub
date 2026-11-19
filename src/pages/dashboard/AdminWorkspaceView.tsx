import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { formatUzs } from '../../i18n/translations.ts';
import { apiFetch } from '../../lib/api.ts';

export function AdminWorkspaceView() {
  const { showToast } = useApp();
  const [subTab, setSubTab] = useState<'overview' | 'users' | 'moderation' | 'complaints' | 'audit'>('overview');
  const [overview, setOverview] = useState<{
    metrics: {
      usersTotal: number;
      productsTotal: number;
      servicesTotal: number;
      projectsTotal: number;
      ordersTotal: number;
      revenueUzs: number;
      openComplaints: number;
      pendingVerifications: number;
    };
  } | null>(null);
  const [users, setUsers] = useState<Array<{ id: number; full_name: string; email: string; role: string; verified: number; is_active: number }>>([]);
  const [companies, setCompanies] = useState<Array<{ id: number; name: string; license_number: string; verified: number }>>([]);
  const [products, setProducts] = useState<Array<{ id: number; name_uz: string; seller_name: string; moderation_status: string }>>([]);
  const [complaints, setComplaints] = useState<Array<{ id: number; reason: string; details: string; status: string; reporter_name: string }>>([]);
  const [auditLogs, setAuditLogs] = useState<Array<{ id: number; actor_name: string; action: string; entity_type: string; created_at: string }>>([]);

  // Confirmation dialog state
  const [confirmAction, setConfirmAction] = useState<{ title: string; onConfirm: () => Promise<void> } | null>(null);

  const loadAll = () => {
    apiFetch<typeof overview>('/api/admin/overview').then(setOverview).catch(() => undefined);
    apiFetch<{ items: typeof users }>('/api/admin/users').then((r) => setUsers(r.items)).catch(() => undefined);
    apiFetch<{ items: typeof companies }>('/api/admin/companies').then((r) => setCompanies(r.items)).catch(() => undefined);
    apiFetch<{ items: typeof products }>('/api/admin/moderation/products').then((r) => setProducts(r.items)).catch(() => undefined);
    apiFetch<{ items: typeof complaints }>('/api/admin/complaints').then((r) => setComplaints(r.items)).catch(() => undefined);
    apiFetch<{ items: typeof auditLogs }>('/api/admin/audit-logs').then((r) => setAuditLogs(r.items)).catch(() => undefined);
  };

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 w-fit">
        {(
          [
            { key: 'overview', label: 'Analitika' },
            { key: 'users', label: 'Foydalanuvchilar' },
            { key: 'moderation', label: 'Moderatsiya' },
            { key: 'complaints', label: 'Shikoyatlar' },
            { key: 'audit', label: 'Audit loglar' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setSubTab(tab.key)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              subTab === tab.key
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {subTab === 'overview' && overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <p className="text-xs text-slate-500">Jami foydalanuvchilar</p>
            <p className="font-mono tabular-nums text-2xl font-bold mt-1">{overview.metrics.usersTotal}</p>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <p className="text-xs text-slate-500">Mahsulot / Xizmatlar</p>
            <p className="font-mono tabular-nums text-2xl font-bold mt-1">
              {overview.metrics.productsTotal} / {overview.metrics.servicesTotal}
            </p>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <p className="text-xs text-slate-500">Umumiy savdo (UZS)</p>
            <p className="font-mono tabular-nums text-xl font-bold text-emerald-600 mt-1">
              {formatUzs(overview.metrics.revenueUzs)}
            </p>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <p className="text-xs text-slate-500">Ochiq shikoyatlar</p>
            <p className="font-mono tabular-nums text-2xl font-bold text-[#EA580C] mt-1">
              {overview.metrics.openComplaints}
            </p>
          </div>
        </div>
      )}

      {subTab === 'users' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-xs text-slate-500">
                <th className="py-3 px-4">Foydalanuvchi</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Rol</th>
                <th className="py-3 px-4">Holat</th>
                <th className="py-3 px-4 text-right">Boshqaruv</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="py-2.5 px-4 font-medium">{u.full_name}</td>
                  <td className="py-2.5 px-4 text-xs text-slate-500">{u.email}</td>
                  <td className="py-2.5 px-4 font-mono text-xs">{u.role}</td>
                  <td className="py-2.5 px-4 text-xs">{u.is_active ? 'Faol' : 'Bloklangan'}</td>
                  <td className="py-2.5 px-4 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmAction({
                          title: `${u.full_name} hisobini ${u.is_active ? 'bloklash' : 'faollashtirish'}ni tasdiqlaysizmi?`,
                          onConfirm: async () => {
                            await apiFetch(`/api/admin/users/${u.id}`, {
                              method: 'PATCH',
                              body: JSON.stringify({ isActive: u.is_active ? 0 : 1 }),
                            });
                            loadAll();
                            showToast('Foydalanuvchi holati yangilandi', 'success');
                          },
                        })
                      }
                      className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs"
                    >
                      {u.is_active ? 'Bloklash' : 'Faollashtirish'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {subTab === 'moderation' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h3 className="font-display text-base font-bold">Kompaniyalar verifikatsiyasi</h3>
            {companies.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0 text-sm">
                <span>{c.name} ({c.license_number})</span>
                <button
                  type="button"
                  onClick={async () => {
                    await apiFetch(`/api/admin/companies/${c.id}/verify`, {
                      method: 'PATCH',
                      body: JSON.stringify({ verified: !c.verified }),
                    });
                    loadAll();
                    showToast('Verifikatsiya yangilandi', 'success');
                  }}
                  className="px-3 py-1 rounded bg-[#1E40AF] text-white text-xs font-semibold"
                >
                  {c.verified ? 'Tasdiqlangan' : 'Tasdiqlash'}
                </button>
              </div>
            ))}
          </div>

          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h3 className="font-display text-base font-bold">Mahsulotlar moderatsiyasi</h3>
            {products.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0 text-sm">
                <span>{p.name_uz} · {p.seller_name}</span>
                <select
                  value={p.moderation_status}
                  onChange={async (e) => {
                    await apiFetch(`/api/admin/moderation/products/${p.id}`, {
                      method: 'PATCH',
                      body: JSON.stringify({ status: e.target.value }),
                    });
                    loadAll();
                    showToast('Moderatsiya saqlandi', 'success');
                  }}
                  className="px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                >
                  <option value="APPROVED">APPROVED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'complaints' && (
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <h3 className="font-display text-base font-bold">Shikoyatlar va murojaatlar</h3>
          {complaints.length === 0 ? (
            <p className="text-xs text-slate-500">Shikoyatlar mavjud emas.</p>
          ) : (
            complaints.map((c) => (
              <div key={c.id} className="py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center text-sm">
                <div>
                  <p className="font-medium">{c.reason} — {c.reporter_name}</p>
                  <p className="text-xs text-slate-500">{c.details}</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await apiFetch(`/api/admin/complaints/${c.id}`, {
                      method: 'PATCH',
                      body: JSON.stringify({ status: 'RESOLVED' }),
                    });
                    loadAll();
                  }}
                  className="px-3 py-1 rounded bg-emerald-600 text-white text-xs"
                >
                  {c.status}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {subTab === 'audit' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-slate-500">
                <th className="py-2.5 px-4">Vaqt</th>
                <th className="py-2.5 px-4">Ijrochi</th>
                <th className="py-2.5 px-4">Harakat</th>
                <th className="py-2.5 px-4">Obyekt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td className="py-2 px-4">{log.created_at}</td>
                  <td className="py-2 px-4">{log.actor_name || 'SYSTEM'}</td>
                  <td className="py-2 px-4 font-semibold">{log.action}</td>
                  <td className="py-2 px-4">{log.entity_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-w-sm w-full p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="font-display text-base font-bold text-slate-900 dark:text-white">Tasdiqlash</h4>
            <p className="text-sm text-slate-600 dark:text-slate-300">{confirmAction.title}</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={async () => {
                  await confirmAction.onConfirm();
                  setConfirmAction(null);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 text-white"
              >
                Tasdiqlayman
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
