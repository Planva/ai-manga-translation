'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
export const runtime = 'edge';
const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function GeneralPage() {
  const { data: user } = useSWR('/api/user', fetcher);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setEmail(user.email ?? '');
    }
  }, [user]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      // 按你项目的接口改，这里只是占位
      await fetch('/api/account', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      // 可加 toast
    } catch (err) {
      // 可加 toast
    }
  }

  return (
    <div className="space-y-6">
      <div className="card-glass rounded-2xl p-5 md:p-6">
        <h2 className="mb-4 text-lg font-semibold">Account Information</h2>

        <form onSubmit={onSave} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm opacity-80">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full rounded-xl border border-white/12 bg-white/5 px-3 py-2 outline-none ring-0 focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-400/40"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm opacity-80">Email</label>
            <input
              value={email}
              disabled
              className="w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/5 px-3 py-2 opacity-70"
            />
          </div>

          <button
            type="submit"
            className="rounded-xl bg-[var(--c-accent)] px-4 py-2 font-medium text-white shadow hover:brightness-110"
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}
