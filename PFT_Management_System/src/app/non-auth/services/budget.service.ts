import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private apiUrl = `${environment.apiBaseUrl}/budgets`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  create(budget: any): Observable<any> {
    return this.http.post(this.apiUrl, budget, { headers: this.getHeaders() });
  }

  getAll(month?: string): Observable<any> {
    let params = new HttpParams();
    if (month) {
      params = params.set('month', month);
    }
    return this.http.get(this.apiUrl, { headers: this.getHeaders(), params });
  }

  update(id: number, budget: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, budget, { headers: this.getHeaders() });
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}
