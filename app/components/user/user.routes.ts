import { Routes } from '@angular/router';
import { Signup } from './signup/signup';
import { Login } from './login/login';
import { VerifyEmail } from './verify-email/verify-email';

export const routes: Routes = [
    {
        path: 'login',
        component: Login
    },
    {
        path: 'signUp',
        component: Signup
    }, {
        path: 'verify-email',
        component: VerifyEmail
    },
];