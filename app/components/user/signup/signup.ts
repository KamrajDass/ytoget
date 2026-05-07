import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core'; // signal add kiya
import { Data } from '../../../services/data';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from "@angular/router";
import { Auth } from '../../../services/auth';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup implements OnInit {
  signupForm!: FormGroup;
  isPasswordVisible: boolean = false;

  // Naya state: Registration ke baad message dikhane ke liye
  isRegistered = signal(false);
  isSubmitting = signal(false);

  constructor(private authSer: Auth, private fb: FormBuilder,private router: Router) { }

  ngOnInit(): void {
    this.signupForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    return password && confirmPassword && password.value !== confirmPassword.value
      ? { passwordMismatch: true }
      : null;
  }

  onSubmit() {
    if (this.signupForm.valid) {
      this.isSubmitting.set(true);
      const { name, email, password } = this.signupForm.value;

      this.authSer.signup({ name, email, password }).subscribe({
        next: (res) => {
        this.router.navigate(['/home']);
        },error: (err) => {   
          this.isSubmitting.set(false);
          alert(err.error.message || 'Signup failed. Please try again.');
        } 
      });
    }
  }

  togglePasswordVisibility() {
    this.isPasswordVisible = !this.isPasswordVisible;
  }
}