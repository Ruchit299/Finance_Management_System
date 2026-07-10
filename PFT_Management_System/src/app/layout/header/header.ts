import { Component, OnInit, HostListener, Output, EventEmitter } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/services/auth.service';
import { PwaService } from '../../shared/services/pwa';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.html',
})
export class Header implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();

  user: any = null;
  isMenuCollapsed = true;
  isDropdownOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private pwaService: PwaService
  ) { }

  ngOnInit(): void {
    this.user = this.authService.getUser();
  }

  onToggleClick(): void {
    this.toggleSidebar.emit();
  }

  toggleMenu(): void {
    this.isMenuCollapsed = !this.isMenuCollapsed;
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  @HostListener('document:click')
  closeDropdowns(): void {
    this.isDropdownOpen = false;
  }

  logout(): void {
    this.isDropdownOpen = false;
    this.isMenuCollapsed = true;
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  get showInstallButton(): boolean {
    return this.pwaService.showInstallButton();
  }

  installApp(): void {
    this.pwaService.installApp();
  }
}
