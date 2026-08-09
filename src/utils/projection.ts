/**
 * Hilfsfunktionen für die Projektion
 */

// Globale Referenz auf das Projektorfenster
let globalProjectorWindow: Window | null = null;

/**
 * Öffnet ein Projektionsfenster mit dem angegebenen Lied oder der Setlist
 * oder aktualisiert ein bestehendes Fenster
 * 
 * @param options Optionen für das Projektionsfenster
 * @returns Das geöffnete Fenster oder null, wenn das Öffnen fehlgeschlagen ist
 */
export function openProjectorWindow(options: {
  songId?: string;
  setlistId?: string;
}): Window | null {
  // Bestimme die URL für das Projektorfenster
  let url = `${import.meta.env.BASE_URL}projector`;
  const params = new URLSearchParams();
  
  if (options.songId) {
    params.append('songId', options.songId);
  }
  
  if (options.setlistId) {
    params.append('setlistId', options.setlistId);
  }
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }
  
  // Verwende gespeicherte Fenstereinstellungen oder Standardwerte
  const windowFeatures = localStorage.getItem('projectorWindowFeatures') || 'width=1024,height=768';
  
  // Prüfe, ob die globale Referenz gültig ist
  if (globalProjectorWindow && !globalProjectorWindow.closed) {
    try {
      // Versuche auf eine Eigenschaft des Fensters zuzugreifen, um zu prüfen, ob es wirklich existiert
      void globalProjectorWindow.location.href;
      
      // Wenn das Fenster bereits existiert, aktualisiere die URL
      globalProjectorWindow.location.href = url;
      globalProjectorWindow.focus();
      return globalProjectorWindow;
    } catch (error) {
      // Wenn eine Ausnahme auftritt, ist das Fenster nicht mehr zugänglich
      globalProjectorWindow = null;
    }
  }
  
  // Wenn keine gültige globale Referenz existiert, versuche ein Fenster mit dem Namen 'projector' zu finden
  try {
    const existingWindow = window.open('', 'projector');
    if (existingWindow && !existingWindow.closed) {
      // Versuche auf eine Eigenschaft des Fensters zuzugreifen
      void existingWindow.location.href;
      
      // Wenn das Fenster existiert, aktualisiere die URL
      existingWindow.location.href = url;
      existingWindow.focus();
      globalProjectorWindow = existingWindow;
      localStorage.setItem('projectorWindowOpen', 'true');
      return globalProjectorWindow;
    }
  } catch (error) {
    // Ignoriere Fehler und öffne ein neues Fenster
  }
  
  // Wenn kein Fenster gefunden wurde oder es nicht zugänglich ist, öffne ein neues
  globalProjectorWindow = window.open(url, 'projector', windowFeatures);
  
  // Speichere eine Referenz auf das Fenster im localStorage, damit andere Komponenten es finden können
  if (globalProjectorWindow) {
    localStorage.setItem('projectorWindowOpen', 'true');
    globalProjectorWindow.focus();
  }
  
  return globalProjectorWindow;
}

/**
 * Sendet eine Nachricht an das Projektorfenster
 * 
 * @param window Das Projektorfenster (optional, verwendet die globale Referenz wenn nicht angegeben)
 * @param message Die zu sendende Nachricht
 * @returns true, wenn die Nachricht gesendet wurde, sonst false
 */
export function sendMessageToProjector(window: Window | null, message: unknown): boolean {
  // Verwende das übergebene Fenster, wenn es gültig ist
  if (window && !window.closed) {
    try {
      window.postMessage(message, self.location.origin);
      return true;
    } catch (error) {
      console.error('Fehler beim Senden der Nachricht an das Projektorfenster:', error);
      return false;
    }
  }
  
  // Verwende die globale Referenz, wenn sie gültig ist
  if (globalProjectorWindow && !globalProjectorWindow.closed) {
    try {
      globalProjectorWindow.postMessage(message, self.location.origin);
      return true;
    } catch (error) {
      console.error('Fehler beim Senden der Nachricht an das globale Projektorfenster:', error);
      globalProjectorWindow = null;
      return false;
    }
  }
  
  // Versuche, das Fenster zu finden, falls es nicht übergeben wurde und keine globale Referenz existiert
  const projectorWindow = getProjectorWindow();
  if (projectorWindow && !projectorWindow.closed) {
    try {
      projectorWindow.postMessage(message, self.location.origin);
      return true;
    } catch (error) {
      console.error('Fehler beim Senden der Nachricht an das gefundene Projektorfenster:', error);
      return false;
    }
  }
  
  return false;
}

/**
 * Prüft, ob ein Projektorfenster geöffnet ist
 * 
 * @returns true, wenn ein Projektorfenster geöffnet ist, sonst false
 */
export function isProjectorOpen(): boolean {
  // Prüfe zuerst die globale Referenz
  if (globalProjectorWindow && !globalProjectorWindow.closed) {
    try {
      // Versuche auf eine Eigenschaft des Fensters zuzugreifen
      void globalProjectorWindow.location.href;
      return true;
    } catch (error) {
      // Wenn eine Ausnahme auftritt, ist das Fenster nicht mehr zugänglich
      globalProjectorWindow = null;
      localStorage.removeItem('projectorWindowOpen');
      return false;
    }
  }
  
  // Wenn keine gültige globale Referenz existiert, versuche ein Fenster mit dem Namen 'projector' zu finden
  try {
    const projectorWindow = window.open('', 'projector');
    if (projectorWindow && !projectorWindow.closed) {
      // Versuche auf eine Eigenschaft des Fensters zuzugreifen
      void projectorWindow.location.href;
      
      // Aktualisiere die globale Referenz
      globalProjectorWindow = projectorWindow;
      return true;
    }
  } catch (error) {
    // Ignoriere Fehler
  }
  
  // Wenn das Fenster nicht existiert oder geschlossen ist, entferne den Marker
  localStorage.removeItem('projectorWindowOpen');
  return false;
}

/**
 * Holt das aktuelle Projektorfenster oder öffnet ein neues, wenn keines existiert
 * 
 * @returns Das Projektorfenster oder null, wenn keines geöffnet werden konnte
 */
export function getProjectorWindow(): Window | null {
  // Prüfe zuerst die globale Referenz
  if (globalProjectorWindow && !globalProjectorWindow.closed) {
    try {
      // Versuche auf eine Eigenschaft des Fensters zuzugreifen
      void globalProjectorWindow.location.href;
      globalProjectorWindow.focus();
      return globalProjectorWindow;
    } catch (error) {
      // Wenn eine Ausnahme auftritt, ist das Fenster nicht mehr zugänglich
      globalProjectorWindow = null;
    }
  }
  
  // Wenn keine gültige globale Referenz existiert, versuche ein Fenster mit dem Namen 'projector' zu finden
  try {
    const existingWindow = window.open('', 'projector');
    if (existingWindow && !existingWindow.closed) {
      // Versuche auf eine Eigenschaft des Fensters zuzugreifen
      void existingWindow.location.href;
      
      // Aktualisiere die globale Referenz
      globalProjectorWindow = existingWindow;
      globalProjectorWindow.focus();
      return globalProjectorWindow;
    }
  } catch (error) {
    // Ignoriere Fehler und öffne ein neues Fenster
  }
  
  // Wenn kein Fenster gefunden wurde oder es nicht zugänglich ist, öffne ein neues
  const windowFeatures = localStorage.getItem('projectorWindowFeatures') || 'width=1024,height=768';
  globalProjectorWindow = window.open(`${import.meta.env.BASE_URL}projector`, 'projector', windowFeatures);
  
  if (globalProjectorWindow) {
    localStorage.setItem('projectorWindowOpen', 'true');
    globalProjectorWindow.focus();
  }
  
  return globalProjectorWindow;
}

/**
 * Projiziert ein Lied im Projektorfenster
 * 
 * @param songId Die ID des zu projizierenden Liedes
 * @returns Das Projektorfenster oder null, wenn keines geöffnet werden konnte
 */
export function projectSong(songId: string): Window | null {
  // Öffne das Projektorfenster oder aktualisiere es
  const projectorWindow = openProjectorWindow({ songId });
  
  // Sende eine Nachricht an alle geöffneten Tabs, dass ein Lied projiziert wurde
  // Dies ermöglicht es anderen Komponenten, auf die Projektion zu reagieren
  try {
    localStorage.setItem('lastProjectedSongId', songId);
    localStorage.setItem('lastProjectedTime', Date.now().toString());
    window.dispatchEvent(new CustomEvent('songProjected', { detail: { songId } }));
  } catch (error) {
    console.error('Fehler beim Senden der Projektion-Nachricht:', error);
  }
  
  return projectorWindow;
}

/**
 * Projiziert eine Setlist im Projektorfenster
 * 
 * @param setlistId Die ID der zu projizierenden Setlist
 * @returns Das Projektorfenster oder null, wenn keines geöffnet werden konnte
 */
export function projectSetlist(setlistId: string): Window | null {
  // Öffne das Projektorfenster oder aktualisiere es
  const projectorWindow = openProjectorWindow({ setlistId });
  
  // Sende eine Nachricht an alle geöffneten Tabs, dass eine Setlist projiziert wurde
  try {
    localStorage.setItem('lastProjectedSetlistId', setlistId);
    localStorage.setItem('lastProjectedTime', Date.now().toString());
    window.dispatchEvent(new CustomEvent('setlistProjected', { detail: { setlistId } }));
  } catch (error) {
    console.error('Fehler beim Senden der Projektion-Nachricht:', error);
  }
  
  return projectorWindow;
}
