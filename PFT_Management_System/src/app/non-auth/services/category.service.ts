import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = 'http://localhost:8086/categories';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getAll(): Observable<any> {
    return this.http.get(`${this.apiUrl}/get`, { headers: this.getHeaders() });
  }

  create(name: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, { name }, { headers: this.getHeaders() });
  }

  update(id: number, name: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/update/${id}`, { name }, { headers: this.getHeaders() });
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`, { headers: this.getHeaders() });
  }
}
