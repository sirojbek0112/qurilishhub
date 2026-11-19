import { useApp } from '../context/AppContext.tsx';
import { t } from '../i18n/translations.ts';

export function Footer() {
  const { lang, navigate } = useApp();

  const linkCls =
    'text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-left';

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3">
          <div className="font-display text-lg font-bold text-slate-900 dark:text-white">QurilishHub</div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            O&apos;zbekiston qurilish materiallari bozori, pudratchilar, arxitektorlar va loyiha boshqaruvi platformasi.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500">
            Toshkent sh., Amir Temur shoh ko&apos;chasi 107B · +998 71 200 90 90
          </p>
        </div>

        <div className="space-y-2.5 flex flex-col">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Platforma</h4>
          <button type="button" onClick={() => navigate('/materials')} className={linkCls}>
            {t(lang, 'navMaterials')}
          </button>
          <button type="button" onClick={() => navigate('/services')} className={linkCls}>
            {t(lang, 'navServices')}
          </button>
          <button type="button" onClick={() => navigate('/companies')} className={linkCls}>
            {t(lang, 'navCompanies')}
          </button>
          <button type="button" onClick={() => navigate('/architects')} className={linkCls}>
            {t(lang, 'navArchitects')}
          </button>
        </div>

        <div className="space-y-2.5 flex flex-col">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Vositalar</h4>
          <button type="button" onClick={() => navigate('/calculator')} className={linkCls}>
            {t(lang, 'navCalculator')}
          </button>
          <button type="button" onClick={() => navigate('/compare')} className={linkCls}>
            {t(lang, 'navCompare')}
          </button>
          <button type="button" onClick={() => navigate('/projects')} className={linkCls}>
            {t(lang, 'navProjects')}
          </button>
          <button type="button" onClick={() => navigate('/blog')} className={linkCls}>
            {t(lang, 'navBlog')}
          </button>
        </div>

        <div className="space-y-2.5 flex flex-col">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Kompaniya</h4>
          <button type="button" onClick={() => navigate('/about')} className={linkCls}>
            {t(lang, 'navAbout')}
          </button>
          <button type="button" onClick={() => navigate('/contact')} className={linkCls}>
            {t(lang, 'navContact')}
          </button>
          <a href="/api/docs" target="_blank" rel="noreferrer" className={linkCls}>
            REST API / OpenAPI
          </a>
          <button type="button" onClick={() => navigate('/login')} className={linkCls}>
            {t(lang, 'signIn')}
          </button>
        </div>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>© 2026 QurilishHub Uzbekistan. Barcha huquqlar himoyalangan.</span>
          <span>Click · Payme · Uzum Bank (Sandbox integratsiya tayyor)</span>
        </div>
      </div>
    </footer>
  );
}
