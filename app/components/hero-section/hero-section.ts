import { Component, effect } from '@angular/core';
import { Data } from '../../services/data';


@Component({
  selector: 'app-hero-section',
  imports: [],
  templateUrl: './hero-section.html',
  styleUrl: './hero-section.css',
})
export class HeroSection {
  carsouselData: any = {};
  status : any[] = [];
  constructor(public dataSer: Data) {
    effect(() => {
     this.carsouselData = this.dataSer.homeData()?.hero || [];
     this.status = this.dataSer.homeData()?.stats || [];
    });;
  }


} 
