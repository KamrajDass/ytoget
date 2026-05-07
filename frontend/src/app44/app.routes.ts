import { Routes } from '@angular/router';

import { adminGuard } from './auth/admin.guard';
import { authGuard } from './auth/auth.guard';
import { AccountPageComponent } from './pages/account-page.component';
import { CartPageComponent } from './pages/cart-page.component';
import { CheckoutPageComponent } from './pages/checkout-page.component';
import { DashboardAddProductPageComponent } from './pages/dashboard-add-product-page.component';
import { DashboardCategoriesPageComponent } from './pages/dashboard-categories-page.component';
import { DashboardOrdersPageComponent } from './pages/dashboard-orders-page.component';
import { DashboardOverviewPageComponent } from './pages/dashboard-overview-page.component';
import { DashboardPageComponent } from './pages/dashboard-page.component';
import { DashboardProductsPageComponent } from './pages/dashboard-products-page.component';
import { DashboardUsersPageComponent } from './pages/dashboard-users-page.component';
import { ForgotPasswordPageComponent } from './pages/forgot-password-page.component';
import { HomePageComponent } from './pages/home-page.component';
import { LoginPageComponent } from './pages/login-page.component';
import { ProductPageComponent } from './pages/product-page.component';
import { ProfileDetailsPageComponent } from './pages/profile-details-page.component';
import { ResetPasswordPageComponent } from './pages/reset-password-page.component';
import { ShopPageComponent } from './pages/shop-page.component';
import { SignupPageComponent } from './pages/signup-page.component';
import { UserOrdersPageComponent } from './pages/user-orders-page.component';
import { VerifyEmailPageComponent } from './pages/verify-email-page.component';

export const routes: Routes = [
	{ path: '', component: HomePageComponent },
	{ path: 'login', component: LoginPageComponent },
	{ path: 'signup', component: SignupPageComponent },
	{ path: 'forgot-password', component: ForgotPasswordPageComponent },
	{ path: 'reset-password', component: ResetPasswordPageComponent },
	{ path: 'verify-email', component: VerifyEmailPageComponent },
	{ path: 'shop', component: ShopPageComponent },
	{ path: 'product/:slug', component: ProductPageComponent },
	{ path: 'cart', component: CartPageComponent },
	{ path: 'checkout', component: CheckoutPageComponent, canActivate: [authGuard] },
	{
		path: 'account',
		component: AccountPageComponent,
		canActivate: [authGuard],
		children: [
			{ path: '', pathMatch: 'full', redirectTo: 'profile' },
			{ path: 'profile', component: ProfileDetailsPageComponent },
			{ path: 'orders', component: UserOrdersPageComponent }
		]
	},
	{
		path: 'dashboard',
		component: DashboardPageComponent,
		canActivate: [adminGuard],
		children: [
			{ path: '', pathMatch: 'full', redirectTo: 'overview' },
			{ path: 'overview', component: DashboardOverviewPageComponent },
			{ path: 'users', component: DashboardUsersPageComponent },
			{ path: 'categories', component: DashboardCategoriesPageComponent },
			{ path: 'orders', component: DashboardOrdersPageComponent },
			{ path: 'products', component: DashboardProductsPageComponent },
			{ path: 'products/new', component: DashboardAddProductPageComponent }
		]
	},
	{ path: '**', redirectTo: '' }
];
