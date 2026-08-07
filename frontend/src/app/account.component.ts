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

import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavHeaderComponent } from './nav-header.component';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [NavHeaderComponent, FormsModule],
  template: `
    <div class="fixed inset-0 bg-gray-900 flex flex-col">
      <app-nav-header [title]="'Account'" />

      <div class="flex-1 overflow-y-auto flex justify-center pt-12 px-4">
        <div class="w-full max-w-md flex flex-col gap-6">
          <!-- Profile -->
          <div class="bg-gray-800 border border-gray-700 rounded-lg p-6 flex flex-col gap-4">
            <h2 class="text-sm font-semibold text-gray-300 uppercase tracking-wider">Profile</h2>

            <div class="flex flex-col gap-1">
              <span class="text-[11px] text-gray-500 uppercase tracking-wider">Username</span>
              @if (editingUsername()) {
                <div class="flex gap-2 items-center">
                  <input
                    [(ngModel)]="usernameInput"
                    (keydown.enter)="saveUsername()"
                    (keydown.escape)="cancelUsername()"
                    class="flex-1 bg-gray-900 border border-purple-600 rounded px-2 py-1 text-sm text-gray-200 focus:outline-none"
                  />
                  <button
                    (click)="saveUsername()"
                    [disabled]="savingUsername()"
                    class="px-3 py-1 rounded text-xs bg-purple-700/60 hover:bg-purple-700 text-purple-100 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-default"
                  >
                    {{ savingUsername() ? 'Saving…' : 'Save' }}
                  </button>
                  <button
                    (click)="cancelUsername()"
                    class="px-3 py-1 rounded text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              } @else {
                <div class="flex items-center gap-3">
                  <span class="text-sm text-gray-200">{{ username() }}</span>
                  <button
                    (click)="startEditUsername()"
                    class="text-[11px] text-gray-600 hover:text-purple-400 cursor-pointer transition-colors"
                  >
                    Edit
                  </button>
                </div>
              }
            </div>

            <div class="flex flex-col gap-1">
              <span class="text-[11px] text-gray-500 uppercase tracking-wider">Email</span>
              <span class="text-sm text-gray-200">{{ email() }}</span>
            </div>

            <div class="flex flex-col gap-1">
              <span class="text-[11px] text-gray-500 uppercase tracking-wider">Member since</span>
              <span class="text-sm text-gray-200">{{ memberSince() }}</span>
            </div>

            <div class="flex flex-col gap-1">
              <span class="text-[11px] text-gray-500 uppercase tracking-wider">Account type</span>
              <span class="text-sm capitalize" [class]="tierClass()">{{ accountType() }}</span>
            </div>
          </div>

          <!-- Change password -->
          <div class="bg-gray-800 border border-gray-700 rounded-lg p-6 flex flex-col gap-4">
            <h2 class="text-sm font-semibold text-gray-300 uppercase tracking-wider">
              Change Password
            </h2>

            <div class="flex flex-col gap-1">
              <label class="text-[11px] text-gray-500 uppercase tracking-wider">New password</label>
              <input
                [(ngModel)]="newPassword"
                type="password"
                placeholder="Enter new password"
                class="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-600"
              />
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-[11px] text-gray-500 uppercase tracking-wider"
                >Confirm password</label
              >
              <input
                [(ngModel)]="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                class="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-600"
              />
            </div>

            @if (passwordError()) {
              <p class="text-xs text-red-400">{{ passwordError() }}</p>
            }
            @if (passwordSuccess()) {
              <p class="text-xs text-green-400">Password updated.</p>
            }

            <button
              (click)="changePassword()"
              [disabled]="saving()"
              class="self-start px-4 py-2 rounded text-sm bg-purple-700/60 hover:bg-purple-700 text-purple-100 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-default"
            >
              {{ saving() ? 'Saving…' : 'Update Password' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AccountComponent implements OnInit {
  private authService = inject(AuthService);

  email = signal('');
  username = signal('');
  accountType = signal('free');
  memberSince = signal('');

  editingUsername = signal(false);
  savingUsername = signal(false);
  usernameInput = '';

  newPassword = '';
  confirmPassword = '';
  saving = signal(false);
  passwordError = signal('');
  passwordSuccess = signal(false);

  ngOnInit() {
    this.authService.getMe().subscribe({
      next: (user: any) => {
        this.email.set(user.email);
        this.username.set(user.username || user.email);
        this.accountType.set(user.account_type || 'free');
        this.memberSince.set(
          user.created_at ? new Date(user.created_at).toLocaleDateString('en-CA') : '',
        );
      },
      error: () => {},
    });
  }

  startEditUsername() {
    this.usernameInput = this.username();
    this.editingUsername.set(true);
  }

  saveUsername() {
    const u = this.usernameInput.trim();
    if (!u) {
      this.cancelUsername();
      return;
    }
    this.savingUsername.set(true);
    this.authService.updateUsername(u).subscribe({
      next: () => {
        this.username.set(u);
        this.savingUsername.set(false);
        this.editingUsername.set(false);
      },
      error: () => this.savingUsername.set(false),
    });
  }

  cancelUsername() {
    this.editingUsername.set(false);
    this.usernameInput = '';
  }

  tierClass(): string {
    const map: Record<string, string> = {
      free: 'text-gray-400',
      bronze: 'text-amber-600',
      silver: 'text-gray-300',
      gold: 'text-yellow-400',
    };
    return map[this.accountType()] ?? 'text-gray-400';
  }

  changePassword() {
    this.passwordError.set('');
    this.passwordSuccess.set(false);
    const pw = this.newPassword.trim();
    if (!pw) {
      this.passwordError.set('Password cannot be empty.');
      return;
    }
    if (pw.length < 9) {
      this.passwordError.set('Password must be at least 9 characters.');
      return;
    }
    if (!/[A-Z]/.test(pw)) {
      this.passwordError.set('Password must contain at least one uppercase letter.');
      return;
    }
    if (!/[0-9]/.test(pw)) {
      this.passwordError.set('Password must contain at least one number.');
      return;
    }
    if (!/[^A-Za-z0-9]/.test(pw)) {
      this.passwordError.set('Password must contain at least one special character.');
      return;
    }
    if (pw !== this.confirmPassword) {
      this.passwordError.set('Passwords do not match.');
      return;
    }
    this.saving.set(true);
    this.authService.updatePassword(pw).subscribe({
      next: () => {
        this.saving.set(false);
        this.passwordSuccess.set(true);
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: () => {
        this.saving.set(false);
        this.passwordError.set('Failed to update password. Please try again.');
      },
    });
  }
}
