// app/page.tsx
import DashboardLayout from './(dashboard)/layout'
import HomePage from './(dashboard)/page'

export default function Page() {
  // 用分组里的 layout 包住，保持你现在的 Header/Footer 等
  return (
    <DashboardLayout>
      <HomePage />
    </DashboardLayout>
  )
}

// 如 (dashboard)/page.tsx 里还有 export 的 metadata / generateMetadata 等，也可以：
// export * from './(dashboard)/page'
