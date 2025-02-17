export const cleanDomain = (domain: string): string => {
    return domain
      .toLowerCase()
      .replace(/^www\./, '')
      .replace(/^m\./, '')
      .trim();
  };
  
  export const isValidUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'https:' || urlObj.protocol === 'http:';
    } catch {
      return false;
    }
  };