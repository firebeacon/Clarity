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
import { vi } from 'vitest';
import { AuthService } from './auth.service';
import { environment } from '../environments/environment';

function makeToken(payload: object): string {
  return `header.${btoa(JSON.stringify(payload))}.sig`;
}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('isLoggedIn', () => {
    it('returns false when no token', () => {
      expect(service.isLoggedIn()).toBe(false);
    });

    it('returns true when token is present', () => {
      localStorage.setItem('token', 'any');
      expect(service.isLoggedIn()).toBe(true);
    });
  });

  describe('getUserEmail', () => {
    it('returns empty string when no token', () => {
      expect(service.getUserEmail()).toBe('');
    });

    it('returns email decoded from token payload', () => {
      localStorage.setItem('token', makeToken({ sub: 1, email: 'user@example.com' }));
      expect(service.getUserEmail()).toBe('user@example.com');
    });

    it('returns empty string for a malformed token', () => {
      localStorage.setItem('token', 'not.valid');
      expect(service.getUserEmail()).toBe('');
    });
  });

  describe('getUserId', () => {
    it('returns null when no token', () => {
      expect(service.getUserId()).toBeNull();
    });

    it('returns sub decoded from token payload', () => {
      localStorage.setItem('token', makeToken({ sub: 42, email: 'user@example.com' }));
      expect(service.getUserId()).toBe(42);
    });

    it('returns null for a malformed token', () => {
      localStorage.setItem('token', 'not.valid');
      expect(service.getUserId()).toBeNull();
    });
  });

  describe('logout', () => {
    it('removes the token from localStorage', () => {
      localStorage.setItem('token', 'tok');
      service.logout();
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('resets userPhase to undefined', () => {
      service.userPhase.set(3);
      service.logout();
      expect(service.userPhase()).toBeUndefined();
    });

    it('allows loadPhase to fire again after logout', () => {
      // phaseLoaded guard is reset so a subsequent login re-fetches phase
      (service as any).phaseLoaded = true;
      service.logout();
      expect((service as any).phaseLoaded).toBe(false);
    });
  });

  describe('setPhase', () => {
    it('updates the userPhase signal', () => {
      service.setPhase(2);
      expect(service.userPhase()).toBe(2);
    });
  });

  describe('loadPhase', () => {
    it('fetches phase and updates userPhase signal', () => {
      localStorage.setItem('token', makeToken({ sub: 1 }));
      service.loadPhase();
      httpMock.expectOne(`${environment.apiUrl}/users/phase/me`).flush({ phase: 3 });
      expect(service.userPhase()).toBe(3);
    });

    it('defaults to phase 1 when response has no phase', () => {
      localStorage.setItem('token', makeToken({ sub: 1 }));
      service.loadPhase();
      httpMock.expectOne(`${environment.apiUrl}/users/phase/me`).flush({});
      expect(service.userPhase()).toBe(1);
    });

    it('does not make a second request if already loaded', () => {
      localStorage.setItem('token', makeToken({ sub: 1 }));
      service.loadPhase();
      httpMock.expectOne(`${environment.apiUrl}/users/phase/me`).flush({ phase: 1 });
      service.loadPhase();
      httpMock.expectNone(`${environment.apiUrl}/users/phase/me`);
    });

    it('silently swallows errors and leaves userPhase unchanged', () => {
      localStorage.setItem('token', makeToken({ sub: 1 }));
      service.loadPhase();
      httpMock
        .expectOne(`${environment.apiUrl}/users/phase/me`)
        .flush('error', { status: 500, statusText: 'Server Error' });
      expect(service.userPhase()).toBeUndefined();
    });
  });

  describe('HTTP methods', () => {
    beforeEach(() => {
      localStorage.setItem('token', makeToken({ sub: 7 }));
    });

    it('login posts to /users/login', () => {
      service.login('a@b.com', 'pass').subscribe();
      httpMock.expectOne(`${environment.apiUrl}/users/login`);
    });

    it('getConstraints sends Authorization header', () => {
      service.getConstraints().subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/users/constraints/me`);
      expect(req.request.headers.get('Authorization')).toContain('Bearer ');
    });

    it('getConversations hits the correct URL', () => {
      service.getConversations().subscribe();
      httpMock.expectOne(`${environment.apiUrl}/conversations`);
    });

    it('deleteConversation sends DELETE to the correct URL', () => {
      service.deleteConversation(5).subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/conversations/5`);
      expect(req.request.method).toBe('DELETE');
    });

    it('signup includes username in body when provided', () => {
      service.signup('a@b.com', 'pass', 'alice', 'tok').subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/users/register`);
      expect(req.request.body.username).toBe('alice');
    });

    it('signup omits username from body when not provided', () => {
      service.signup('a@b.com', 'pass', undefined, 'tok').subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/users/register`);
      expect(req.request.body.username).toBeUndefined();
    });

    it('getAuditDue requests the base URL by default', () => {
      service.getAuditDue().subscribe();
      httpMock.expectOne(`${environment.apiUrl}/audit/due`);
    });

    it('getAuditDue appends ?force=true when force is true', () => {
      service.getAuditDue(true).subscribe();
      httpMock.expectOne(`${environment.apiUrl}/audit/due?force=true`);
    });
  });
});
