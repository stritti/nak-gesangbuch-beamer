/** Zuständig für Lifecycle, Auffinden und Kommunikation des Projektorfensters. */

export type ProjectorWindowType = 'primary' | 'secondary' | 'fullscreen' | 'custom';

export const PROJECTOR_WINDOW_NAME = 'projector';
const DEFAULT_WINDOW_FEATURES = 'width=1024,height=768';

/** Baut die Projektor-URL aus BASE_URL und Query-Parameter (pure). */
export function buildProjectorUrl(options: { songId?: string; setlistId?: string }): string {
  const url = `${import.meta.env.BASE_URL}projector`;
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

    // Versuche zuerst über die interne Referenz auf das bestehende Fenster zuzugreifen.
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

    // window.open(url, name, features) findet ein bestehendes Fenster mit gleichem Namen
    // und navigiert es, oder öffnet ein neues Fenster/Tab — beides gewünscht.
    // WICHTIG: Kein window.open('', name) als Zwischenschritt verwenden!
    // Das kann das aktuelle Fenster zurückgeben, wenn dessen Name übereinstimmt,
    // und würde dann den aktuellen Tab zur Projektion navigieren.
    this.globalProjectorWindow = window.open(url, PROJECTOR_WINDOW_NAME, windowFeatures);
    if (this.globalProjectorWindow) {
      localStorage.setItem('projectorWindowOpen', 'true');
      this.globalProjectorWindow.focus();
    }
    return this.globalProjectorWindow;
  }

  /**
   * Findet ein bestehendes Projektorfenster wieder — ohne ein neues zu öffnen.
   * `window.open('', name)` erzeugt ein `about:blank`-Fenster, wenn keines existiert;
   * das wird erkannt und wieder geschlossen.
   */
  private findExistingProjectorWindow(): Window | null {
    if (this.globalProjectorWindow && !this.globalProjectorWindow.closed) {
      try {
        void this.globalProjectorWindow.location.href;
        return this.globalProjectorWindow;
      } catch {
        this.globalProjectorWindow = null;
      }
    }

    try {
      const candidate = window.open('', PROJECTOR_WINDOW_NAME);
      if (candidate && !candidate.closed) {
        // Nie das aktuelle Fenster als Projektorfenster zurückgeben —
        // window.open('', name) kann das aktuelle Fenster liefern, wenn der Name übereinstimmt.
        if (candidate === window) {
          return null;
        }
        if (candidate.location.href === 'about:blank') {
          // Neu erzeugtes leeres Fenster — kein bestehendes Projektorfenster
          candidate.close();
          return null;
        }
        this.globalProjectorWindow = candidate;
        return candidate;
      }
    } catch {
      // Fenster nicht zugreifbar
    }
    return null;
  }

  reopenProjectorWindow(options: { songId?: string; setlistId?: string }, windowFeatures: string): Window | null {
    const url = buildProjectorUrl(options);

    // Bestehendes Fenster schließen — auch nach Reload wiederfinden (globalProjectorWindow === null),
    // damit window.open(url, name, features) ein neues Fenster mit den Features erzeugt
    // und kein bestehendes ohne Features recycelt.
    const existing = this.findExistingProjectorWindow();
    if (existing) {
      try {
        existing.close();
      } catch {
        // ignorieren
      }
    }
    this.globalProjectorWindow = null;

    // Direkt mit Features öffnen — ohne Feature-loses window.open('', name)-Lookup
    this.globalProjectorWindow = window.open(url, PROJECTOR_WINDOW_NAME, windowFeatures);
    if (this.globalProjectorWindow) {
      localStorage.setItem('projectorWindowOpen', 'true');
      this.globalProjectorWindow.focus();
    }
    return this.globalProjectorWindow;
  }

  sendMessage(windowRef: Window | null, message: unknown): boolean {
    // Reihenfolge: explizite Referenz → globale Referenz → wiederentdecktes Fenster.
    // Es wird NIE ein neues Fenster geöffnet — ohne offenes Projektorfenster wird false zurückgegeben.
    const candidates: Array<Window | null> = [windowRef, this.globalProjectorWindow];
    if ((!windowRef || windowRef.closed) && (!this.globalProjectorWindow || this.globalProjectorWindow.closed)) {
      candidates.push(this.findExistingProjectorWindow());
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