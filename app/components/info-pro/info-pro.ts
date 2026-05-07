import { Component, effect, OnInit } from '@angular/core';
import { Data } from '../../services/data';
import { ActivatedRoute } from '@angular/router';
import { Card } from "../card/card";
import { Footer } from "../footer/footer";
import { Cartservice } from '../../services/cartservice';
import { Product } from '../../services/product';

@Component({
  selector: 'app-info-pro',
  templateUrl: './info-pro.html',
  styleUrl: './info-pro.css',
  imports: [Card, Footer],
})
export class InfoPro implements OnInit {
  product: any = {};
  selectedSize: string | null = null;
  selectedColor: string = '';
  quantity: number = 1;
  products: any[] = [];
  // Dynamic Reviews Data Array
  reviews: any[] = [
    {
      id: 1,
      rating: 5,
      userName: 'Samantha D.',
      isVerified: true,
      comment: "I absolutely love this t-shirt! The material is so soft and the fit is perfect. Highly recommend!",
      date: '2023-08-14'
    },
    {
      id: 2,
      rating: 4,
      userName: 'Alex M.',
      isVerified: true,
      comment: "The design is unique and the fabric feels premium. It's a bit larger than expected but still looks great.",
      date: '2023-08-12'
    },
    {
      id: 3,
      rating: 5,
      userName: 'Ethan R.',
      isVerified: false,
      comment: "Best purchase I've made this year. The colors are exactly as shown in the pictures.",
      date: '2023-08-10'
    },
    {
      id: 4,
      rating: 5,
      userName: 'Olivia P.',
      isVerified: true,
      comment: "As a UI/UX designer, I appreciate the attention to detail. This t-shirt is a must-have for anyone who values comfort and style.",
      date: '2023-08-08'
    },
    {
      id: 5,
      rating: 5,
      userName: 'Ethan R.',
      isVerified: false,
      comment: "Best purchase I've made this year. The colors are exactly as shown in the pictures.",
      date: '2023-08-10'
    },
    {
      id: 6,
      rating: 5,
      userName: 'Olivia P.',
      isVerified: true,
      comment: "As a UI/UX designer, I appreciate the attention to detail. This t-shirt is a must-have for anyone who values comfort and style.",
      date: '2023-08-08'
    }
  ];

  constructor(public data: Data, public route: ActivatedRoute,private cartSer : Cartservice,private proSer : Product ) {
    effect(() => {
      this.products = this.data.homeData()?.newArrivals || [];
    });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('product_id');
      console.log('New Product ID:', id);

      if (id) {
        this.proSer.getProductById(String(id)).subscribe((res) => {
          this.product = res.product;
        });
      }
    });
  }

  // Logic Methods
  updateQuantity(val: number) {
    if (this.quantity + val >= 1) {
      this.quantity += val;
    }
  }


  addToCart(item: any) {
    this.cartSer.addToCart(item._id, item.quantity).subscribe((res) => {
      console.log(res);

    })
  }

  selectSize(size: string) { this.selectedSize = size; }
  selectColor(color: string) { this.selectedColor = color; }
}