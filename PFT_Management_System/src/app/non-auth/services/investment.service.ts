import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InvestmentService {
  private apiUrl = `${environment.apiBaseUrl}/investments`;

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

  create(payload: any): Observable<any> {
    return this.http.post(this.apiUrl, payload, { headers: this.getHeaders() });
  }

  update(id: number, payload: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, payload, { headers: this.getHeaders() });
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  recordContribution(id: number, payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/contribute`, payload, { headers: this.getHeaders() });
  }
}
