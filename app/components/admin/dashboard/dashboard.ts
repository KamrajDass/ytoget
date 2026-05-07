import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { Data } from '../../../services/data';
import { Orders } from "../orders/orders";
import { UserAccounts } from "../user-accounts/user-accounts";
import { CatgrList } from "../catgr-list/catgr-list";
import { AddPro } from "../add-pro/add-pro";
import { Products } from "../products/products";
import { Order } from '../../../services/order';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, Orders, UserAccounts, CatgrList, AddPro, Products],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {

  constructor(public data: Data, private orderSer : Order) { }

  selectedTab: string = 'overview';
  orders: any[] = [];
  dashboardData: any = { totals: { revenue: 0, orders: 0, users: 0, products: 0 } };
  selectTab(tabName: string) {
    this.selectedTab = tabName;
  }

  ngOnInit() {
    this.orderSer.getAdminOrders().subscribe((res) => {
      console.log(res);
      this.orders = res
    })

    this.data.getDashboardData().subscribe((res) => {
      this.dashboardData = res;
      console.log(this.dashboardData);

    })
  }

  isModalOpen = false;
  selectedOrder: any | null = null;

  openOrderDetails(order: any) {
    this.selectedOrder = order;
    this.isModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedOrder = null;
    document.body.style.overflow = 'auto';
  }
}