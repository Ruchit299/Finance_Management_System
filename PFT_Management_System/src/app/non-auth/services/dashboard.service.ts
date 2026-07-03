import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private apiUrl = 'http://localhost:8086/dashboard';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getSummary(timeframe: string = 'monthly', month?: string): Observable<any> {
    let url = `${this.apiUrl}/summary?timeframe=${timeframe}`;
    if (month) {
      url += `&month=${month}`;
    }
    return this.http.get(url, { headers: this.getHeaders() });
  }
}
