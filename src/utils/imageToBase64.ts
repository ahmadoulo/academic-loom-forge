/**
 * Convertit une URL d'image en base64 pour l'utilisation avec jsPDF
 * @param url L'URL de l'image à convertir
 * @returns Une promise qui résout en string base64
 */
export const imageUrlToBase64 = async (url: string): Promise<string> => {
  try {
    // Fetch l'image
    const response = await fetch(url);
    const blob = await response.blob();
    
    // Convertir en base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Erreur lors de la conversion de l\'image en base64:', error);
    throw error;
  }
};
