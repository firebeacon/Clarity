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

import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  userPhase = signal<number | undefined>(undefined);
  auditSubmitted$ = new Subject<void>();
  private phaseLoaded = false;

  loadPhase() {
    if (this.phaseLoaded) return;
    this.phaseLoaded = true;
    this.getPhase().subscribe({
      next: (res) => this.userPhase.set(res.phase ?? 1),
      error: () => {},
    });
  }

  setPhase(phase: number) {
    this.userPhase.set(phase);
  }

  logout() {
    this.phaseLoaded = false;
    this.userPhase.set(undefined);
    localStorage.removeItem('token');
  }

  getUserEmail(): string {
    const token = localStorage.getItem('token');
    if (!token) return '';
    try {
      return JSON.parse(atob(token.split('.')[1])).email || '';
    } catch {
      return '';
    }
  }

  getUserId(): number | null {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split('.')[1])).sub ?? null;
    } catch {
      return null;
    }
  }

  getMe(): Observable<any> {
    const id = this.getUserId();
    return this.http.get(`${this.base}/users/${id}`, { headers: this.getAuthHeaders() });
  }

  updatePassword(password: string): Observable<any> {
    const id = this.getUserId();
    return this.http.put(
      `${this.base}/users/${id}`,
      { password },
      { headers: this.getAuthHeaders() },
    );
  }

  updateUsername(username: string): Observable<any> {
    const id = this.getUserId();
    return this.http.put(
      `${this.base}/users/${id}`,
      { username },
      { headers: this.getAuthHeaders() },
    );
  }

  signup(email: string, password: string, username?: string, inviteToken?: string) {
    return this.http.post(`${this.base}/users/register`, {
      email,
      password,
      ...(username ? { username } : {}),
      inviteToken,
    });
  }

  login(email: string, password: string) {
    return this.http.post(`${this.base}/users/login`, { email, password });
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getAnalytics(): Observable<any> {
    return this.http.get(`${this.base}/conversations/analytics`, {
      headers: this.getAuthHeaders(),
    });
  }

  // Conversation methods
  getConversations(): Observable<any> {
    return this.http.get(`${this.base}/conversations`, {
      headers: this.getAuthHeaders(),
    });
  }

  createConversation(title?: string): Observable<any> {
    return this.http.post(
      `${this.base}/conversations`,
      { title },
      { headers: this.getAuthHeaders() },
    );
  }

  getConversation(id: number): Observable<any> {
    return this.http.get(`${this.base}/conversations/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  sendMessage(
    conversationId: number,
    content: string,
    role?: string,
    extra?: Record<string, any>,
  ): Observable<any> {
    return this.http.post(
      `${this.base}/conversations/${conversationId}/messages`,
      { content, ...(role ? { role } : {}), ...(extra ?? {}) },
      { headers: this.getAuthHeaders() },
    );
  }

  injectContextBatch(
    conversationId: number,
    blocks: { role: string; content: string; seed_created_at?: string }[],
  ): Observable<any> {
    return this.http.post(
      `${this.base}/conversations/${conversationId}/inject-context`,
      { blocks },
      { headers: this.getAuthHeaders() },
    );
  }

  deleteConversation(id: number): Observable<any> {
    return this.http.delete(`${this.base}/conversations/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  updateConversation(id: number, title: string): Observable<any> {
    return this.http.put(
      `${this.base}/conversations/${id}`,
      { title },
      { headers: this.getAuthHeaders() },
    );
  }

  generateSeed(
    conversationId: number,
    body?: { intentResolved?: boolean; resolutionReason?: string },
  ): Observable<any> {
    return this.http.post(`${this.base}/conversations/${conversationId}/seed`, body ?? {}, {
      headers: this.getAuthHeaders(),
    });
  }

  getConstraints(): Observable<any> {
    return this.http.get(`${this.base}/users/constraints/me`, {
      headers: this.getAuthHeaders(),
    });
  }

  updateConstraints(constraints: string): Observable<any> {
    return this.http.put(
      `${this.base}/users/constraints/me`,
      { constraints },
      { headers: this.getAuthHeaders() },
    );
  }

  getGoals(): Observable<any> {
    return this.http.get(`${this.base}/goals/me`, { headers: this.getAuthHeaders() });
  }

  addGoal(content: string): Observable<any> {
    return this.http.post(`${this.base}/goals/me`, { content }, { headers: this.getAuthHeaders() });
  }

  updateGoal(id: number, content: string): Observable<any> {
    return this.http.put(
      `${this.base}/goals/${id}`,
      { content },
      { headers: this.getAuthHeaders() },
    );
  }

  deleteGoal(id: number): Observable<any> {
    return this.http.delete(`${this.base}/goals/${id}`, { headers: this.getAuthHeaders() });
  }

  reorderGoals(updates: { id: number; ordinal: number }[]): Observable<any> {
    return this.http.put(
      `${this.base}/goals/reorder`,
      { updates },
      { headers: this.getAuthHeaders() },
    );
  }

  addGoalComment(goalId: number, content: string): Observable<any> {
    return this.http.post(
      `${this.base}/goals/${goalId}/comments`,
      { content },
      { headers: this.getAuthHeaders() },
    );
  }

  getDefaultConstraints(): Observable<any> {
    return this.http.get(`${this.base}/config/default-constraints`, {
      headers: this.getAuthHeaders(),
    });
  }

  getPhase(): Observable<any> {
    return this.http.get(`${this.base}/users/phase/me`, { headers: this.getAuthHeaders() });
  }

  updatePhase(phase: number): Observable<any> {
    return this.http.put(
      `${this.base}/users/phase/me`,
      { phase },
      { headers: this.getAuthHeaders() },
    );
  }

  archiveConversation(id: number): Observable<any> {
    return this.http.post(
      `${this.base}/conversations/${id}/archive`,
      {},
      { headers: this.getAuthHeaders() },
    );
  }

  getAuditDue(force = false): Observable<any> {
    const url = force ? `${this.base}/audit/due?force=true` : `${this.base}/audit/due`;
    return this.http.get(url, { headers: this.getAuthHeaders() });
  }

  submitAudit(answers: any[]): Observable<any> {
    return this.http.post(
      `${this.base}/audit/submit`,
      { answers },
      { headers: this.getAuthHeaders() },
    );
  }

  getLatestAudit(): Observable<any> {
    return this.http.get(`${this.base}/audit/latest`, { headers: this.getAuthHeaders() });
  }

  // Seed bank
  getSeeds(): Observable<any> {
    return this.http.get(`${this.base}/seeds`, { headers: this.getAuthHeaders() });
  }

  updateSeed(
    id: number,
    changes: { title?: string; content?: string; packet_id?: number | null },
  ): Observable<any> {
    return this.http.put(`${this.base}/seeds/${id}`, changes, { headers: this.getAuthHeaders() });
  }

  deleteSeed(id: number): Observable<any> {
    return this.http.delete(`${this.base}/seeds/${id}`, { headers: this.getAuthHeaders() });
  }

  compressSeed(id: number): Observable<any> {
    return this.http.post(
      `${this.base}/seeds/${id}/compress`,
      {},
      { headers: this.getAuthHeaders() },
    );
  }

  consolidateSeeds(seedIds?: number[]): Observable<any> {
    return this.http.post(`${this.base}/seeds/consolidate`, seedIds?.length ? { seedIds } : {}, {
      headers: this.getAuthHeaders(),
    });
  }

  // Seed packets
  getPackets(): Observable<any> {
    return this.http.get(`${this.base}/seeds/packets`, { headers: this.getAuthHeaders() });
  }

  createPacket(name: string): Observable<any> {
    return this.http.post(
      `${this.base}/seeds/packets`,
      { name },
      { headers: this.getAuthHeaders() },
    );
  }

  updatePacket(id: number, name: string): Observable<any> {
    return this.http.put(
      `${this.base}/seeds/packets/${id}`,
      { name },
      { headers: this.getAuthHeaders() },
    );
  }

  deletePacket(id: number): Observable<any> {
    return this.http.delete(`${this.base}/seeds/packets/${id}`, { headers: this.getAuthHeaders() });
  }

  getNotes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/notes/me`, { headers: this.getAuthHeaders() });
  }

  createNote(title: string, body: string): Observable<any> {
    return this.http.post(
      `${this.base}/notes/me`,
      { title, body },
      { headers: this.getAuthHeaders() },
    );
  }

  updateNote(id: number, title: string, body: string): Observable<any> {
    return this.http.put(
      `${this.base}/notes/${id}`,
      { title, body },
      { headers: this.getAuthHeaders() },
    );
  }

  deleteNote(id: number): Observable<any> {
    return this.http.delete(`${this.base}/notes/${id}`, { headers: this.getAuthHeaders() });
  }

  getPlannerWeekContext(): Observable<{ text: string | null }> {
    return this.http.get<{ text: string | null }>(`${this.base}/planner/tasks/week-context`, {
      headers: this.getAuthHeaders(),
    });
  }
}
