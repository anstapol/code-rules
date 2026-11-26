import { useState } from 'react';

export function Greeting() {
  const [count, setCount] = useState(0);
  const increment = () => {
    setCount((value) => value + 1);
  };

  return (
    <button
      className="greeting"
      onClick={increment}
      type="button"
    >
      Clicked {count} times
    </button>
  );
}
