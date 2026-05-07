import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // <-- Yeh line missing thi
import { Order } from '../../services/order';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule], // Ab compiler ko pata hai CommonModule kya hai
  templateUrl: './my-orders.html',
  styleUrl: './my-orders.css',
})
export class MyOrders implements OnInit {
  order: any[] = []; // Initializing with empty array
  selectedItem: any = null;

  constructor(private orderSer: Order) { }

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders() {
    this.orderSer.getMyOrders().subscribe((res: any) => {
      this.order = res;
      console.log(res);
    });
  }

  selectProduct(singleOrder: any, index: number) {
    this.selectedItem = singleOrder.items[index];
  }

  cancelOrder(orderId: string) {
    const confirmDelete = confirm("Are you sure you want to cancel this order? This action cannot be undone.");
    if (confirmDelete) {
      this.orderSer.cancelOrder(orderId).subscribe({
        next: () => {
          alert("Order cancelled successfully");
          this.loadOrders(); // List ko refresh karne ke liye
        },
        error: (err) => {
          alert("Error cancelling order");
        }
      });
    }
  }
}