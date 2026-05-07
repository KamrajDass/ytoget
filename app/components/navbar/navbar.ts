import { Component, effect, ElementRef, HostListener, OnInit, signal } from '@angular/core';
import { Data } from '../../services/data';
import { CommonModule } from '@angular/common';
import { RouterLink } from "@angular/router";
import { SearchPipe } from "../../pipes/search-pipe";
import { InfoPro } from '../info-pro/info-pro';
import { Auth } from '../../services/auth'
import { Cartservice } from '../../services/cartservice';
import { Product } from '../../services/product';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, SearchPipe],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'],
})
export class Navbar implements OnInit {
  showTopOfferBar = true;
  dropdownOpen = false;
  offcanvasOpen = false;
  isSearchModalOpen = false;
  user: any
  links: string[] = [];
  searchResults: any[] = [];
  cartCount = signal<number>(0);
  adminloggedIn: boolean = false;
  allProducts: any
  isLoggedIn: boolean = false;

  constructor(public dataSer: Data, private eRef: ElementRef,private authSer : Auth, private cartSer: Cartservice,private proSer : Product) {
    effect(() => {
      this.links = this.dataSer.homeData()?.navLinks || [];
    });
  }

  ngOnInit() {
    this.user = this.authSer.getCurrentUser()
    this.isLoggedIn = this.authSer.isLoggedIn()
    this.adminloggedIn = this.authSer.isAdmin()
    console.log(this.isLoggedIn);
    console.log(this.adminloggedIn);
    if (this.isLoggedIn) {
      // Ye stream ko listen karega, jab bhi service update hogi, ye khud update hoga
      this.cartSer.cartCount$.subscribe((count) => {
        this.cartCount.set(count);
        console.log("Live Count Update:", count);
      });

      // Pehli baar data lane ke liye call karein
      this.cartSer.getCart().subscribe();
    }
    this.dataSer.fetchHome();

    // Search ke liye saare products le aayein (ye optimize kiya ja sakta hai)
    this.proSer.getProducts().subscribe((products: any) => {
      this.allProducts = products.items || {};
      console.log(this.allProducts);

    });
  }

  // --- UI Handlers ---
  toggleTopBar() { this.showTopOfferBar = false; }

  toggleDropdown() { this.dropdownOpen = !this.dropdownOpen; }

  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.dropdownOpen = false;
    }
  }

  toggleOffcanvas() {
    this.offcanvasOpen = !this.offcanvasOpen;
    this.manageScroll(this.offcanvasOpen);
  }

  toggleSearchModal(state: boolean) {
    this.isSearchModalOpen = state;
    if (!state) this.searchResults = []; // Reset results on close
    this.manageScroll(state);
  }

  private manageScroll(isLocked: boolean) {
    document.body.style.overflow = isLocked ? 'hidden' : 'auto';
  }

  // --- Search Logic ---
  onSearch(query: string) {
    console.log('searchQuery', query);
  }

  onLogout() {
    this.authSer.Logout()
    window.location.href = '/home'
  }

  getInitials(name: string): string {
    if (!name) return 'UN'; // Agar naam na ho toh 'UN' (Unknown) dikhaye
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
  infoPro() {
    this.isSearchModalOpen = false;
  }
}