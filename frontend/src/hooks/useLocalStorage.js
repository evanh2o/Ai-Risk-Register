import { useState, useCallback } from "react";

export default function useLocalStorage(key, initialValue) {
  const [stored, setStored] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value) => {
      const next = value instanceof Function ? value(stored) : value;
      setStored(next);
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // quota exceeded — ignore
      }
    },
    [key, stored],
  );

  return [stored, setValue];
}
