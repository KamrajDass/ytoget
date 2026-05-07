import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Auth } from '../../../services/auth';

@Component({
  selector: 'app-user-accounts',
  imports: [FormsModule, CommonModule],
  templateUrl: './user-accounts.html',
  styleUrl: './user-accounts.css',
})
export class UserAccounts implements OnInit {
  users: any;

  constructor(private authSer: Auth) { }

  ngOnInit() {
    this.authSer.getAllUsers().subscribe((users: any) => {
      this.users = users;
      console.log(users);

    });

  }

  refreshUsers() {
    this.authSer.getAllUsers().subscribe((users: any) => {
      this.users = users;
    });
  }

  deleteUser(userId: any) {

    this.authSer.deleteUser(userId).subscribe({
      next: () => {
        alert("User deleted successfully");
        this.refreshUsers(); // List ko refresh karne ke liye
      }
    });
  }

  updateUserRole(user: any) {
    console.log(user);
    
    this.authSer.changeRoleUser(user._id, user.role).subscribe({
      next: () => {
        alert("User role updated successfully");
        this.refreshUsers(); // List ko refresh karne ke liye
      }
    });
  }



}