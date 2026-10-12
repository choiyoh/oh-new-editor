import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Nav } from './components/layout/Nav';
import { Footer } from './components/layout/Footer';
import { Hero } from './components/sections/Hero';
import { FeatureGrid } from './components/sections/FeatureGrid';
import { PackageShowcase } from './components/sections/PackageShowcase';
import { CTABanner } from './components/sections/CTABanner';
import { usePathname } from './hooks/usePathname';

const Docs = lazy(() => import('./pages/Docs').then((module) => ({ default: module.Docs })));
const DemoSection = lazy(() => import('./components/sections/DemoSection').then((module) => ({ default: module.DemoSection })));

export default function App() {
  const { t } = useTranslation('common');
  const isDocs = usePathname().startsWith('/docs');

  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-[#09090b] dark:text-zinc-100">
      <Nav />
      <main>
        {isDocs ? (
          <Suspense fallback={<div role="status" aria-busy="true" className="min-h-[60vh] p-8">{t('nav.docs')}…</div>}>
            <Docs />
          </Suspense>
        ) : (
          <>
            <Hero />
            <FeatureGrid />
            <PackageShowcase />
            <Suspense fallback={<section id="demo" role="status" aria-busy="true" className="min-h-[640px] p-8">{t('nav.demo')}…</section>}>
              <DemoSection />
            </Suspense>
            <CTABanner />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
