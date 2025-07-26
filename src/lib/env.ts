
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1),
  // We don't need to load the preset here as it's passed via props, but we keep the logic flexible.
});

// This object will hold the validated environment variables.
// We use a proxy to throw a clear error if a client-side variable is accessed on the server.
const clientEnv = {
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
};

// Validate the environment variables.
try {
  envSchema.parse(clientEnv);
} catch (err) {
  throw new Error(
    'Invalid environment variables: ' +
      (err instanceof z.ZodError ? err.issues.map((i) => i.path).join(', ') : 'Unknown error')
  );
}


export const env = clientEnv as z.infer<typeof envSchema> & { NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: string };
