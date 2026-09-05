import { useEffect, useState } from "react";

export function usePersistentState<T>(key: string, initial: T): [T, (next: T) => void, string] {
  const [storageError, setStorageError] = useState("");
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      setStorageError("");
    } catch {
      setStorageError("This browser blocked local configuration storage.");
    }
  }, [key, value]);

  return [value, setValue, storageError];
}
