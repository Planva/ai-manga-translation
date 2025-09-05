'use client';
export const runtime = 'edge';
export default function ActivityPage() {
  const items = [
    { title: 'Signed in', time: 'Just now', detail: 'Web · Chrome' },
    { title: 'Updated team name', time: '2 hours ago', detail: 'Owner' },
    { title: 'Invited a member', time: 'Yesterday', detail: 'ethan@example.com' },
  ];

  return (
    <div className="space-y-6">
      <div className="card-glass rounded-2xl p-5 md:p-6">
        <h2 className="mb-4 text-lg font-semibold">Recent Activity</h2>

        <ul className="divide-y divide-white/10">
          {items.map((it, idx) => (
            <li key={idx} className="flex items-center justify-between py-3">
              <div>
                <div className="font-medium">{it.title}</div>
                <div className="text-sm opacity-70">{it.detail}</div>
              </div>
              <div className="text-sm opacity-70">{it.time}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
