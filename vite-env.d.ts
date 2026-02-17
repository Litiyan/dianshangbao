
// Manual declarations for environment variables to avoid "Cannot find type definition file for 'vite/client'" error.
// The app uses process.env.API_KEY exclusively for Gemini API as per requirements.

interface ImportMetaEnv {
  readonly VITE_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
