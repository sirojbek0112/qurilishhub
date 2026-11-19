import { AppProvider, useApp } from './context/AppContext.tsx';
import { Header } from './components/Header.tsx';
import { Footer } from './components/Footer.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { CalculatorPage } from './pages/CalculatorPage.tsx';
import {
  MaterialsPage,
  ProductDetailPage,
  ServicesPage,
  ServiceDetailPage,
  PriceComparisonPage,
} from './pages/MarketplacePages.tsx';
import {
  CompaniesPage,
  CompanyDetailPage,
  ArchitectsPage,
  ArchitectDetailPage,
  ProjectsPage,
  ProjectDetailPage,
} from './pages/DirectoryPages.tsx';
import {
  AboutPage,
  BlogPage,
  BlogDetailPage,
  ContactPage,
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
} from './pages/ContentAndAuthPages.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';

function AppRouter() {
  const { path } = useApp();
  const cleanPath = path.split('?')[0];

  const renderPage = () => {
    if (cleanPath === '/' || cleanPath === '') return <HomePage />;
    if (cleanPath === '/about') return <AboutPage />;
    if (cleanPath === '/materials') return <MaterialsPage />;
    if (cleanPath.startsWith('/materials/')) {
      const id = Number(cleanPath.split('/')[2]);
      return <ProductDetailPage id={id} />;
    }
    if (cleanPath === '/services') return <ServicesPage />;
    if (cleanPath.startsWith('/services/')) {
      const id = Number(cleanPath.split('/')[2]);
      return <ServiceDetailPage id={id} />;
    }
    if (cleanPath === '/companies') return <CompaniesPage />;
    if (cleanPath.startsWith('/companies/')) {
      const id = Number(cleanPath.split('/')[2]);
      return <CompanyDetailPage id={id} />;
    }
    if (cleanPath === '/architects') return <ArchitectsPage />;
    if (cleanPath.startsWith('/architects/')) {
      const id = Number(cleanPath.split('/')[2]);
      return <ArchitectDetailPage id={id} />;
    }
    if (cleanPath === '/projects') return <ProjectsPage />;
    if (cleanPath.startsWith('/projects/')) {
      const id = Number(cleanPath.split('/')[2]);
      return <ProjectDetailPage id={id} />;
    }
    if (cleanPath === '/compare') return <PriceComparisonPage />;
    if (cleanPath === '/calculator') return <CalculatorPage />;
    if (cleanPath === '/blog') return <BlogPage />;
    if (cleanPath.startsWith('/blog/')) {
      return <BlogDetailPage id={cleanPath.split('/')[2]} />;
    }
    if (cleanPath === '/contact') return <ContactPage />;
    if (cleanPath === '/login') return <LoginPage />;
    if (cleanPath === '/register') return <RegisterPage />;
    if (cleanPath === '/forgot-password') return <ForgotPasswordPage />;
    if (cleanPath.startsWith('/dashboard')) return <DashboardPage />;
    return <HomePage />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header />
      <main className="flex-1">{renderPage()}</main>
      <Footer />
      <CartDrawer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}
