// Función para limpiar la URL de OJS y obtener la base del portal
export const getPortalBaseUrl = (url: string): string => {
  let clean = url.trim();
  // Elimina barras diagonales al final
  clean = clean.replace(/\/+$/, '');
  // Si incluye index.php, corta todo lo posterior a index.php
  if (clean.includes('/index.php')) {
    clean = clean.split('/index.php')[0];
  }
  return clean;
};

// Determina dinámicamente el idioma/locale que soporta la revista
export const getJournalLocale = (nameObj: any): string => {
  if (!nameObj) return 'es_ES';
  const keys = Object.keys(nameObj);
  if (keys.includes('es_ES')) return 'es_ES';
  if (keys.includes('es')) return 'es';
  return keys[0] || 'es_ES';
};
