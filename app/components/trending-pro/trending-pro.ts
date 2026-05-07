import { Component, effect } from '@angular/core';
import { Data } from '../../services/data';
import { Card } from "../card/card";

@Component({
  selector: 'app-trending-pro',
  imports: [Card],
  templateUrl: './trending-pro.html',
  styleUrl: './trending-pro.css',
})
export class TrendingPro {

  products: any = {};
  status: any[] = [];

  constructor(public dataSer: Data) {
    effect(() => {
      this.products = this.dataSer.homeData()?.topSelling || [];
    });;
  }
}
