import { ref } from 'vue';
import { projectSong, projectSetlist, isProjectorOpen } from '@/utils/projection';

/**
 * Composable für die Projektion von Liedern und Setlists
 */
export function useProjection() {
  const projectorWindow = ref<Window | null>(null);
  
  /**
   * Projiziert ein Lied im Projektorfenster
   * 
   * @param songId Die ID des zu projizierenden Liedes
   */
  const projectSongToWindow = (songId: string) => {
    projectorWindow.value = projectSong(songId);
  };
  
  /**
   * Projiziert eine Setlist im Projektorfenster
   * 
   * @param setlistId Die ID der zu projizierenden Setlist
   */
  const projectSetlistToWindow = (setlistId: string) => {
    projectorWindow.value = projectSetlist(setlistId);
  };
  
  /**
   * Prüft, ob ein Projektorfenster geöffnet ist
   */
  const isProjectorWindowOpen = () => {
    return isProjectorOpen();
  };
  
  return {
    projectorWindow,
    projectSongToWindow,
    projectSetlistToWindow,
    isProjectorWindowOpen
  };
}
