import { Component, OnInit, OnDestroy } from '@angular/core';
import { ConfirmationService, DialogOptions } from '../../services/confirmation';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmation-dialog.html',
  styleUrls: ['./confirmation-dialog.scss']
})
export class ConfirmationDialogComponent implements OnInit, OnDestroy {
  public options: DialogOptions | null = null;
  public isVisible: boolean = false;
  private subscription: Subscription = new Subscription();

  constructor(private confirmationService: ConfirmationService) { }

  ngOnInit(): void {
    this.subscription = this.confirmationService.dialogState$.subscribe(options => {
      if (options) {
        this.options = options;
        this.isVisible = true;
      } else {
        this.isVisible = false;
        setTimeout(() => this.options = null, 150); // Wait for transition
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  close(result: boolean): void {
    this.isVisible = false;
    this.confirmationService.close(result);
  }
}
