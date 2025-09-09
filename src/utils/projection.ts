/**
 * Hilfsfunktionen für die Projektion
 */

/**
 * Öffnet ein Projektionsfenster mit dem angegebenen Lied oder der Setlist
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
  
  // Öffne das Fenster
  const projectorWindow = window.open(url, 'projector', windowFeatures);
  
  // Fokus auf das neue Fenster setzen
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
    return true;
  }
  return false;
}
