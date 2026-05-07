import { Component, effect } from '@angular/core';
import { Data } from '../../services/data';
import { Card } from '../card/card';


@Component({
  selector: 'app-lastest-pro',
  imports: [Card],
  templateUrl: './lastest-pro.html',
  styleUrl: './lastest-pro.css',
})
export class LastestPro {
  products: any = {};
  status: any[] = [];

  constructor(public dataSer: Data) {
    effect(() => {
      this.products = this.dataSer.homeData()?.newArrivals || [];
    });;
  }
}
