import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Auth } from '../../../services/auth';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {

  loginForm !: FormGroup
  errorMessage: string | null = null;

  constructor(private authSer: Auth, private router: Router) { }

  ngOnInit(): void {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required])
    });
  }

  onLogin() {
    this.errorMessage = null;

    if (this.loginForm.invalid) return; // Basic validation check

    this.authSer.login(this.loginForm.value).subscribe({
      next: (res) => {
        this.router.navigate(['/home']);
      },error: (err) => {
        this.errorMessage = err.error.message || 'Login failed. Please try again.';
      }
    });
  }

  // Component class ke andar:
  isPasswordVisible: boolean = false;

  togglePasswordVisibility() {
    this.isPasswordVisible = !this.isPasswordVisible;
  }
}
