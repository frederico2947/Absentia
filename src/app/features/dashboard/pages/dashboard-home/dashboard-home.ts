import { Component, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard-home',
  imports: [],
  template: '',
})
export class DashboardHome {
  constructor() {
    const auth = inject(AuthService);
    const router = inject(Router);

    effect(() => {
      const user = auth.currentUser();
      if (user) {
        void router.navigateByUrl(
          user.role === 'admin' ? '/dashboard/admin' : '/dashboard/employee',
          { replaceUrl: true },
        );
      }
    });
  }
}
