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

import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.base}/admin/login`, { email, password });
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('adminToken');
  }

  getToken(): string {
    return localStorage.getItem('adminToken') || '';
  }

  private headers(): HttpHeaders {
    return new HttpHeaders().set('Authorization', `Bearer ${this.getToken()}`);
  }

  getUsers(): Observable<any> {
    return this.http.get(`${this.base}/admin/users`, { headers: this.headers() });
  }

  updateUser(
    id: number,
    changes: { email?: string; phase?: number; account_type?: string; messages_remaining?: number },
  ): Observable<any> {
    return this.http.put(`${this.base}/admin/users/${id}`, changes, { headers: this.headers() });
  }

  getTiers(): Observable<any> {
    return this.http.get(`${this.base}/admin/tiers`, { headers: this.headers() });
  }

  updateTier(type: string, daily_limit: number): Observable<any> {
    return this.http.put(
      `${this.base}/admin/tiers/${type}`,
      { daily_limit },
      { headers: this.headers() },
    );
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.base}/admin/users/${id}`, { headers: this.headers() });
  }

  resetUserData(id: number): Observable<any> {
    return this.http.post(`${this.base}/admin/users/${id}/reset`, {}, { headers: this.headers() });
  }

  getAuditSets(): Observable<any> {
    return this.http.get(`${this.base}/admin/audit-sets`, { headers: this.headers() });
  }

  createAuditSet(name: string): Observable<any> {
    return this.http.post(`${this.base}/admin/audit-sets`, { name }, { headers: this.headers() });
  }

  deleteAuditSet(id: number): Observable<any> {
    return this.http.delete(`${this.base}/admin/audit-sets/${id}`, { headers: this.headers() });
  }

  addAuditQuestion(setId: number, type: string, text: string, answerType: string): Observable<any> {
    return this.http.post(
      `${this.base}/admin/audit-sets/${setId}/questions`,
      { type, text, answerType },
      { headers: this.headers() },
    );
  }

  updateAuditQuestion(
    id: number,
    changes: { text?: string; answerType?: string },
  ): Observable<any> {
    return this.http.put(`${this.base}/admin/audit-questions/${id}`, changes, {
      headers: this.headers(),
    });
  }

  deleteAuditQuestion(id: number): Observable<any> {
    return this.http.delete(`${this.base}/admin/audit-questions/${id}`, {
      headers: this.headers(),
    });
  }

  getUserAuditConfig(userId: number): Observable<any> {
    return this.http.get(`${this.base}/admin/users/${userId}/audit-config`, {
      headers: this.headers(),
    });
  }

  setUserAuditConfig(userId: number, setId: number, periodDays: number): Observable<any> {
    return this.http.put(
      `${this.base}/admin/users/${userId}/audit-config`,
      { setId, periodDays },
      { headers: this.headers() },
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.put(
      `${this.base}/admin/password`,
      { currentPassword, newPassword },
      { headers: this.headers() },
    );
  }

  getInviteTokens(): Observable<any> {
    return this.http.get(`${this.base}/admin/invite-tokens`, { headers: this.headers() });
  }

  createInviteToken(): Observable<any> {
    return this.http.post(`${this.base}/admin/invite-tokens`, {}, { headers: this.headers() });
  }

  deleteInviteToken(id: number): Observable<any> {
    return this.http.delete(`${this.base}/admin/invite-tokens/${id}`, { headers: this.headers() });
  }
}
