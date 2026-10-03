import { useEffect, useState } from 'react';
import { router, type Route } from '@/lib/router';

export function useRoute(): { route: Route; tabIndex: number } {
  const [state, setState] = useState<{ route: Route; tabIndex: number }>({
    route: router.current(),
    tabIndex: router.getTabIndex(),
  });

  useEffect(() => {
    return router.subscribe((route, _stack, tabIndex) => {
      setState({ route, tabIndex });
    });
  }, []);

  return state;
}
