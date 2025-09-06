import { Suspense } from 'react';
import { Login } from '../login';
export const runtime = 'edge';
export default function SignInPage() {
  return (
    <Suspense>
      <Login mode="signin" />
    </Suspense>
  );
}
