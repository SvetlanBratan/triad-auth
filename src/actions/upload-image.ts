'use server';

import ImageKit from 'imagekit';
import { env } from '@/lib/env';

export async function uploadImage(dataUrl: string, fileName: string) {
  if (!env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || !env.IMAGEKIT_PRIVATE_KEY || !env.IMAGEKIT_URL_ENDPOINT) {
    throw new Error('ImageKit environment variables are not configured.');
  }

  const imagekit = new ImageKit({
    publicKey: env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
    privateKey: env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: env.IMAGEKIT_URL_ENDPOINT,
  });

  try {
    const response = await imagekit.upload({
      file: dataUrl,
      fileName: fileName,
      folder: '/triad-items', // Optional: organize uploads into a folder
    });
    return { url: response.url };
  } catch (error) {
    console.error('ImageKit Server-side Upload Error:', error);
    if (error instanceof Error) {
        throw new Error(`Failed to upload image to ImageKit: ${error.message}`);
    }
    throw new Error('An unknown error occurred during image upload.');
  }
}
