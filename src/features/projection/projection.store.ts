import { defineStore } from 'pinia';

interface ProjectionState {
  isFullscreen: boolean;
  blackout: boolean;
  currentIndex: number;   // Index im aufgelösten Slide-Stream
  fontSize: number;       // px
  lineHeight: number;     // z.B. 1.3
  theme: 'light' | 'dark' | 'high-contrast';
  maxLinesPerSlide: number;
}

export const useProjectionStore = defineStore('projection', {
  state: (): ProjectionState => ({
    isFullscreen: false,
    blackout: false,
    currentIndex: 0,
    fontSize: 80,
    lineHeight: 1.3,
    theme: 'high-contrast',
    maxLinesPerSlide: 4
  }),
  
  actions: {
    next() { 
      this.currentIndex++; 
    },
    
    prev() { 
      this.currentIndex = Math.max(0, this.currentIndex - 1); 
    },
    
    toggleBlackout() { 
      this.blackout = !this.blackout; 
    },
    
    setFullscreen(value: boolean) { 
      this.isFullscreen = value; 
    },
    
    setFontSize(size: number) {
      this.fontSize = size;
    },
    
    setLineHeight(height: number) {
      this.lineHeight = height;
    },
    
    setTheme(theme: 'light' | 'dark' | 'high-contrast') {
      this.theme = theme;
    },
    
    setMaxLinesPerSlide(lines: number) {
      this.maxLinesPerSlide = lines;
    },
    
    reset() {
      this.currentIndex = 0;
      this.blackout = false;
    }
  },
  
  persist: true
});
