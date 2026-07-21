import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { useThemeStore } from '../store/useThemeStore';

const palettes = {
  light: {
    background: '#FBF8F3',
    surface: '#FFFFFF',
    text: '#1F1B16',
    subtleText: '#6B6459',
    border: '#E5DFD3',
    accent: '#C9784E',
  },
  dark: {
    background: '#15130F',
    surface: '#211E18',
    text: '#F3EFE7',
    subtleText: '#A69E8E',
    border: '#332E24',
    accent: '#E0946A',
  },
} as const;

export type ResolvedTheme = keyof typeof palettes;

interface ThemeContextValue {
  resolvedMode: ResolvedTheme;
  colors: (typeof palettes)[ResolvedTheme];
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);

  const resolvedMode: ResolvedTheme =
    mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;

  const value = useMemo<ThemeContextValue>(
    () => ({
      resolvedMode,
      colors: palettes[resolvedMode],
      toggle: () => setMode(resolvedMode === 'dark' ? 'light' : 'dark'),
    }),
    [resolvedMode, setMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within a ThemeProvider');
  return ctx;
}
