/**
 * Öffnet einen Datei-Picker-Dialog und gibt die ausgewählten Dateien zurück
 */
export async function pickFiles(accept = '.json', multiple = true): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = multiple;
    
    input.onchange = () => {
      const files = Array.from(input.files || []);
      resolve(files);
    };
    
    input.click();
  });
}

/**
 * Liest eine Datei als Text
 */
export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      resolve(reader.result as string);
    };
    
    reader.onerror = () => {
      reject(new Error(`Fehler beim Lesen der Datei: ${file.name}`));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Speichert Daten als Datei zum Download
 */
export function saveAsFile(data: string, filename: string, type = 'application/json'): void {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  
  URL.revokeObjectURL(url);
}
