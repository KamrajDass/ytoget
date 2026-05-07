import { Component, signal } from '@angular/core';
import { CommonModule, UpperCasePipe, SlicePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms'; // Zaruri imports
import { Data } from '../../services/data';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, UpperCasePipe, SlicePipe, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  profileForm!: FormGroup;
  isExpanded = signal(false);
  idCopied = signal(false);

  userData = {
    "id": "69cb73441e0de20208c4819e",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "admin",
    "isEmailVerified": false
  };

  constructor(private fb: FormBuilder, private authSer: Auth) { }

  ngOnInit(): void {
    // Form Initialization with Validations
    this.profileForm = this.fb.group({
      name: [this.userData.name, [Validators.required, Validators.minLength(3)]],
      email: [this.userData.email, [Validators.required, Validators.email]]
    });
  }

  updateProfile() {
    if (this.profileForm.valid) {
      console.log("Updated Data:", this.profileForm.value);
      this.authSer.updateProfile(this.profileForm.value).subscribe({
        next: (response) => {
          console.log("Profile updated:", response);
        }
      });
    } else {
      this.profileForm.markAllAsTouched();
    }
  }

  copyId(id: string) {
    navigator.clipboard.writeText(id).then(() => {
      this.idCopied.set(true);
      // Reset icon after 2 seconds
      setTimeout(() => this.idCopied.set(false), 2000);
    });
  }
}