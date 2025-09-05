// app/(login)/layout.tsx
import type { ReactNode } from 'react';
import Header from '@/components/site-header';

export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <div className="auth-wrap">
        <div className="auth-card w-full max-w-[420px] p-6 md:p-8">
          {children}
        </div>
      </div>
    </>
  );
}
