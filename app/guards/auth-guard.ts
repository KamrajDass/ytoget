import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  // LocalStorage se check karein ke user logged in hai ya nahi
  const token = localStorage.getItem('token'); 

  if (token) {
    return true; 
  } else {
    router.navigate(['/login']);
    return false;
  }
};