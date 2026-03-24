'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ShieldX } from 'lucide-react';

import { useAuthStore } from '@/stores/auth-store';
import { hasRouteAccess } from '@/lib/constants/routeAccess';
import { Button } from '@/components/ui/button';

interface RouteGuardProps {
  children: React.ReactNode;
}

export function RouteGuard({ children }: RouteGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const userRoleId = user?.roleId ?? 0;

  if (!hasRouteAccess(pathname, userRoleId)) {
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
