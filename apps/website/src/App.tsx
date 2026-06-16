import { useEffect, useState } from 'react';
import { Nav } from './components/layout/Nav';
import { Footer } from './components/layout/Footer';
import { Hero } from './components/sections/Hero';
import { FeatureGrid } from './components/sections/FeatureGrid';
import { PackageShowcase } from './components/sections/PackageShowcase';
import { DemoSection } from './components/sections/DemoSection';
import { CTABanner } from './components/sections/CTABanner';
import { Docs } from './pages/Docs';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const isDocs = currentPath.startsWith('/docs');

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
