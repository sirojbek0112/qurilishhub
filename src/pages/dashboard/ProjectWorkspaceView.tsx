import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { formatUzs, UZBEKISTAN_REGIONS } from '../../i18n/translations.ts';
import { apiFetch } from '../../lib/api.ts';
import type { Project, TaskStatus } from '../../types.ts';

interface ProjectDetailPayload {
  project: Project;
  tasks: Array<{ id: number; title: string; status: TaskStatus; priority: string; deadline: string; assignee_name: string }>;
  progress: Array<{ id: number; title: string; notes: string; percent_complete: number; created_at: string }>;
  expenses: Array<{ id: number; category: string; title: string; amount_uzs: number; expense_date: string }>;
  members: Array<{ id: number; full_name: string; member_role: string }>;
  documents: Array<{ id: number; title: string; doc_type: string; created_at: string }>;
}

export function ProjectWorkspaceView() {
  const { showToast } = useApp();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ProjectDetailPayload | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // Create project form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [region, setRegion] = useState<string>(UZBEKISTAN_REGIONS[0]);
  const [constructionType, setConstructionType] = useState('VILLA');
  const [area, setArea] = useState(220);
  const [floors, setFloors] = useState(2);
  const [budget, setBudget] = useState(950000000);

  // Sub-forms
  const [taskTitle, setTaskTitle] = useState('');
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState(5000000);
  const [expenseCategory, setExpenseCategory] = useState('Materiallar');
  const [progressTitle, setProgressTitle] = useState('');
  const [progressPct, setProgressPct] = useState(65);
  const [memberEmail, setMemberEmail] = useState('');
  const [docTitle, setDocTitle] = useState('');

  const loadProjects = () => {
    apiFetch<{ items: Project[] }>('/api/projects?mine=true')
      .then((res) => {
        setProjects(res.items);
        if (!selectedId && res.items.length > 0) {
          setSelectedId(res.items[0].id);
        }
      })
      .catch(() => undefined);
  };

  const loadDetail = (id: number) => {
    apiFetch<ProjectDetailPayload>(`/api/projects/${id}`).then(setDetail).catch(() => undefined);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedId) loadDetail(selectedId);
  }, [selectedId]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch<{ id: number }>('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description,
          address,
          region,
          constructionType,
          buildingAreaSqm: area,
          floors,
          estimatedBudgetUzs: budget,
          startDate: '2026-11-20',
          expectedEndDate: '2027-08-20',
        }),
      });
      setShowCreate(false);
      setName('');
      setDescription('');
      setAddress('');
      loadProjects();
      setSelectedId(res.id);
      showToast('Yangi qurilish loyihasi yaratildi', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Xatolik', 'error');
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !taskTitle.trim()) return;
    await apiFetch(`/api/projects/${selectedId}/tasks`, {
      method: 'POST',
      body: JSON.stringify({ title: taskTitle.trim(), priority: 'MEDIUM' }),
    });
    setTaskTitle('');
    loadDetail(selectedId);
    showToast('Vazifa qo‘shildi', 'success');
  };

  const handleTaskStatus = async (taskId: number, status: TaskStatus) => {
    await apiFetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    if (selectedId) loadDetail(selectedId);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !expenseTitle.trim()) return;
    await apiFetch(`/api/projects/${selectedId}/expenses`, {
      method: 'POST',
      body: JSON.stringify({
        category: expenseCategory,
        title: expenseTitle.trim(),
        amountUzs: expenseAmount,
        expenseDate: new Date().toISOString().slice(0, 10),
      }),
    });
    setExpenseTitle('');
    loadDetail(selectedId);
    loadProjects();
    showToast('Xarajat qayd etildi', 'success');
  };

  const handleAddProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !progressTitle.trim()) return;
    await apiFetch(`/api/projects/${selectedId}/progress`, {
      method: 'POST',
      body: JSON.stringify({
        title: progressTitle.trim(),
        notes: 'Maydondagi joriy holat hisoboti.',
        percentComplete: progressPct,
      }),
    });
    setProgressTitle('');
    loadDetail(selectedId);
    loadProjects();
    showToast('Progress yangilandi', 'success');
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !memberEmail.trim()) return;
    try {
      await apiFetch(`/api/projects/${selectedId}/members`, {
        method: 'POST',
        body: JSON.stringify({ email: memberEmail.trim(), memberRole: 'CONTRACTOR' }),
      });
      setMemberEmail('');
      loadDetail(selectedId);
      showToast('Pudratchi loyihaga biriktirildi', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Foydalanuvchi topilmadi', 'error');
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !docTitle.trim()) return;
    await apiFetch(`/api/projects/${selectedId}/documents`, {
      method: 'POST',
      body: JSON.stringify({ title: docTitle.trim(), docType: 'BLUEPRINT' }),
    });
    setDocTitle('');
    loadDetail(selectedId);
    showToast('Hujjat qo‘shildi', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
          Qurilish loyihalari boshqaruvi
        </h2>
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1E40AF] text-white text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          Yangi loyiha
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreateProject}
          className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <input
            required
            placeholder="Loyiha nomi"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
          />
          <input
            required
            placeholder="Manzil"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
          />
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
          >
            {UZBEKISTAN_REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select
            value={constructionType}
            onChange={(e) => setConstructionType(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
          >
            <option value="VILLA">Villa / Kottej</option>
            <option value="RESIDENTIAL">Turar-joy</option>
            <option value="COMMERCIAL">Tijorat</option>
          </select>
          <input
            type="number"
            placeholder="Maydon (m²)"
            value={area}
            onChange={(e) => setArea(Number(e.target.value))}
            className="px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
          />
          <input
            type="number"
            placeholder="Byudjet (UZS)"
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
          />
          <textarea
            required
            rows={2}
            placeholder="Loyiha tavsifi..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="sm:col-span-2 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
          />
          <div className="sm:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700">
              Bekor qilish
            </button>
            <button type="submit" className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#1E40AF] text-white">
              Saqlash
            </button>
          </div>
        </form>
      )}

      {/* Project Selector */}
      <div className="flex flex-wrap gap-2">
        {projects.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelectedId(p.id)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors ${
              selectedId === p.id
                ? 'bg-[#1E40AF] text-white border-[#1E40AF]'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {p.name} ({p.progress_percent}%)
          </button>
        ))}
      </div>

      {detail && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <p className="text-xs text-slate-500">Taxminiy byudjet</p>
              <p className="font-mono tabular-nums text-lg font-bold mt-1">{formatUzs(detail.project.estimated_budget_uzs)}</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <p className="text-xs text-slate-500">Sarflangan xarajat</p>
              <p className="font-mono tabular-nums text-lg font-bold text-[#EA580C] mt-1">{formatUzs(detail.project.spent_uzs)}</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <p className="text-xs text-slate-500">Bajarilish darajasi</p>
              <p className="font-mono tabular-nums text-lg font-bold text-emerald-600 mt-1">{detail.project.progress_percent}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tasks */}
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
              <h3 className="font-display text-base font-bold">Vazifalar (TODO → COMPLETED)</h3>
              <form onSubmit={handleAddTask} className="flex gap-2">
                <input
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Yangi vazifa nomi..."
                  className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                />
                <button type="submit" className="px-3 py-1.5 rounded-lg bg-[#1E40AF] text-white text-xs font-semibold">
                  Qo&apos;shish
                </button>
              </form>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {detail.tasks.map((t) => (
                  <div key={t.id} className="py-2.5 flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">{t.title}</span>
                    <select
                      value={t.status}
                      onChange={(e) => handleTaskStatus(t.id, e.target.value as TaskStatus)}
                      className="px-2 py-1 text-xs font-mono rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                    >
                      <option value="TODO">TODO</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="REVIEW">REVIEW</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Expenses */}
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
              <h3 className="font-display text-base font-bold">Loyiha xarajatlari</h3>
              <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="Xarajat nomi"
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                />
                <input
                  type="number"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(Number(e.target.value))}
                  className="px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                />
                <button type="submit" className="px-3 py-1.5 rounded-lg bg-[#EA580C] text-white text-xs font-semibold">
                  Kiritish
                </button>
              </form>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto">
                {detail.expenses.map((ex) => (
                  <div key={ex.id} className="py-2 flex justify-between text-xs">
                    <span>{ex.title} ({ex.category})</span>
                    <span className="font-mono tabular-nums font-semibold">{formatUzs(ex.amount_uzs)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress & Team */}
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
              <h3 className="font-display text-base font-bold">Progress hisoboti qo&apos;shish</h3>
              <form onSubmit={handleAddProgress} className="flex flex-wrap gap-2">
                <input
                  value={progressTitle}
                  onChange={(e) => setProgressTitle(e.target.value)}
                  placeholder="Bosqich nomi..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={progressPct}
                  onChange={(e) => setProgressPct(Number(e.target.value))}
                  className="w-20 px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                />
                <button type="submit" className="px-3 py-1.5 rounded-lg bg-[#1E40AF] text-white text-xs font-semibold">
                  Yangilash
                </button>
              </form>
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                {detail.progress.map((pr) => (
                  <div key={pr.id} className="py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <strong>{pr.percent_complete}%</strong> — {pr.title}
                  </div>
                ))}
              </div>
            </div>

            {/* Team & Documents */}
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
              <h3 className="font-display text-base font-bold">Pudratchi va hujjatlar</h3>
              <form onSubmit={handleAddMember} className="flex gap-2">
                <input
                  type="email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder="contractor@qurilishhub.uz"
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                />
                <button type="submit" className="px-3 py-1.5 rounded-lg bg-[#1E40AF] text-white text-xs font-semibold">
                  Biriktirish
                </button>
              </form>
              <form onSubmit={handleAddDocument} className="flex gap-2">
                <input
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="Chizma yoki ruxsatnoma nomi (.pdf)"
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                />
                <button type="submit" className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold">
                  Hujjat
                </button>
              </form>
              <div className="text-xs space-y-1 text-slate-500">
                <p>Jamoa: {detail.members.map((m) => `${m.full_name} (${m.member_role})`).join(', ')}</p>
                <p>Hujjatlar: {detail.documents.map((d) => d.title).join(', ') || 'Yo‘q'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
