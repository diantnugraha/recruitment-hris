'use client';

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldX } from 'lucide-react';

import { useAuthStore } from '@/stores/auth-store';
import { isHrRole } from '@/lib/constants/roles';
import { Button } from '@/components/ui/button';

interface RequireHrProps {
  children: ReactNode;
}

/**
 * Wrapper that shows a 403 Access Denied page when the current user is not HR.
 * Used on dedicated action pages (new/edit) where direct URL access must be
 * blocked for non-HR roles.
 *
 * The 403 JSX is duplicated from RouteGuard so both guards render the same
 * page. Keep them in sync.
 */
export function RequireHr({ children }: RequireHrProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isHr = isHrRole(user?.roleId);

  // During hydration user is null — render nothing until the store rehydrates.
  // The layout's auth redirect handles truly unauthenticated users.
  if (!user) {
    return null;
  }

  if (!isHr) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldX className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">403 — Access Denied</h1>
          <p className="text-muted-foreground">
            You don&apos;t have permission to access this page.
          </p>
          <Button onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
