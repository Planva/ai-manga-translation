'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/db/schema';
import { signOut } from '@/app/(login)/actions';
import { Home, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function RightSide() {
  const [open, setOpen] = useState(false);
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const router = useRouter();

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/sign-in" className="btn-login">Login</Link>
        <Link href="/sign-up" className="btn-signup">Sign Up</Link>
      </div>
    );
  }

  const initials = (user.email || 'U').slice(0, 2).toUpperCase();

  async function handleSignOut() {
    await signOut();
    mutate('/api/user');
    router.push('/');
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="
            relative rounded-full p-[2px] outline-none
            border border-white/12 bg-white/10 backdrop-blur
            shadow-[0_6px_20px_rgba(0,0,0,.35)]
            transition hover:bg-white/16
            focus-visible:ring-2 focus-visible:ring-indigo-400/60
          "
        >
          <span className="block size-9 rounded-full overflow-hidden bg-[rgba(2,6,23,.65)]">
            <Avatar className="size-9">
              <AvatarImage className="object-cover" alt={user?.name || ''} />
              <AvatarFallback
                className="h-full w-full flex items-center justify-center
                          text-[11px] font-semibold tracking-wide text-white/90
                          bg-transparent"
              >
                {initials}
              </AvatarFallback>
            </Avatar>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56 rounded-2xl border border-white/10 bg-[rgba(2,6,23,.82)] p-2 text-[var(--c-text)] shadow-xl backdrop-blur">
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/dashboard" className="flex w-full items-center">
            <Home className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__bar">
        <div className="site-header__inner">
          <Link href="/" className="site-brand">
            <Image
              src="/branding/logo.svg"
              alt="Borderless Translator"
              width={36}
              height={36}
              className="site-brand__icon"
              priority
            />
            <span className="site-brand__text">Borderless Translator</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="site-nav-link">Home</Link>
            <Link href="/pricing" className="site-nav-link">Price</Link>
            
            <Link href="/#faq" className="site-nav-link">FAQ</Link>
            <Link href="/#how-to" className="site-nav-link">How to use</Link>
          </nav>

          <RightSide />
        </div>
      </div>
    </header>
  );
}
