/**
 * Hilfsfunktionen für die Projektion
 */

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
  let url = '/projector';
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
  
  // Prüfe, ob bereits ein Projektorfenster existiert
  let projectorWindow = window.open('', 'projector');
  
  // Wenn das Fenster nicht existiert oder geschlossen wurde, öffne ein neues
  if (!projectorWindow || projectorWindow.closed) {
    projectorWindow = window.open(url, 'projector', windowFeatures);
  } else {
    // Wenn das Fenster bereits existiert, aktualisiere die URL
    projectorWindow.location.href = url;
  }
  
  // Fokus auf das Fenster setzen
  if (projectorWindow) {
    projectorWindow.focus();
  }
  
  return projectorWindow;
}

/**
 * Sendet eine Nachricht an das Projektorfenster
 * 
 * @param window Das Projektorfenster
 * @param message Die zu sendende Nachricht
 */
export function sendMessageToProjector(window: Window | null, message: any): void {
  if (window && !window.closed) {
    window.postMessage(message, '*');
  }
}

/**
 * Prüft, ob ein Projektorfenster geöffnet ist
 * 
 * @returns true, wenn ein Projektorfenster geöffnet ist, sonst false
 */
export function isProjectorOpen(): boolean {
  const projectorWindow = window.open('', 'projector');
  if (projectorWindow && !projectorWindow.closed) {
    // Schließe das Fenster nicht, sondern prüfe nur, ob es existiert
    return true;
  }
  return false;
}

/**
 * Holt das aktuelle Projektorfenster oder öffnet ein neues, wenn keines existiert
 * 
 * @returns Das Projektorfenster oder null, wenn keines geöffnet werden konnte
 */
export function getProjectorWindow(): Window | null {
  let projectorWindow = window.open('', 'projector');
  
  if (!projectorWindow || projectorWindow.closed) {
    // Wenn kein Fenster existiert, öffne ein neues
    const windowFeatures = localStorage.getItem('projectorWindowFeatures') || 'width=1024,height=768';
    projectorWindow = window.open('/projector', 'projector', windowFeatures);
  }
  
  if (projectorWindow) {
    projectorWindow.focus();
  }
  
  return projectorWindow;
}
