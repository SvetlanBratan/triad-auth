'use server';

import ImageKit from 'imagekit';
import { clientEnv, serverEnv } from '@/lib/env';

export async function uploadImage(dataUrl: string, fileName: string) {
  if (!clientEnv.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || !serverEnv.IMAGEKIT_PRIVATE_KEY || !serverEnv.IMAGEKIT_URL_ENDPOINT) {
    throw new Error('ImageKit environment variables are not configured.');
  }

  const imagekit = new ImageKit({
    publicKey: clientEnv.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
    privateKey: serverEnv.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: serverEnv.IMAGEKIT_URL_ENDPOINT,
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
