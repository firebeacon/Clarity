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
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminAuthService } from './admin-auth.service';
import { environment } from '../environments/environment';

describe('AdminAuthService', () => {
  let service: AdminAuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminAuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('isLoggedIn', () => {
    it('returns false when no adminToken', () => {
      expect(service.isLoggedIn()).toBe(false);
    });

    it('returns true when adminToken is present', () => {
      localStorage.setItem('adminToken', 'tok');
      expect(service.isLoggedIn()).toBe(true);
    });
  });

  describe('getToken', () => {
    it('returns empty string when no adminToken', () => {
      expect(service.getToken()).toBe('');
    });

    it('returns the stored adminToken', () => {
      localStorage.setItem('adminToken', 'admin-tok');
      expect(service.getToken()).toBe('admin-tok');
    });
  });

  describe('HTTP methods', () => {
    beforeEach(() => {
      localStorage.setItem('adminToken', 'admin-tok');
    });

    it('login posts to /admin/login', () => {
      service.login('admin@example.com', 'pass').subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/admin/login`);
      expect(req.request.method).toBe('POST');
    });

    it('getUsers sends Authorization header', () => {
      service.getUsers().subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/admin/users`);
      expect(req.request.headers.get('Authorization')).toBe('Bearer admin-tok');
    });

    it('deleteUser sends DELETE to the correct URL', () => {
      service.deleteUser(3).subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/admin/users/3`);
      expect(req.request.method).toBe('DELETE');
    });
  });
});
