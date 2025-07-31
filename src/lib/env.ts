
import { z } from 'zod';

// Schema for all environment variables
const envSchema = z.object({
  // Client-side variables
  NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY: z.string().min(1),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1),
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_AVATARS: z.string().min(1),
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_ANKETS: z.string().min(1),
  // Server-side variables
  IMAGEKIT_PRIVATE_KEY: z.string().min(1),
  IMAGEKIT_URL_ENDPOINT: z.string().min(1),
});

// Parse and validate all environment variables on the server
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(
    '❌ Invalid environment variables:',
    parsedEnv.error.flatten().fieldErrors
  );
  // Throw an error only on the server-side during build/startup
  if (typeof window === 'undefined') {
    throw new Error('Invalid environment variables. Check your .env file.');
  }
}

// Environment variables available on the server
// This object is not exported to the client
export const env = parsedEnv.success ? parsedEnv.data : ({} as z.infer<typeof envSchema>);


// Environment variables available on the client
// Only NEXT_PUBLIC variables are included here
export const clientEnv = {
    NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
    NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_AVATARS: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_AVATARS!,
    NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_ANKETS: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_ANKETS!,
};
