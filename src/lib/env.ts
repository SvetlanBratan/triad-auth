import { z } from 'zod';

// Schema for client-side environment variables
const clientSchema = z.object({
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1),
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: z.string().min(1),
  NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY: z.string().min(1),
});

// Schema for server-side environment variables
const serverSchema = z.object({
  DATABASE_URL: z.string().min(1),
  IMAGEKIT_PRIVATE_KEY: z.string().min(1),
  IMAGEKIT_URL_ENDPOINT: z.string().min(1),
});

const processEnv = {
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
  NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
  // Server-side variables are only available on the server
  DATABASE_URL: process.env.DATABASE_URL,
  IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY,
  IMAGEKIT_URL_ENDPOINT: process.env.IMAGEKIT_URL_ENDPOINT,
};

// We only validate client-side variables in the browser
const parsedClient = clientSchema.safeParse(processEnv);

if (typeof window !== 'undefined' && !parsedClient.success) {
  console.error(
    "❌ Invalid client-side environment variables:",
    parsedClient.error.flatten().fieldErrors,
  );
  throw new Error("Invalid client-side environment variables.");
}

// We validate all variables on the server
let env: z.infer<typeof clientSchema> & z.infer<typeof serverSchema>;
if (typeof window === 'undefined') {
    const fullSchema = clientSchema.merge(serverSchema);
    const parsedFull = fullSchema.safeParse(processEnv);
    if (!parsedFull.success) {
         console.error(
            "❌ Invalid server-side environment variables:",
            parsedFull.error.flatten().fieldErrors,
        );
        throw new Error("Invalid server-side environment variables.");
    }
    env = parsedFull.data;
} else {
    env = parsedClient.data as any; // We know it's successful here
}

export { env };
export const clientEnv = parsedClient.success ? parsedClient.data : {} as z.infer<typeof clientSchema>;
