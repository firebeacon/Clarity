// Copyright (C) 2026 Gregory Dott
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AdminAuthService } from './admin-auth.service';

@Component({
  standalone: true,
  selector: 'app-admin-login',
  template: `
    <div class="fixed inset-0 bg-gray-900 flex items-center justify-center">
      <div class="bg-gray-800 rounded-xl p-8 w-full max-w-sm shadow-lg">
        <div class="flex flex-col items-center mb-6">
          <h1 class="text-xl font-semibold text-gray-100">Admin Login</h1>
          <p class="text-xs text-gray-500 mt-1">Clarity</p>
        </div>
        <form (ngSubmit)="onSubmit()" class="flex flex-col gap-3">
          <input
            name="email"
            type="email"
            required
            [(ngModel)]="email"
            placeholder="Email"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
          <input
            name="password"
            type="password"
            required
            [(ngModel)]="password"
            placeholder="Password"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
          @if (error) {
            <p class="text-red-400 text-sm text-center">{{ error }}</p>
          }
          <button
            type="submit"
            class="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors cursor-pointer"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  `,
  imports: [FormsModule, CommonModule],
})
export class AdminLoginComponent {
  email = '';
  password = '';
  error = '';

  constructor(
    private auth: AdminAuthService,
    private router: Router,
  ) {
    if (this.auth.isLoggedIn()) this.router.navigate(['/admin/users']);
  }

  onSubmit() {
    this.error = '';
    this.auth.login(this.email, this.password).subscribe({
      next: (res: any) => {
        localStorage.setItem('adminToken', res.token);
        this.router.navigate(['/admin/users']);
      },
      error: (e) => (this.error = e?.error?.error || 'Login failed'),
    });
  }
}
