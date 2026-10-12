import { useEffect, useState } from 'react';
import { sitePathname } from '../lib/routing';

export function usePathname() {
  const [pathname, setPathname] = useState(sitePathname);

  useEffect(() => {
    const update = () => setPathname(sitePathname());
    window.addEventListener('popstate', update);
    window.addEventListener('hashchange', update);
    return () => {
      window.removeEventListener('popstate', update);
      window.removeEventListener('hashchange', update);
    };
  }, []);

  return pathname;
}
