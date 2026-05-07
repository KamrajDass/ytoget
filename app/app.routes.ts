import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Cart } from './components/cart/cart';
import { InfoPro } from './components/info-pro/info-pro';
import { MyOrders } from './components/my-orders/my-orders';
import { Categories } from './components/categories/categories';
import { authGuard } from './guards/auth-guard';
import { adminGuard } from './guards/admin-guard';
import { Profile } from './components/profile/profile';
import { VideoDownload } from './components/video-download/video-download';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
    },

    {
        path: 'home',
        component: Home
    },
    {
        path: 'cart',
        component: Cart
    },
    {
        path: 'info/:product_id',
        component: InfoPro
    },
    {
        path: 'my-Orders',
        component: MyOrders
    },
    {
        path: 'category',
        component: Categories
    },
    {
        path: 'profile',
        component: Profile,
    },
    {
        path: 'video-download',
        component: VideoDownload
    },
    {
        path: 'admin',
        canActivate: [adminGuard],
        loadChildren: () =>
            import('./components/admin/admin.routes').then(c => c.routes)
    },
     {
        path: 'user',
        loadChildren: () =>
            import('./components/user/user.routes').then(c => c.routes)
    }
];