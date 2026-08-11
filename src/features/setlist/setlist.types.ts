export interface SetlistItem {
  songId: string;
  verseIds: string[]; // IDs der Verse in der Reihenfolge, wie sie angezeigt werden sollen
}

export interface Setlist {
  id: string;
  name: string;
  items: SetlistItem[];
  createdAt: string;
  updatedAt: string;
}