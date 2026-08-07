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

import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { adminGuard } from './admin.guard';
import { AdminAuthService } from './admin-auth.service';

describe('adminGuard', () => {
  let router: Router;

  function setup(loggedIn: boolean) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AdminAuthService, useValue: { isLoggedIn: () => loggedIn } },
      ],
    });
    router = TestBed.inject(Router);
  }

  it('returns true when admin is logged in', () => {
    setup(true);
    const result = TestBed.runInInjectionContext(() => adminGuard());
    expect(result).toBe(true);
  });

  it('returns false and navigates to /admin/login when not logged in', () => {
    setup(false);
    const navigateSpy = vi.spyOn(router, 'navigate');
    const result = TestBed.runInInjectionContext(() => adminGuard());
    expect(result).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/admin/login']);
  });
});
