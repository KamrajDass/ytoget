import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { Data } from '../../../services/data';
import { Catgr } from '../../../services/catgr';

@Component({
  selector: 'app-catgr-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule], // FormsModule add kiya inline editing ke liye
  templateUrl: './catgr-list.html',
  styleUrl: './catgr-list.css',
})
export class CatgrList implements OnInit {
  addForm!: FormGroup;
  categories: any[] = [];

  constructor(private fb: FormBuilder, private catgrSer: Catgr) { }

  ngOnInit(): void {
    // Add Category Form (Only for Top Section)
    this.addForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required]
    });

    this.loadCategories();
  }

  loadCategories() {
    this.catgrSer.getCategories().subscribe((res: any) => {
      this.categories = res;
      console.log(this.categories);
      
    });
  }

  onAdd() {
    if (this.addForm.valid) {
      this.catgrSer.addCategory(this.addForm.value).subscribe(() => {
        alert("Category Added!");
        this.addForm.reset();
        this.loadCategories(); 
      });
    }
  }


  onSave(category: any) {
    if (!category.name) return alert("Name is required");
    console.log("Updating Category:", category)
    this.catgrSer.updateCategory(category._id, category).subscribe({
      next: () => alert("Updated Successfully!"),
    });
  }

  onDelete(id: string) {
    if (confirm("Are you sure?")) {
      this.catgrSer.deleteCategory(id).subscribe(() => {
        alert("Deleted!");
        this.loadCategories(); 
      });
    }
  }
} 