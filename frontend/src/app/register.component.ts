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

import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  standalone: true,
  selector: 'app-register',
  template: `
    <div class="fixed inset-0 bg-gray-900 flex items-center justify-center">
      <div class="bg-gray-800 rounded-xl p-8 w-full max-w-sm shadow-lg">
        <div class="flex flex-col items-center mb-6">
          <img src="CapyBase.png" alt="CapyBase" class="w-20 h-20 mb-3" />
          <h1 class="text-xl font-semibold text-gray-100">Create Account</h1>
        </div>
        <form (ngSubmit)="onSubmit()" class="flex flex-col gap-3">
          <input
            id="email"
            name="email"
            type="email"
            required
            [(ngModel)]="email"
            placeholder="Email"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
          <input
            id="username"
            name="username"
            type="text"
            [(ngModel)]="username"
            placeholder="Username (optional)"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
          <input
            id="password"
            name="password"
            type="password"
            required
            [(ngModel)]="password"
            placeholder="Password"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            [(ngModel)]="confirmPassword"
            placeholder="Confirm password"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
          <input
            id="inviteToken"
            name="inviteToken"
            type="text"
            required
            [(ngModel)]="inviteToken"
            placeholder="Invite token"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
          @if (error()) {
            <p class="text-red-400 text-sm text-center">{{ error() }}</p>
          }
          <button
            type="submit"
            class="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors cursor-pointer"
          >
            Create account
          </button>
        </form>
        <p class="text-center text-sm text-gray-500 mt-4">
          Already have an account?
          <a routerLink="/login" class="text-blue-400 hover:text-blue-300 cursor-pointer"
            >Sign in</a
          >
        </p>
      </div>
    </div>
  `,
  imports: [FormsModule, CommonModule, RouterLink],
})
export class RegisterComponent {
  email = '';
  username = '';
  password = '';
  confirmPassword = '';
  inviteToken = '';
  error = signal('');

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/analytics']);
    }
  }

  onSubmit() {
    this.error.set('');
    if (this.password.length < 9) {
      this.error.set('Password must be at least 9 characters.');
      return;
    }
    if (!/[A-Z]/.test(this.password)) {
      this.error.set('Password must contain at least one uppercase letter.');
      return;
    }
    if (!/[0-9]/.test(this.password)) {
      this.error.set('Password must contain at least one number.');
      return;
    }
    if (!/[^A-Za-z0-9]/.test(this.password)) {
      this.error.set('Password must contain at least one special character.');
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.error.set('Passwords do not match.');
      return;
    }
    if (!this.inviteToken.trim()) {
      this.error.set('Invite token required.');
      return;
    }
    this.auth.signup(this.email, this.password, this.username, this.inviteToken.trim()).subscribe({
      next: (res: any) => {
        localStorage.setItem('token', res.token);
        this.router.navigate(['/analytics']);
      },
      error: (e) => this.error.set(e?.error?.error || 'Registration failed'),
    });
  }
}
