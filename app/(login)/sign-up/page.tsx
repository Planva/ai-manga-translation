import { Suspense } from 'react';
import { Login } from '../login';
export const runtime = 'edge';
export default function SignUpPage() {
  return (
    <Suspense>
      <Login mode="signup" />
    </Suspense>
  );
}
