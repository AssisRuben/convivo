import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

function subscribeNoop() {
  return () => {};
}

/**
 * To support static rendering, this value needs to be re-calculated on the
 * client side for web. useSyncExternalStore avoids the setState-in-effect
 * cascading-render lint issue that useState+useEffect would cause here.
 */
function useHasHydrated() {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  );
}

export function useColorScheme() {
  const hasHydrated = useHasHydrated();
  const colorScheme = useRNColorScheme();

  return hasHydrated ? colorScheme : 'light';
}
