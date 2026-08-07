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
import { PlannerService } from './planner.service';
import { environment } from '../environments/environment';

const BASE = `${environment.apiUrl}/planner`;

describe('PlannerService', () => {
  let service: PlannerService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'user-tok');
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PlannerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('getTasks sends GET to /planner/tasks with Authorization header', () => {
    service.getTasks().subscribe();
    const req = httpMock.expectOne(`${BASE}/tasks`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer user-tok');
  });

  it('createTask sends POST with the payload', () => {
    service.createTask({ title: 'Buy milk', day: '2026-08-10' }).subscribe();
    const req = httpMock.expectOne(`${BASE}/tasks`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ title: 'Buy milk', day: '2026-08-10' });
  });

  it('updateTask sends PUT to /planner/tasks/:id', () => {
    service.updateTask(9, { completed: true }).subscribe();
    const req = httpMock.expectOne(`${BASE}/tasks/9`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ completed: true });
  });

  it('deleteTask sends DELETE to /planner/tasks/:id', () => {
    service.deleteTask(4).subscribe();
    const req = httpMock.expectOne(`${BASE}/tasks/4`);
    expect(req.request.method).toBe('DELETE');
  });
});
