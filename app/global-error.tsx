// app/global-error.tsx
'use client';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <html>
      <body style={{ padding: 16, color: '#fff', background: '#0b1220' }}>
        <h1>Something went wrong</h1>
        <pre style={{ whiteSpace: 'pre-wrap', opacity: .8 }}>{String(error?.message || error)}</pre>
        {error?.digest && <div>digest: {error.digest}</div>}
        <button onClick={() => reset()} style={{ marginTop: 12, padding: '6px 12px' }}>Try again</button>
      </body>
    </html>
  );
}
