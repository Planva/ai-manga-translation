// app/page.tsx
import DashboardLayout from './(dashboard)/layout';
import HomePage from './(dashboard)/page';

export default function Page() {
  return (
    <DashboardLayout>
      <HomePage />
    </DashboardLayout>
  );
}
