import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, switchMap, tap, throwError } from 'rxjs';

type AuthResponse = {
  access_token: string;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'employee';
  createdAt: string;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly TOKEN_KEY = 'absentia_token';
  private readonly API_URL = 'http://localhost:3000';

  readonly currentUser = signal<AuthUser | null>(null);

  constructor() {
    if (this.getToken()) {
      this.loadCurrentUser().subscribe({
        error: () => this.logout(),
      });
    }
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  login(email: string, password: string): Observable<void> {
    return this.authenticate('login', { email, password });
  }

  register(name: string, email: string, password: string): Observable<void> {
    return this.authenticate('register', { name, email, password });
  }

  loadCurrentUser(): Observable<AuthUser> {
    return this.http
      .get<AuthUser>(`${this.API_URL}/auth/me`)
      .pipe(tap((user) => this.currentUser.set(user)));
  }

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUser.set(null);
  }

  private authenticate(
    endpoint: 'login' | 'register',
    payload: Record<string, string>,
  ): Observable<void> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/auth/${endpoint}`, payload)
      .pipe(
        tap(({ access_token }) => this.setToken(access_token)),
        switchMap(() => this.loadCurrentUser()),
        map(() => void 0),
        catchError((error) => {
          this.logout();
          return throwError(() => error);
        }),
      );
  }
}
