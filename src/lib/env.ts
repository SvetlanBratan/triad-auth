
import { z } from 'zod';

/**
 * Schema for client-side environment variables.
 * These are exposed to the browser.
 */
const clientSchema = z.object({
  NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY: z.string().min(1),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1),
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_AVATARS: z.string().min(1),
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_ANKETS: z.string().min(1),
});

/**
 * Schema for server-side environment variables.
 * These are only available on the server.
 */
const serverSchema = z.object({
  IMAGEKIT_PRIVATE_KEY: z.string().min(1),
  IMAGEKIT_URL_ENDPOINT: z.string().min(1),
});

// Client-side environment variables
const clientEnvParsed = clientSchema.safeParse({
  NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_AVATARS: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_AVATARS,
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_ANKETS: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_ANKETS,
});

if (!clientEnvParsed.success) {
  console.error(
    '❌ Invalid client-side environment variables:',
    clientEnvParsed.error.flatten().fieldErrors
  );
  // Throw an error during build, but not in the browser
  if (typeof window === 'undefined') {
    throw new Error('Invalid client-side environment variables. Check your .env file.');
  }
}

export const clientEnv = clientEnvParsed.success ? clientEnvParsed.data : {} as z.infer<typeof clientSchema>;


// Server-side environment variables
// We will only parse and export these on the server to avoid leaking them to the client.
let serverEnvUnsafe: z.infer<typeof serverSchema>;

if (typeof window === 'undefined') { // Only run on server
    const serverEnvParsed = serverSchema.safeParse(process.env);
    if (!serverEnvParsed.success) {
        console.error(
            '❌ Invalid server-side environment variables:',
            serverEnvParsed.error.flatten().fieldErrors
        );
        throw new Error('Invalid server-side environment variables. Check your .env file.');
    }
    serverEnvUnsafe = serverEnvParsed.data;
} else {
    serverEnvUnsafe = {} as z.infer<typeof serverSchema>;
}

export const serverEnv = serverEnvUnsafe;
