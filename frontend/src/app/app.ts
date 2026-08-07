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
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { filter } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { AuditComponent } from './audit.component';

const DEFAULT_TITLE = 'Clarity';
const DEFAULT_FAVICON = 'capy_favicon.png';
const ADMIN_TITLE = 'Admin Clarification';
const ADMIN_FAVICON = 'dark_favicon.png';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AuditComponent],
  template: `
    <router-outlet />
    @if (showAudit()) {
      <app-audit [forced]="true" [prefetchedData]="auditData()" (onDone)="onAuditDone()" />
    }
  `,
})
export class App implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private titleService = inject(Title);

  showAudit = signal(false);
  auditData = signal<any>(null);

  private auditChecked = false;

  ngOnInit() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e: any) => {
      this.updateBranding(e.url);

      // Reset check state when landing on login so a fresh login re-triggers it
      if (e.url === '/login' || e.url === '/register') {
        this.auditChecked = false;
        return;
      }
      if (
        this.authService.isLoggedIn() &&
        !e.url.startsWith('/admin') &&
        !this.showAudit() &&
        !this.auditChecked
      ) {
        this.checkAudit();
      }
    });
  }

  private updateBranding(url: string) {
    const isAdmin = url.startsWith('/admin');
    this.titleService.setTitle(isAdmin ? ADMIN_TITLE : DEFAULT_TITLE);

    const faviconEl = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (faviconEl) {
      faviconEl.href = isAdmin ? ADMIN_FAVICON : DEFAULT_FAVICON;
    }
  }

  checkAudit() {
    this.auditChecked = true;
    this.authService.getAuditDue().subscribe({
      next: (data) => {
        if (data.due) {
          this.auditData.set(data);
          this.showAudit.set(true);
        }
      },
      error: () => {},
    });
  }

  onAuditDone() {
    this.showAudit.set(false);
    this.auditData.set(null);
    this.auditChecked = false;
  }
}
