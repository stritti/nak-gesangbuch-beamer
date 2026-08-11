/**
 * Rückwärtskompatibler Wrapper um den Projektorfenster-Manager.
 * Neue Nutzung: direkt über '@/features/projection/projector-window'.
 */
import { projectorWindowManager } from '@/features/projection/projector-window';

export {
  projectorWindowManager,
  buildProjectorUrl,
  getWindowFeatures,
  PROJECTOR_WINDOW_NAME
} from '@/features/projection/projector-window';
export type { ProjectorWindowType } from '@/features/projection/projector-window';

export function openProjectorWindow(options: { songId?: string; setlistId?: string }): Window | null {
  return projectorWindowManager.openProjectorWindow(options);
}
export function sendMessageToProjector(window: Window | null, message: unknown): boolean {
  return projectorWindowManager.sendMessage(window, message);
}
export function isProjectorOpen(): boolean {
  return projectorWindowManager.isProjectorOpen();
}
export function getProjectorWindow(): Window | null {
  return projectorWindowManager.getProjectorWindow();
}
export function projectSong(songId: string): Window | null {
  return projectorWindowManager.projectSong(songId);
}
export function projectSetlist(setlistId: string): Window | null {
  return projectorWindowManager.projectSetlist(setlistId);
}