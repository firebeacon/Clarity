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

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface PlannerTask {
  id: number;
  user_id: number;
  title: string;
  day: string | null;
  is_timed: boolean | number;
  start_time: string | null;
  end_time: string | null;
  sort_order: number;
  completed: boolean | number;
  comments: string | null;
  backlog: boolean | number;
  created_at: string;
  updated_at: string;
}

export type CreateTaskPayload = {
  title: string;
  day?: string | null;
  is_timed?: boolean;
  start_time?: string | null;
  end_time?: string | null;
  sort_order?: number;
};

export type UpdateTaskPayload = Partial<
  Omit<PlannerTask, 'id' | 'user_id' | 'created_at' | 'updated_at'>
>;

@Injectable({ providedIn: 'root' })
export class PlannerService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/planner`;

  private headers() {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getTasks(): Observable<PlannerTask[]> {
    return this.http.get<PlannerTask[]>(`${this.base}/tasks`, { headers: this.headers() });
  }

  createTask(payload: CreateTaskPayload): Observable<PlannerTask> {
    return this.http.post<PlannerTask>(`${this.base}/tasks`, payload, { headers: this.headers() });
  }

  updateTask(id: number, payload: UpdateTaskPayload): Observable<PlannerTask> {
    return this.http.put<PlannerTask>(`${this.base}/tasks/${id}`, payload, {
      headers: this.headers(),
    });
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/tasks/${id}`, { headers: this.headers() });
  }
}
