import { Nav } from './components/layout/Nav';
import { Footer } from './components/layout/Footer';
import { Hero } from './components/sections/Hero';
import { FeatureGrid } from './components/sections/FeatureGrid';
import { PackageShowcase } from './components/sections/PackageShowcase';
import { DemoSection } from './components/sections/DemoSection';
import { CTABanner } from './components/sections/CTABanner';

export default function App() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Nav />
      <main>
        <Hero />
        <FeatureGrid />
        <PackageShowcase />
        <DemoSection />
        <CTABanner />
      </main>
      <Footer />
    </div>
  );
}
