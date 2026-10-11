import { Nav } from './components/layout/Nav';
import { Footer } from './components/layout/Footer';
import { Hero } from './components/sections/Hero';
import { FeatureGrid } from './components/sections/FeatureGrid';
import { PackageShowcase } from './components/sections/PackageShowcase';
import { DemoSection } from './components/sections/DemoSection';
import { CTABanner } from './components/sections/CTABanner';
import { Docs } from './pages/Docs';
import { usePathname } from './hooks/usePathname';

export default function App() {
  const isDocs = usePathname().startsWith('/docs');

  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-[#09090b] dark:text-zinc-100">
      <Nav />
      <main>
        {isDocs ? (
          <Docs />
        ) : (
          <>
            <Hero />
            <FeatureGrid />
            <PackageShowcase />
            <DemoSection />
            <CTABanner />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
