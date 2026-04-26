import { idbService, STORES } from "./idbService";
import { dbService } from "./dbService";
import imageCompression from 'browser-image-compression';

/**
 * Saves an image to IndexedDB after optional compression.
 * @param file The image file to save.
 * @returns The generated image ID.
 */
export const saveImage = async (file: File): Promise<string> => {
  // Compression options
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true
  };

  let fileToSave = file;
  try {
    // Only compress if it's an image
    if (file.type.startsWith('image/')) {
      fileToSave = await imageCompression(file, options);
    }
  } catch (error) {
    console.warn('Compression failed, using original file:', error);
    fileToSave = file;
  }

  // IndexedDB storage
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onloadend = async () => {
      const base64data = reader.result as string;
      try {
        const imageId = await dbService.saveImage(base64data, file.name, file.type);
        resolve(imageId);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(fileToSave);
  });
};

/**
 * Fetches an image from a URL and saves it to IndexedDB.
 */
export const saveImageFromUrl = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const file = new File([blob], "downloaded_image.png", { type: blob.type });
    return saveImage(file);
  } catch (error) {
    console.error('Error saving image from URL:', error);
    return url; // Fallback to original URL
  }
};

/**
 * Retrieves all images stored in IndexedDB.
 */
export const getStoredImages = async (): Promise<any[]> => {
  try {
    const images = await idbService.getAll(STORES.IMAGES);
    return images.map(img => ({
      id: typeof img === 'string' ? 'legacy' : img.id,
      url: typeof img === 'string' ? img : img.data,
      name: typeof img === 'string' ? 'Ảnh cũ' : (img.name || 'Ảnh đã lưu'),
      timestamp: typeof img === 'string' ? Date.now() : (img.timestamp || Date.now())
    }));
  } catch (error) {
    console.error('Error fetching stored images:', error);
    return [];
  }
};

/**
 * Deletes an image from IndexedDB.
 */
export const deleteStoredImage = async (imageId: string): Promise<void> => {
  if (imageId.startsWith('img_') || imageId.startsWith('local_')) {
    await idbService.delete(STORES.IMAGES, imageId);
  }
};

/**
 * Checks if the storage system is healthy.
 */
export const checkSystemHealth = async (): Promise<boolean> => {
  return true; // IndexedDB is always "healthy" if the app is running
};

/**
 * Resolves an image ID to its base64 data or returns the URL if it's already one.
 */
export const getImageUrl = async (imageId: string): Promise<string> => {
  if (!imageId) return '';
  if (imageId.startsWith('data:image')) return imageId;
  if (imageId.startsWith('http')) return imageId;
  
  try {
    const loaded = await dbService.loadImage(imageId);
    return loaded || '';
  } catch (err) {
    console.error('Error fetching stored image:', err);
    return '';
  }
};

// Maintain backward compatibility for a transition period if needed, 
// but we will update all calls.
export const uploadImage = saveImage;
export const uploadImageFromUrl = saveImageFromUrl;
export const fetchUserImages = getStoredImages;
export const deleteImageFromCloud = deleteStoredImage;
export const deleteImage = deleteStoredImage;
