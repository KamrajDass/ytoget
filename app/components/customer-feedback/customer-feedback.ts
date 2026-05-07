import { Component, effect, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Data } from '../../services/data';

@Component({
  selector: 'app-customer-feedback',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-feedback.html',
  styleUrls: ['./customer-feedback.css'],
})
export class CustomerFeedback {

  slides: any[] = [];

  constructor(public dataSer: Data) {
    effect(() => {
      this.slides = this.dataSer.homeData()?.happyCustomers || [];
    });;
  }
  
  currentIndex = 0;
  visibleSlides = 3;

  private get maxIndex() {
    return Math.max(0, this.slides.length - this.visibleSlides);
  }

  next() {
    if (this.currentIndex >= this.maxIndex) {
      this.currentIndex = 0;
    } else {
      this.currentIndex++;
    }
  }

  prev() {
    if (this.currentIndex <= 0) {
      this.currentIndex = this.maxIndex;
    } else {
      this.currentIndex--;
    }
  }
}