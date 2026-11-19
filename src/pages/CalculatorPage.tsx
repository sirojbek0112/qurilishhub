import { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import { AlertTriangle, BookmarkPlus, Download, Sliders } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { formatUzs, t, UZBEKISTAN_REGIONS } from '../i18n/translations.ts';
import { apiFetch } from '../lib/api.ts';
import { DonutBreakdownChart, HorizontalBarChart } from '../components/ui/Charts.tsx';

interface EstimateItem {
  itemKey: string;
  name: string;
  quantity: number;
  unit: string;
  unitPriceUzs: number;
  subtotalUzs: number;
}

interface CalcResult {
  isEstimate: boolean;
  disclaimer: string;
  regionMultiplier: number;
  items: EstimateItem[];
  materialsTotalUzs: number;
  laborTotalUzs: number;
  otherTotalUzs: number;
  totalEstimatedUzs: number;
}

interface ConfigRow {
  key: string;
  label_uz: string;
  unit: string;
  unit_price_uzs: number;
  coefficient: number;
}

export function CalculatorPage() {
  const { user, lang, navigate, showToast } = useApp();

  const [title, setTitle] = useState('Shaxsiy uy qurilishi smetasi');
  const [buildingAreaSqm, setBuildingAreaSqm] = useState(180);
  const [floors, setFloors] = useState(2);
  const [constructionType, setConstructionType] = useState<'RESIDENTIAL' | 'COMMERCIAL' | 'VILLA' | 'WAREHOUSE'>('VILLA');
  const [foundationType, setFoundationType] = useState<'STRIP' | 'SLAB' | 'PILE'>('STRIP');
  const [wallMaterial, setWallMaterial] = useState<'FIRED_BRICK' | 'FOAM_BLOCK' | 'MONOLITH_CONCRETE'>('FIRED_BRICK');
  const [roofType, setRoofType] = useState<'METAL_TILE' | 'PROFNASTIL' | 'FLAT_MEMBRANE'>('METAL_TILE');
  const [finishingType, setFinishingType] = useState<'ECONOMY' | 'STANDARD' | 'PREMIUM'>('STANDARD');
  const [region, setRegion] = useState<string>(UZBEKISTAN_REGIONS[0]);

  const [result, setResult] = useState<CalcResult | null>(null);
  const [configs, setConfigs] = useState<ConfigRow[]>([]);
  const [showAdminEditor, setShowAdminEditor] = useState(false);
  const [loading, setLoading] = useState(false);

  const canEditPrices = user && (user.role === 'ADMIN' || user.role === 'COMPANY');

  const runCalculation = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<CalcResult>('/api/estimates/calculate', {
        method: 'POST',
        body: JSON.stringify({
          buildingAreaSqm,
          floors,
          constructionType,
          foundationType,
          wallMaterial,
          roofType,
          finishingType,
          region,
          lang,
        }),
      });
      setResult(data);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Hisoblashda xatolik', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void runCalculation();
  }, [buildingAreaSqm, floors, constructionType, foundationType, wallMaterial, roofType, finishingType, region, lang]);

  useEffect(() => {
    apiFetch<{ items: ConfigRow[] }>('/api/estimates/configs')
      .then((res) => setConfigs(res.items))
      .catch(() => undefined);
  }, []);

  const handleSaveEstimate = async () => {
    if (!user) {
      navigate('/login');
      showToast('Smetani saqlash uchun tizimga kiring', 'info');
      return;
    }
    try {
      await apiFetch('/api/estimates', {
        method: 'POST',
        body: JSON.stringify({
          title,
          buildingAreaSqm,
          floors,
          constructionType,
          foundationType,
          wallMaterial,
          roofType,
          finishingType,
          region,
          lang,
        }),
      });
      showToast('Smeta boshqaruv panelingizga saqlandi', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Saqlashda xatolik', 'error');
    }
  };

  const handleDownloadPdf = () => {
    if (!result) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('QurilishHub - Preliminary Construction Estimate', 14, 18);
    doc.setFontSize(10);
    doc.text(`Project: ${title}`, 14, 26);
    doc.text(`Region: ${region} | Area: ${buildingAreaSqm} m2 x ${floors} floors | Type: ${constructionType}`, 14, 32);
    doc.text(`Note: ${result.disclaimer}`, 14, 38, { maxWidth: 180 });

    let y = 52;
    doc.setFontSize(10);
    doc.text('Item', 14, y);
    doc.text('Qty', 95, y);
    doc.text('Unit Price', 125, y);
    doc.text('Subtotal (UZS)', 162, y);
    y += 4;
    doc.line(14, y, 196, y);
    y += 7;

    result.items.forEach((it) => {
      doc.text(it.name.slice(0, 38), 14, y);
      doc.text(`${it.quantity} ${it.unit}`, 95, y);
      doc.text(it.unitPriceUzs.toLocaleString('en-US'), 125, y);
      doc.text(it.subtotalUzs.toLocaleString('en-US'), 162, y);
      y += 7;
    });

    y += 4;
    doc.line(14, y, 196, y);
    y += 8;
    doc.setFontSize(12);
    doc.text(`Total Estimated Cost: ${formatUzs(result.totalEstimatedUzs)}`, 14, y);
    doc.save(`qurilishhub-estimate-${Date.now()}.pdf`);
    showToast('PDF smeta yuklab olindi', 'success');
  };

  const handleUpdateConfig = async (key: string, unitPriceUzs: number, coefficient: number) => {
    try {
      await apiFetch(`/api/estimates/configs/${key}`, {
        method: 'PATCH',
        body: JSON.stringify({ unitPriceUzs, coefficient }),
      });
      showToast(`${key} narxi yangilandi`, 'success');
      void runCalculation();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Yangilashda xatolik', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
            Aqlli Qurilish Smeta Kalkulyatori
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            O&apos;zbekiston hududlari bo&apos;yicha materiallar miqdori va taxminiy xarajatlar hisobi (UZS)
          </p>
        </div>
        {canEditPrices && (
          <button
            type="button"
            onClick={() => setShowAdminEditor((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium bg-white dark:bg-slate-900"
          >
            <Sliders className="w-4 h-4" />
            Narx va koeffitsiyentlarni tahrirlash
          </button>
        )}
      </div>

      {/* Prominent Estimate Disclaimer */}
      <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-900 dark:text-amber-200">
          {result?.disclaimer || t(lang, 'estimateDisclaimer')}
        </p>
      </div>

      {showAdminEditor && canEditPrices && (
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            Bazaviy birlik narxlari va koeffitsiyentlar (Admin / Kompaniya)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {configs.map((cfg) => (
              <div key={cfg.key} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                <p className="text-xs font-semibold text-slate-900 dark:text-white">{cfg.label_uz}</p>
                <div className="space-y-1.5">
                  <label className="block text-[11px] text-slate-500">Narx (UZS / {cfg.unit})</label>
                  <input
                    type="number"
                    value={cfg.unit_price_uzs}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setConfigs((prev) =>
                        prev.map((c) => (c.key === cfg.key ? { ...c, unit_price_uzs: val } : c))
                      );
                    }}
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                  />
                  <label className="block text-[11px] text-slate-500">Koeffitsiyent</label>
                  <input
                    type="number"
                    step="0.05"
                    value={cfg.coefficient}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setConfigs((prev) =>
                        prev.map((c) => (c.key === cfg.key ? { ...c, coefficient: val } : c))
                      );
                    }}
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdateConfig(cfg.key, cfg.unit_price_uzs, cfg.coefficient)}
                    className="w-full py-1.5 text-xs font-semibold rounded bg-[#1E40AF] text-white"
                  >
                    Saqlash
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Parameters Panel */}
        <div className="lg:col-span-5 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 h-fit">
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Obyekt parametrlari</h2>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Smeta nomi</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Qavat maydoni (m²)
              </label>
              <input
                type="number"
                min={20}
                max={20000}
                value={buildingAreaSqm}
                onChange={(e) => setBuildingAreaSqm(Math.max(20, Number(e.target.value)))}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Qavatlar soni</label>
              <input
                type="number"
                min={1}
                max={20}
                value={floors}
                onChange={(e) => setFloors(Math.max(1, Math.min(20, Number(e.target.value))))}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Hudud</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
              >
                {UZBEKISTAN_REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Bino turi</label>
              <select
                value={constructionType}
                onChange={(e) => setConstructionType(e.target.value as typeof constructionType)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
              >
                <option value="RESIDENTIAL">Turar-joy uyi</option>
                <option value="VILLA">Zamonaviy villa / Kottej</option>
                <option value="COMMERCIAL">Tijorat / Ofis binosi</option>
                <option value="WAREHOUSE">Omborxona / Angar</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Poydevor turi</label>
              <select
                value={foundationType}
                onChange={(e) => setFoundationType(e.target.value as typeof foundationType)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
              >
                <option value="STRIP">Lenta poydevor (Lentochniy)</option>
                <option value="SLAB">Yaxlit plita (Monolit plita)</option>
                <option value="PILE">Qoziqli poydevor (Svay)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Devor materiali</label>
              <select
                value={wallMaterial}
                onChange={(e) => setWallMaterial(e.target.value as typeof wallMaterial)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
              >
                <option value="FIRED_BRICK">Pishiq qizil g&apos;isht</option>
                <option value="FOAM_BLOCK">Gazoblok / Penoblok</option>
                <option value="MONOLITH_CONCRETE">Monolit temir-beton</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Tom turi</label>
              <select
                value={roofType}
                onChange={(e) => setRoofType(e.target.value as typeof roofType)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
              >
                <option value="METAL_TILE">Metallocherepitsa</option>
                <option value="PROFNASTIL">Profnastil</option>
                <option value="FLAT_MEMBRANE">Tekis membrana tom</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Pardozlash darajasi</label>
              <select
                value={finishingType}
                onChange={(e) => setFinishingType(e.target.value as typeof finishingType)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
              >
                <option value="ECONOMY">Qora suvoq / Bazaviy</option>
                <option value="STANDARD">Standart kalit topshirish</option>
                <option value="PREMIUM">Premium dizaynerlik</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={handleSaveEstimate}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#1E40AF] hover:bg-blue-800 text-white text-sm font-semibold whitespace-nowrap"
            >
              <BookmarkPlus className="w-4 h-4" />
              {t(lang, 'saveEstimate')}
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#EA580C] hover:bg-orange-700 text-white text-sm font-semibold whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              {t(lang, 'downloadPdf')}
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-7 space-y-6">
          {result && (
            <>
              <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Taxminiy umumiy smeta ({buildingAreaSqm * floors} m² umumiy maydon · x{result.regionMultiplier} hudud koeff.)
                    </p>
                    <p className="font-mono tabular-nums text-3xl font-bold text-slate-900 dark:text-white mt-1">
                      {formatUzs(result.totalEstimatedUzs)}
                    </p>
                  </div>
                  {loading && <span className="text-xs text-slate-400">Yangilanmoqda...</span>}
                </div>

                <DonutBreakdownChart
                  materialsUzs={result.materialsTotalUzs}
                  laborUzs={result.laborTotalUzs}
                  otherUzs={result.otherTotalUzs}
                  labels={{
                    materials: 'Materiallar',
                    labor: 'Ishchi kuchi',
                    other: 'Muhandislik va boshqa',
                  }}
                />
              </div>

              <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                  Materiallar va xarajatlar jadvali (Taxminiy)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-xs text-slate-500 dark:text-slate-400">
                        <th className="py-2.5 pr-4">Pozitsiya</th>
                        <th className="py-2.5 pr-4 text-right">Miqdor</th>
                        <th className="py-2.5 pr-4 text-right">Birlik narxi</th>
                        <th className="py-2.5 text-right">Jami (UZS)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {result.items.map((item) => (
                        <tr key={item.itemKey} className="hover:bg-slate-50 dark:hover:bg-slate-950/60">
                          <td className="py-3 pr-4 font-medium text-slate-900 dark:text-white">{item.name}</td>
                          <td className="py-3 pr-4 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="py-3 pr-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                            {item.unitPriceUzs.toLocaleString('en-US')}
                          </td>
                          <td className="py-3 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                            {item.subtotalUzs.toLocaleString('en-US')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                  Xarajatlar taqsimoti
                </h3>
                <HorizontalBarChart
                  data={result.items.map((it) => ({
                    label: it.name,
                    value: it.subtotalUzs,
                  }))}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
