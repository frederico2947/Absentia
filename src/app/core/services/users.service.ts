import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export type Employee = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
};

export type CreateEmployeePayload = {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'employee';
};

export type UpdateEmployeePayload = {
  name?: string;
  role?: 'admin' | 'employee';
};

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:3000';

  getAll(): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.API_URL}/users`);
  }

  create(payload: CreateEmployeePayload): Observable<Employee> {
    return this.http.post<Employee>(`${this.API_URL}/users`, payload);
  }

  update(id: string, payload: UpdateEmployeePayload): Observable<Employee> {
    return this.http.put<Employee>(`${this.API_URL}/users/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/users/${id}`);
  }
}
