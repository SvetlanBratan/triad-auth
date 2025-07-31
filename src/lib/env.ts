import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1),
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: z.string().min(1),
  NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY: z.string().min(1),
  IMAGEKIT_PRIVATE_KEY: z.string().min(1),
  IMAGEKIT_URL_ENDPOINT: z.string().min(1),
});

const processEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
  NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
  IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY,
  IMAGEKIT_URL_ENDPOINT: process.env.IMAGEKIT_URL_ENDPOINT,
}

// Validating process.env
const parsedEnv = envSchema.safeParse(processEnv);

if (!parsedEnv.success) {
  console.error(
    "❌ Invalid environment variables:",
    parsedEnv.error.flatten().fieldErrors,
  );
  throw new Error("Invalid environment variables.");
}

export const env = parsedEnv.data;
