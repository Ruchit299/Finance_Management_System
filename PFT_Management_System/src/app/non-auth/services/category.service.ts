import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = `${environment.apiBaseUrl}/categories`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getAll(type?: string): Observable<any> {
    const url = type ? `${this.apiUrl}/get?type=${type}` : `${this.apiUrl}/get`;
    return this.http.get(url, { headers: this.getHeaders() });
  }

  create(name: string, type?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, { name, type }, { headers: this.getHeaders() });
  }

  update(id: number, name: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/update/${id}`, { name }, { headers: this.getHeaders() });
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`, { headers: this.getHeaders() });
  }
}
