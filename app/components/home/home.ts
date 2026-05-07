import { Component, OnInit, computed, effect } from '@angular/core';
import { Data } from '../../services/data';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HeroSection } from "../hero-section/hero-section";
import { Partner } from "../partner/partner";
import { LastestPro } from "../lastest-pro/lastest-pro";
import { TrendingPro } from "../trending-pro/trending-pro";
import { CustomerFeedback } from "../customer-feedback/customer-feedback";
import { Footer } from "../footer/footer";
import { PopularCategories } from "../popular-categories/popular-categories";
import { Product } from '../../services/product';


@Component({
  selector: 'app-home',
  standalone: true, // must be true for Angular 20 standalone component
  imports: [CommonModule, HeroSection,Partner,LastestPro,TrendingPro,PopularCategories,CustomerFeedback,Footer], // ✅ import directives you need
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {

  constructor(public proSer: Product, public route: ActivatedRoute) {

  }

  product: any = {};

  ngOnInit() {

    const slug = this.route.snapshot.paramMap.get('slug');


    this.proSer.getProductDetails('one-life-graphic-tshirt').subscribe((res: any) => {
      this.product = res.product;
    });

    // this.data.getProducts().subscribe((res: any) => {
    //   console.log(res.items);   // yahan products milte hain
    // });

   
   
 
  }

}



// HeroSection, Partner, TrendingPro, LastestPro, PopularCategories, CustomerFeedback, Footer