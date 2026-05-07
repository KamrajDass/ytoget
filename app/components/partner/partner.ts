import { Component, effect } from '@angular/core';
import { Data } from '../../services/data';

@Component({
  selector: 'app-partner',
  imports: [],
  templateUrl: './partner.html',
  styleUrl: './partner.css',
})
export class Partner {


  partners: any = {};
  status: any[] = [];
  constructor(public dataSer: Data) {
    effect(() => {
      this.partners = this.dataSer.homeData()?.brands || [];
    });;
  }

}
