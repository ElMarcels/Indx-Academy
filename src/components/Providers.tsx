'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './ThemeProvider';
import { I18nProvider } from './I18nProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <ThemeProvider>
        <SessionProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'var(--toast-bg)',
                color: 'var(--toast-color)',
                border: '1px solid var(--toast-border)',
              },
              success: {
                iconTheme: {
                  primary: '#40c057',
                  secondary: 'var(--toast-bg)',
                },
              },
              error: {
                iconTheme: {
                  primary: '#fa5252',
                  secondary: 'var(--toast-bg)',
                },
              },
            }}
          />
        </SessionProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}
