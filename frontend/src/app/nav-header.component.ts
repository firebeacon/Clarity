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

import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './auth.service';

const DEBUG_SHOW_USER_INFO = true;

const PHASE_NAMES: Record<number, string> = {
  0: 'Undefined',
  1: 'New User',
  2: 'Goals Set',
  3: 'Constraints Refined',
  4: 'Clarification in Progress',
  5: 'Clarified',
};

@Component({
  selector: 'app-nav-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <div class="flex items-center gap-4 px-6 py-3 bg-gray-800 border-b border-gray-700">
      <div class="flex flex-col leading-tight">
        <span class="text-gray-100 font-semibold">Clarity</span>
        @if (title) {
          <span class="text-gray-500 text-xs">{{ title }}</span>
        }
      </div>

      <!-- Nav links -->
      <div class="flex items-center gap-1 ml-4">
        <!-- Workspace -->
        <a
          routerLink="/workspace"
          routerLinkActive
          #wsLink="routerLinkActive"
          [class]="navCls(wsLink.isActive)"
          title="Workspace"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polygon
              points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
            />
          </svg>
        </a>

        <!-- Planner -->
        <a
          routerLink="/planner"
          routerLinkActive
          #plannerLink="routerLinkActive"
          [class]="navCls(plannerLink.isActive)"
          title="Planner"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </a>

        <!-- Analytics -->
        <a
          routerLink="/analytics"
          routerLinkActive
          #analyticsLink="routerLinkActive"
          [class]="navCls(analyticsLink.isActive)"
          title="Analytics"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        </a>

        <!-- Getting Started -->
        <a
          routerLink="/getting-started"
          routerLinkActive
          #gsLink="routerLinkActive"
          [class]="navCls(gsLink.isActive)"
          title="Getting Started"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3v2" />
            <line x1="12" y1="19" x2="12.01" y2="19" />
          </svg>
        </a>

      </div>

      <div class="ml-auto flex items-center gap-3">
        @if (showDebug) {
          <span
            class="text-xs text-gray-500 font-mono transition-opacity duration-1000"
            [class.opacity-0]="authService.userPhase() === undefined"
          >
            {{ email }} &nbsp;·&nbsp; Phase {{ authService.userPhase() }}: {{ phaseName }}
          </span>
        }
        <!-- Account -->
        <button
          (click)="goAccount()"
          class="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-700 text-gray-400 hover:text-white hover:bg-gray-600 transition-all cursor-pointer"
          title="Account"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>
        <!-- Logout -->
        <button
          (click)="logout()"
          class="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-700 text-gray-400 hover:text-red-400 hover:bg-gray-600 transition-all cursor-pointer"
          title="Logout"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  `,
})
export class NavHeaderComponent implements OnInit {
  @Input() title = '';

  authService = inject(AuthService);
  private router = inject(Router);

  showDebug = DEBUG_SHOW_USER_INFO;
  email = '';
  ready = signal(false);

  ngOnInit() {
    this.authService.loadPhase();
    this.email = this.authService.getUserEmail();
    setTimeout(() => this.ready.set(true));
  }

  get phaseName() {
    return PHASE_NAMES[this.authService.userPhase() ?? 0] ?? 'Unknown';
  }

  navCls(active: boolean): string {
    return `flex items-center justify-center w-9 h-9 rounded-lg cursor-pointer ${this.ready() ? 'transition-colors' : ''} ${
      active ? 'bg-gray-700 text-violet-400' : 'text-gray-500 hover:text-white hover:bg-gray-700'
    }`;
  }

  goAccount() {
    this.router.navigate(['/account']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
