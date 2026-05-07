import { Component, computed, OnInit, signal } from '@angular/core';
import { Footer } from "../footer/footer";
import { Data } from '../../services/data';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Cartservice } from '../../services/cartservice';
import { Product } from '../../services/product';
import { Order } from '../../services/order';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [Footer, CommonModule, ReactiveFormsModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart implements OnInit {
  cartItems = signal<any[]>([]);
  cartResponse: any = null;
  deliveryFee = 15;
  isOpen = signal(false);
  checkoutForm!: FormGroup;
  isVisible = false;
  constructor(private data: Data, private fb: FormBuilder,private cartSer : Cartservice,private proSer : Product, private orderSer : Order) { }

  ngOnInit() {
    this.loadCart();

    this.checkoutForm = this.fb.group({
      address: ['', Validators.required],
      city: ['', Validators.required],
      payment: ['card', Validators.required]
    });
  }

  loadCart() {
    this.cartSer.getCart().subscribe((res: any) => {
      this.cartResponse = res;
      const items = res.items;

      // Sab products ki details fetch karke signal update karein
      items.forEach((item: any) => {
        this.proSer.getProductById(item.productId).subscribe((prodRes: any) => {
          item.imageUrl = prodRes.product.imageUrl;
          item.size = prodRes.product.sizes[0];
          item.color = prodRes.product.colors[0];

          // Pure array ko spread karke set karein taaki UI refresh ho
          this.cartItems.set([...items]);
        });
      });
    });
  }

  // Optimized Computed: Ye sirf tabhi chalega jab cartItems() change hoga
  totalAmount = computed(() => {
    return this.cartItems().reduce((acc, item) => acc + (item.price * item.quantity), 0);
  });

  updateQuantity(productId: string, delta: number, currentQty: number) {
    const newQty = Math.max(1, currentQty + delta);
    this.cartSer.updateQuantity(productId, newQty).subscribe(() => {
      this.loadCart();
    });
  }

  removeItem(productId: string) {
    // Optimistic UI update: Pehle UI se remove karein phir API call
    this.cartItems.update(prev => prev.filter(item => item.productId !== productId));

    this.cartSer.removeItem(productId).subscribe({
      next: () => {
        this.loadCart(),
          this.isVisible = true;
        setTimeout(() => {
          this.isVisible = false;
        }, 1500);
      }
    });
  }

  // Modal Logic in your Cart Class
  openModal() {
    this.isOpen.set(true);
    document.body.style.overflow = 'hidden'; // Screen scroll block karega
  }

  closeModal() {
    this.isOpen.set(false);
    document.body.style.overflow = 'auto'; // Scroll wapas on karega
  }

  // Baki sara code same rahega, confirmOrder ko thoda sa modify kiya hai
  confirmOrder() {
    if (this.checkoutForm.valid) {
      const finalData = {
        ...this.checkoutForm.value,
        items: this.cartItems(),
        total: this.totalAmount() + this.deliveryFee
      };
      this.orderSer.orders(finalData).subscribe((res) => {
        this.checkoutForm.reset()
        this.closeModal();
        window.location.href = '/my-Orders';
      })

    }
  }



  closeToast() {
    this.isVisible = false;
  }
}

