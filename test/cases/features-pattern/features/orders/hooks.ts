import { useState } from 'react';

export function useOrderCount() {
  const [count] = useState(0);
  return count;
}
