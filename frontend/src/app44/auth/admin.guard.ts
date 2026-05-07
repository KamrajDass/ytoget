import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { ApiService } from '../shared/api.service';
import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const api = inject(ApiService);
  const router = inject(Router);

  if (!auth.getToken()) {
    return router.createUrlTree(['/login']);
  }

  const currentUser = auth.user();
  if (currentUser?.role === 'admin') {
    return true;
  }

  return api.getMe().pipe(
    map(({ user }) => {
      auth.syncUser(user);
      return user.role === 'admin' ? true : router.createUrlTree(['/account/profile']);
    }),
    catchError(() => of(router.createUrlTree(['/login'])))
  );
};
