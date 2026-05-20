import { useState, useEffect } from 'react';
import { imageLoader } from '../game/utils/ImageLoader';

/**
 * Custom hook to load and cache item images using the ImageLoader.
 * @param imageId The ID of the image to load.
 * @returns The image source URL or 'failed' if loading fails, or null if no imageId is provided.
 */
export function useItemImage(imageId: string | null | undefined): string | null {
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!imageId) {
      setImageSrc(null);
      return;
    }

    const loadImage = async () => {
      try {
        const imgElement = await imageLoader.getItemImage(imageId);
        if (isMounted) {
          if (imgElement && imgElement.src) {
            setImageSrc(imgElement.src);
          } else {
            setImageSrc('failed');
          }
        }
      } catch (err) {
        console.warn(`[useItemImage] Failed to load image for ${imageId}`, err);
        if (isMounted) {
          setImageSrc('failed');
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [imageId]);

  return imageSrc;
}
