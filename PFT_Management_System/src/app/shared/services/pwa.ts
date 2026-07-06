import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private deferredPrompt: any = null;
  // A signal to track if the install button should be visible
  showInstallButton = signal<boolean>(false);

  constructor() {
    this.initInstallPromptListener();
  }

  private initInstallPromptListener() {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      this.deferredPrompt = e;
      // Update UI signal to show the install button
      this.showInstallButton.set(true);
    });

    window.addEventListener('appinstalled', () => {
      // Clear the deferredPrompt
      this.deferredPrompt = null;
      // Hide the install button
      this.showInstallButton.set(false);
      console.log('PFT Portal app was successfully installed.');
    });
  }

  public installApp() {
    if (!this.deferredPrompt) {
      return;
    }
    // Show the install prompt
    this.deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    this.deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      this.deferredPrompt = null;
      this.showInstallButton.set(false);
    });
  }
}
