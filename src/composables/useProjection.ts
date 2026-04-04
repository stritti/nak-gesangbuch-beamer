import { ref, onMounted, onUnmounted } from 'vue';
import { projectSong, projectSetlist, isProjectorOpen, getProjectorWindow, sendMessageToProjector } from '@/utils/projection';

/**
 * Composable für die Projektion von Liedern und Setlists
 */
export function useProjection() {
  const projectorWindow = ref<Window | null>(null);
  
  // Beim Initialisieren prüfen, ob ein Projektorfenster bereits geöffnet ist
  onMounted(() => {
    // Versuche, das Projektorfenster zu finden
    if (isProjectorOpen()) {
      projectorWindow.value = getProjectorWindow();
    }
    
    // Event-Listener für Projektion-Events
    const handleSongProjected = (event: CustomEvent) => {
      if (event.detail && event.detail.songId) {
        // Aktualisiere die Referenz auf das Projektorfenster
        projectorWindow.value = getProjectorWindow();
      }
    };
    
    const handleSetlistProjected = (event: CustomEvent) => {
      if (event.detail && event.detail.setlistId) {
        // Aktualisiere die Referenz auf das Projektorfenster
        projectorWindow.value = getProjectorWindow();
      }
    };
    
    // Registriere die Event-Listener
    window.addEventListener('songProjected', handleSongProjected as EventListener);
    window.addEventListener('setlistProjected', handleSetlistProjected as EventListener);
    
    // Prüfe regelmäßig, ob das Projektorfenster noch geöffnet ist
    const checkInterval = setInterval(() => {
      if (projectorWindow.value && projectorWindow.value.closed) {
        // Wenn das Fenster geschlossen wurde, setze die Referenz zurück
        projectorWindow.value = null;
      } else if (!projectorWindow.value && isProjectorOpen()) {
        // Wenn kein Fenster referenziert ist, aber eines geöffnet ist, aktualisiere die Referenz
        projectorWindow.value = getProjectorWindow();
      }
    }, 1000);
    
    // Cleanup beim Unmount
    onUnmounted(() => {
      window.removeEventListener('songProjected', handleSongProjected as EventListener);
      window.removeEventListener('setlistProjected', handleSetlistProjected as EventListener);
      clearInterval(checkInterval);
    });
  });
  
  /**
   * Projiziert ein Lied im Projektorfenster
   * 
   * @param songId Die ID des zu projizierenden Liedes
   */
  const projectSongToWindow = (songId: string) => {
    projectorWindow.value = projectSong(songId);
    return projectorWindow.value;
  };
  
  /**
   * Projiziert eine Setlist im Projektorfenster
   * 
   * @param setlistId Die ID der zu projizierenden Setlist
   */
  const projectSetlistToWindow = (setlistId: string) => {
    projectorWindow.value = projectSetlist(setlistId);
    return projectorWindow.value;
  };
  
  /**
   * Prüft, ob ein Projektorfenster geöffnet ist
   */
  const isProjectorWindowOpen = () => {
    return isProjectorOpen();
  };
  
  /**
   * Sendet eine Nachricht an das Projektorfenster
   */
  const sendMessageToProjectorWindow = (message: any) => {
    return sendMessageToProjector(projectorWindow.value, message);
  };
  
  return {
    projectorWindow,
    projectSongToWindow,
    projectSetlistToWindow,
    isProjectorWindowOpen,
    sendMessageToProjectorWindow
  };
}
