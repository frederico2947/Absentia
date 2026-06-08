import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard =
  (allowedRoles: ('admin' | 'employee')[]): CanActivateFn =>
  () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const user = auth.currentUser();

    if (user && allowedRoles.includes(user.role)) {
      return true;
    }

    return router.createUrlTree(['/dashboard']);
  };
