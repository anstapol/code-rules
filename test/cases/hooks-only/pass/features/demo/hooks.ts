import { useState } from 'react';

export function useToggle() {
  const [on, setOn] = useState(false);
  const toggle = () => setOn((value) => !value);
  return { on, toggle };
}
