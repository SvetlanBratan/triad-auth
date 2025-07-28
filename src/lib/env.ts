

import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1),
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: z.string().min(1),
  NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY: z.string().min(1),
});

const clientEnv = {
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
  NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
};

try {
  envSchema.parse(clientEnv);
} catch (err) {
  // We allow the app to run even if some variables are missing,
  // but we log an error to the console.
  // The functionality that depends on the missing variables will fail at runtime.
  console.error(
    'Missing environment variables: ' +
      (err instanceof z.ZodError ? err.issues.map((i) => i.path).join(', ') : 'Unknown error')
  );
}


export const env = clientEnv as z.infer<typeof envSchema> & { [key: string]: string };
