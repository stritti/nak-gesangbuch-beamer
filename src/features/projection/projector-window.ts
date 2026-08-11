/** Zuständig für Lifecycle, Auffinden und Kommunikation des Projektorfensters. */

export type ProjectorWindowType = 'primary' | 'secondary' | 'fullscreen' | 'custom';

export const PROJECTOR_WINDOW_NAME = 'projector';
const DEFAULT_WINDOW_FEATURES = 'width=1024,height=768';

/** Baut die Projektor-URL aus BASE_URL und Query-Parameter (pure). */
export function buildProjectorUrl(options: { songId?: string; setlistId?: string }): string {
  let url = `${import.meta.env.BASE_URL}projector`;
  const params = new URLSearchParams();
  if (options.songId) params.append('songId', options.songId);
  if (options.setlistId) params.append('setlistId', options.setlistId);
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

/** Liefert die Fenster-Features für einen Bildschirm-Typ (pure). */
export function getWindowFeatures(
  type: ProjectorWindowType,
  size?: { width: number; height: number },
  custom?: string
): string {
  switch (type) {
    case 'primary':
      return DEFAULT_WINDOW_FEATURES;
    case 'secondary':
      return 'width=1024,height=768,left=1920,top=0';
    case 'fullscreen':
      return size
        ? `width=${size.width},height=${size.height},top=0,left=0`
        : DEFAULT_WINDOW_FEATURES;
    case 'custom':
      return custom || DEFAULT_WINDOW_FEATURES;
  }
}

class ProjectorWindowManager {
  private globalProjectorWindow: Window | null = null;

  openProjectorWindow(options: { songId?: string; setlistId?: string }): Window | null {
    const url = buildProjectorUrl(options);
    const windowFeatures = localStorage.getItem('projectorWindowFeatures') || DEFAULT_WINDOW_FEATURES;

    if (this.globalProjectorWindow && !this.globalProjectorWindow.closed) {
      try {
        void this.globalProjectorWindow.location.href;
        this.globalProjectorWindow.location.href = url;
        this.globalProjectorWindow.focus();
        return this.globalProjectorWindow;
      } catch {
        this.globalProjectorWindow = null;
      }
    }

    try {
      const existingWindow = window.open('', PROJECTOR_WINDOW_NAME);
      if (existingWindow && !existingWindow.closed) {
        void existingWindow.location.href;
        existingWindow.location.href = url;
        existingWindow.focus();
        this.globalProjectorWindow = existingWindow;
        localStorage.setItem('projectorWindowOpen', 'true');
        return this.globalProjectorWindow;
      }
    } catch {
      // Fenster nicht zugreifbar — neues Fenster öffnen
    }

    this.globalProjectorWindow = window.open(url, PROJECTOR_WINDOW_NAME, windowFeatures);
    if (this.globalProjectorWindow) {
      localStorage.setItem('projectorWindowOpen', 'true');
      this.globalProjectorWindow.focus();
    }
    return this.globalProjectorWindow;
  }

  sendMessage(windowRef: Window | null, message: unknown): boolean {
    // Reihenfolge wie bisher: explizite Referenz → globale Referenz → gefundenes Fenster.
    // getProjectorWindow() wird nur ausgewertet, wenn beide vorherigen ungültig sind
    // (verhindert ungewolltes Öffnen eines neuen Fensters).
    const candidates: Array<Window | null> = [windowRef, this.globalProjectorWindow];
    if ((!windowRef || windowRef.closed) && (!this.globalProjectorWindow || this.globalProjectorWindow.closed)) {
      candidates.push(this.getProjectorWindow());
    }

    for (const win of candidates) {
      if (win && !win.closed) {
        try {
          win.postMessage(message, self.location.origin);
          return true;
        } catch (error) {
          console.error('Fehler beim Senden der Nachricht an das Projektorfenster:', error);
          this.globalProjectorWindow = null;
        }
      }
    }
    return false;
  }

  isProjectorOpen(): boolean {
    if (this.globalProjectorWindow && !this.globalProjectorWindow.closed) {
      try {
        void this.globalProjectorWindow.location.href;
        return true;
      } catch {
        this.globalProjectorWindow = null;
        localStorage.removeItem('projectorWindowOpen');
        return false;
      }
    }

    try {
      const projectorWindow = window.open('', PROJECTOR_WINDOW_NAME);
      if (projectorWindow && !projectorWindow.closed) {
        void projectorWindow.location.href;
        this.globalProjectorWindow = projectorWindow;
        return true;
      }
    } catch {
      // Fenster nicht zugreifbar
    }

    localStorage.removeItem('projectorWindowOpen');
    return false;
  }

  getProjectorWindow(): Window | null {
    if (this.globalProjectorWindow && !this.globalProjectorWindow.closed) {
      try {
        void this.globalProjectorWindow.location.href;
        this.globalProjectorWindow.focus();
        return this.globalProjectorWindow;
      } catch {
        this.globalProjectorWindow = null;
      }
    }

    try {
      const existingWindow = window.open('', PROJECTOR_WINDOW_NAME);
      if (existingWindow && !existingWindow.closed) {
        void existingWindow.location.href;
        this.globalProjectorWindow = existingWindow;
        this.globalProjectorWindow.focus();
        return this.globalProjectorWindow;
      }
    } catch {
      // Fenster nicht zugreifbar — neues Fenster öffnen
    }

    const windowFeatures = localStorage.getItem('projectorWindowFeatures') || DEFAULT_WINDOW_FEATURES;
    this.globalProjectorWindow = window.open(
      `${import.meta.env.BASE_URL}projector`,
      PROJECTOR_WINDOW_NAME,
      windowFeatures
    );
    if (this.globalProjectorWindow) {
      localStorage.setItem('projectorWindowOpen', 'true');
      this.globalProjectorWindow.focus();
    }
    return this.globalProjectorWindow;
  }

  projectSong(songId: string): Window | null {
    const projectorWindow = this.openProjectorWindow({ songId });
    try {
      localStorage.setItem('lastProjectedSongId', songId);
      localStorage.setItem('lastProjectedTime', Date.now().toString());
      window.dispatchEvent(new CustomEvent('songProjected', { detail: { songId } }));
    } catch (error) {
      console.error('Fehler beim Senden der Projektion-Nachricht:', error);
    }
    return projectorWindow;
  }

  projectSetlist(setlistId: string): Window | null {
    const projectorWindow = this.openProjectorWindow({ setlistId });
    try {
      localStorage.setItem('lastProjectedSetlistId', setlistId);
      localStorage.setItem('lastProjectedTime', Date.now().toString());
      window.dispatchEvent(new CustomEvent('setlistProjected', { detail: { setlistId } }));
    } catch (error) {
      console.error('Fehler beim Senden der Projektion-Nachricht:', error);
    }
    return projectorWindow;
  }
}

export const projectorWindowManager = new ProjectorWindowManager();