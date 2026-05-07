import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  // LocalStorage se user object uthayen
  const user = JSON.parse(localStorage.getItem("user") || '{}');

  // Check karein ke role 'admin' hai ya nahi
  if (user && user.role === 'admin') {
    return true; // Entry allowed
  } else {
    // Agar user admin nahi hai toh access mana hai
    alert("Warning: Sirf Admin yahan ja sakta hai!");
    router.navigate(['/home']);
    return false;
  }
};