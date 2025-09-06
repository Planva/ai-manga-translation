// app/page.tsx
import { redirect } from 'next/navigation';

// 不做任何鉴权判断，直接把根路径跳到 /sign-in
export default function Home() {
  redirect('/sign-in');
}
