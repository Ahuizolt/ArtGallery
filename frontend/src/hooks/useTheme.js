import { useState, useEffect } from 'react';

export function useTheme() {
  const [dark, setDark] = useState(() => {
    // Lee la preferencia guardada en sessionStorage (dura solo mientras el navegador está abierto)
    return sessionStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      sessionStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      sessionStorage.setItem('theme', 'light');
    }
  }, [dark]);

  return { dark, toggle: () => setDark((v) => !v) };
}
