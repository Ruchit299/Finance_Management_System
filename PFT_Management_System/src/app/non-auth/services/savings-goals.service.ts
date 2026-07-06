import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SavingsGoalsService {
  private apiUrl = `${environment.apiBaseUrl}/savings-goals`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getAll(): Observable<any> {
    return this.http.get(this.apiUrl, { headers: this.getHeaders() });
  }

  create(goal: any): Observable<any> {
    return this.http.post(this.apiUrl, goal, { headers: this.getHeaders() });
  }

  update(id: number, goal: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, goal, { headers: this.getHeaders() });
  }

  addSavings(id: number, amount: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/add-savings`, { amount }, { headers: this.getHeaders() });
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}
