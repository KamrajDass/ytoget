import { Component, effect } from '@angular/core';
import { Data } from '../../services/data';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-popular-categories',
  imports: [RouterLink],
  templateUrl: './popular-categories.html',
  styleUrl: './popular-categories.css',
})
export class PopularCategories {

  categories: any = {};

  constructor(public dataSer: Data) {
    effect(() => {
      this.categories = this.dataSer.homeData()?.dressStyles || [];
    });;
  }
}
