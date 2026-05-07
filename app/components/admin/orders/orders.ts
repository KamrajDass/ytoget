import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Order } from '../../../services/order';

@Component({
  selector: 'app-orders',
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders {
  refreshData() {
    throw new Error('Method not implemented.');
  }

  constructor(private orderSer: Order) { }

  orders: any[] = [];

  ngOnInit() {
    this.orderSer.getAdminOrders().subscribe((res) => {
      console.log(res);
      this.orders = res
    })
  }

  // modal logic
  selectedOrder: any | null = null;

  openOrderDetails(order: any) {
    // Create a deep copy to prevent direct live editing without saving
    this.selectedOrder = JSON.parse(JSON.stringify(order));
    // Mobile layout adjust
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    this.selectedOrder = null;
    // Restore scrolling
    document.body.style.overflow = 'auto';
  }

  saveOrder(updatedOrder: any) {
    this.orderSer.updateOrderStatus(updatedOrder._id, updatedOrder.status).subscribe((res: any) => {
      console.log(res);
      this.closeModal();
    });

    this.orderSer.updatePaymentStatus(updatedOrder._id, updatedOrder.paymentStatus).subscribe((res: any) => {
      console.log(res);
    });
  }
}
