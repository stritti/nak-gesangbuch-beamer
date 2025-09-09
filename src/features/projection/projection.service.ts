/**
 * Projection Service - Verantwortlich für Fullscreen, WakeLock, Hotkeys
 */
export class ProjectionService {
  private wakeLock: WakeLockSentinel | null = null;
  
  /**
   * Aktiviert den Vollbildmodus für ein Element
   */
  async requestFullscreen(element: HTMLElement): Promise<boolean> {
    try {
      await element.requestFullscreen();
      return true;
    } catch (error) {
      console.error('Fehler beim Aktivieren des Vollbildmodus:', error);
      return false;
    }
  }
  
  /**
   * Beendet den Vollbildmodus
   */
  async exitFullscreen(): Promise<boolean> {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      return true;
    } catch (error) {
      console.error('Fehler beim Beenden des Vollbildmodus:', error);
      return false;
    }
  }
  
  /**
   * Aktiviert den Wake-Lock, um zu verhindern, dass der Bildschirm ausgeht
   */
  async requestWakeLock(): Promise<boolean> {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
        
        // Event-Listener für den Fall, dass der Wake-Lock verloren geht
        this.wakeLock.addEventListener('release', () => {
          console.log('Wake-Lock wurde freigegeben');
          this.wakeLock = null;
        });
        
        return true;
      } catch (error) {
        console.error('Fehler beim Aktivieren des Wake-Locks:', error);
        return false;
      }
    }
    return false;
  }
  
  /**
   * Gibt den Wake-Lock frei
   */
  async releaseWakeLock(): Promise<void> {
    if (this.wakeLock) {
      await this.wakeLock.release();
      this.wakeLock = null;
    }
  }
  
  /**
   * Prüft, ob der Vollbildmodus aktiv ist
   */
  isFullscreen(): boolean {
    return !!document.fullscreenElement;
  }
  
  /**
   * Prüft, ob der Wake-Lock aktiv ist
   */
  isWakeLockActive(): boolean {
    return !!this.wakeLock;
  }
}

// Singleton-Instanz exportieren
export const projectionService = new ProjectionService();
