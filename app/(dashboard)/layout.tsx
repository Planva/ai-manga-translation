// 片段：app/(dashboard)/layout.tsx
let user = null, team = null;
try {
  user = await getUser();
  team = user ? await getTeamForUser(user.id) : null;
} catch (err) {
  console.error('Dashboard layout bootstrap failed on edge:', err);
  // 不阻断渲染，给到安全的空态
}
