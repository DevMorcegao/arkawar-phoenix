'use client';

import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { ThemeLoadingScreen } from '@/components/ThemeLoadingScreen';
import { useEffect, useState } from 'react';

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true); // Carregamento inicial e troca de tema
  const { resolvedTheme } = useTheme(); // Use `resolvedTheme` para garantir o estado real do tema

  // Controla o estado de carregamento inicial
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false); // Desativa o carregamento após 2 segundos
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Monitora mudanças de tema
  useEffect(() => {
    if (!loading && resolvedTheme) {
      setLoading(true);
      const timer = setTimeout(() => {
        setLoading(false); // Exibe loading rapidamente para mudanças de tema
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [resolvedTheme]);

  // Renderiza a tela de loading enquanto o estado `loading` estiver ativo
  if (loading) {
    return <ThemeLoadingScreen />;
  }

  return <>{children}</>;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem>
      <ThemeWrapper>{children}</ThemeWrapper>
    </NextThemesProvider>
  );
}
