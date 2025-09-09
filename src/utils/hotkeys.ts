/**
 * Bindet Hotkeys an ein HTML-Element
 */
export function bindHotkeys(
  el: HTMLElement,
  handlers: {
    next?: () => void;
    prev?: () => void;
    blackout?: () => void;
    fullscreen?: () => void;
  }
) {
  function onKey(e: KeyboardEvent) {
    switch (e.key) {
      case 'ArrowRight': handlers.next?.(); break;
      case 'ArrowLeft':  handlers.prev?.(); break;
      case 'b': case 'B': handlers.blackout?.(); break;
      case 'f': case 'F': handlers.fullscreen?.(); break;
      case '.': handlers.next?.(); break;
      case ',': handlers.prev?.(); break;
    }
  }
  el.addEventListener('keydown', onKey);
  return () => el.removeEventListener('keydown', onKey);
}
