
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1),
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: z.string().min(1),
});

const clientEnv = {
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
};

try {
  envSchema.parse(clientEnv);
} catch (err) {
  throw new Error(
    'Invalid environment variables: ' +
      (err instanceof z.ZodError ? err.issues.map((i) => i.path).join(', ') : 'Unknown error')
  );
}


export const env = clientEnv as z.infer<typeof envSchema> & { NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: string, NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: string };

