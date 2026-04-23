import { useTheme } from '../hooks/useTheme';

export default function ThemeToggle() {
  const { dark, toggle } = useTheme();
  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      title={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      aria-label={dark ? 'Modo claro' : 'Modo oscuro'}
    >
      {dark ? '☀️' : '🌙'}
    </button>
  );
}
