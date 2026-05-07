import { Component, Input } from '@angular/core';
import { RouterLink } from "@angular/router";
import { Cartservice } from '../../services/cartservice';

@Component({
  selector: 'app-card',
  imports: [RouterLink],
  templateUrl: './card.html',
  styleUrl: './card.css',
})
export class Card {
  @Input() product: any;
  showToast = false;
  constructor(private cartSer: Cartservice) {

  }

  addToCart(pro: any) {
    this.cartSer.addToCart(pro._id, pro.quantity).subscribe((res) => {
      console.log(res);
      // Toast show karein
      this.showToast = true;

      // 3 seconds baad automatically hide kar dein
      setTimeout(() => {
        this.showToast = false;
      }, 3000);
    })
  }

  closeToast() {
    this.showToast = false;
  }
}
