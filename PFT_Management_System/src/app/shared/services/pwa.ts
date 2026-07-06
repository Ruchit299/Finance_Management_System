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
    // Check if the event was already captured in index.html before Angular bootstrapped
    const cachedPrompt = (window as any).deferredPrompt;
    if (cachedPrompt) {
      this.deferredPrompt = cachedPrompt;
      this.showInstallButton.set(true);
    }

    // Set up callback in case index.html captures the event during/after Angular initialization
    (window as any).onBeforeInstallPrompt = (e: any) => {
      this.deferredPrompt = e;
      this.showInstallButton.set(true);
    };

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton.set(true);
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      (window as any).deferredPrompt = null;
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
