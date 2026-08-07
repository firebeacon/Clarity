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
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { authInterceptor } from './auth.interceptor';
import { environment } from '../environments/environment';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('removes token and navigates to /login on a 401 for a regular URL', () => {
    localStorage.setItem('token', 'user-token');
    const navigateSpy = vi.spyOn(router, 'navigate');

    http.get(`${environment.apiUrl}/conversations`).subscribe({ error: () => {} });
    httpMock
      .expectOne(`${environment.apiUrl}/conversations`)
      .flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(localStorage.getItem('token')).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('removes adminToken and navigates to /admin/login on a 401 for an admin URL', () => {
    localStorage.setItem('adminToken', 'admin-token');
    const navigateSpy = vi.spyOn(router, 'navigate');

    http.get(`${environment.apiUrl}/admin/users`).subscribe({ error: () => {} });
    httpMock
      .expectOne(`${environment.apiUrl}/admin/users`)
      .flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(localStorage.getItem('adminToken')).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/admin/login']);
  });

  it('re-throws non-401 errors without redirecting', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    let caughtError: any;

    http.get(`${environment.apiUrl}/conversations`).subscribe({ error: (e) => (caughtError = e) });
    httpMock
      .expectOne(`${environment.apiUrl}/conversations`)
      .flush('Server Error', { status: 500, statusText: 'Server Error' });

    expect(caughtError.status).toBe(500);
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
