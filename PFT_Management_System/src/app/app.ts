import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmationDialogComponent } from './shared/components/confirmation-dialog/confirmation-dialog';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ConfirmationDialogComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  standalone: true,
})
export class App {
}
