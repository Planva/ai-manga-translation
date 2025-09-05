'use client';
export const runtime = 'edge';
export default function SecurityPage() {
  return (
    <div className="space-y-6">
      {/* Password */}
      <div className="card-glass rounded-2xl p-5 md:p-6">
        <h2 className="mb-4 text-lg font-semibold">Password</h2>
        <form className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-1">
            <label className="mb-1 block text-sm opacity-80">Current password</label>
            <input
              type="password"
              className="w-full rounded-xl border border-white/12 bg-white/5 px-3 py-2 outline-none focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-400/40"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="mb-1 block text-sm opacity-80">New password</label>
            <input
              type="password"
              className="w-full rounded-xl border border-white/12 bg-white/5 px-3 py-2 outline-none focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-400/40"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-xl bg-[var(--c-accent)] px-4 py-2 font-medium text-white shadow hover:brightness-110"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>

      {/* 2FA */}
      <div className="card-glass rounded-2xl p-5 md:p-6">
        <h2 className="mb-2 text-lg font-semibold">Two-factor Authentication</h2>
        <p className="mb-4 text-sm opacity-80">
          Add an extra layer of security to your account.
        </p>
        <button className="rounded-xl border border-white/15 bg-white/8 px-4 py-2 font-medium hover:bg-white/12">
          Enable 2FA
        </button>
      </div>

      {/* API Token（示例） */}
      <div className="card-glass rounded-2xl p-5 md:p-6">
        <h2 className="mb-2 text-lg font-semibold">API Token</h2>
        <div className="flex flex-wrap gap-3">
          <code className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            ••••••••••••••••••••••
          </code>
          <button className="rounded-xl border border-white/15 bg-white/8 px-3 py-2 hover:bg-white/12">
            Reveal
          </button>
          <button className="rounded-xl bg-[var(--c-accent)] px-3 py-2 text-white hover:brightness-110">
            Regenerate
          </button>
        </div>
      </div>
    </div>
  );
}
