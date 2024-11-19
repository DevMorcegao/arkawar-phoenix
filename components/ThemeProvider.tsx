'use client'

import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes'
import { ThemeLoadingScreen } from '@/components/ThemeLoadingScreen'
import { useState, useEffect, useCallback } from 'react'

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const [isThemeChanging, setIsThemeChanging] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Função para mudar o tema com a sequência correta
  const handleThemeChange = useCallback((newTheme: string) => {
    // 1. Mostra a animação imediatamente
    setIsThemeChanging(true);

    // 2. Aguarda 500ms com a animação visível
    const totalDuration = 2000; // Tempo total da animação
    const themeChangeDelay = 700; // Momento em que o tema muda

    // 3. Muda o tema no meio da animação
    setTimeout(() => {
      setTheme(newTheme);
    }, themeChangeDelay);

    // 4. Remove a animação após o tempo total
    setTimeout(() => {
      setIsThemeChanging(false);
    }, totalDuration);
  }, [setTheme]);

  // Sobrescreve a função setTheme do next-themes
  useEffect(() => {
    if (window) {
      const originalSetTheme = (window as any).__next?.setTheme;
      if (originalSetTheme) {
        (window as any).__next.setTheme = handleThemeChange;
      }
      return () => {
        if (originalSetTheme) {
          (window as any).__next.setTheme = originalSetTheme;
        }
      };
    }
  }, [handleThemeChange]);

  // Monitora mudanças no tema (para mudanças do tema do sistema)
  useEffect(() => {
    if (theme && resolvedTheme) {
      setIsThemeChanging(true);
      
      const totalDuration = 2000;
      const themeChangeDelay = 700;

      setTimeout(() => {
        setIsThemeChanging(false);
      }, totalDuration);
    }
  }, [theme, resolvedTheme]);

  return (
    <>
      <ThemeLoadingScreen isVisible={isThemeChanging} />
      {children}
    </>
  );
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <ThemeWrapper>{children}</ThemeWrapper>
    </NextThemesProvider>
  );
}
