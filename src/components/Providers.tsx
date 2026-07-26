'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#212529',
            color: '#f1f3f5',
            border: '1px solid #343a40',
          },
          success: {
            iconTheme: {
              primary: '#40c057',
              secondary: '#212529',
            },
          },
          error: {
            iconTheme: {
              primary: '#fa5252',
              secondary: '#212529',
            },
          },
        }}
      />
    </SessionProvider>
  );
}
