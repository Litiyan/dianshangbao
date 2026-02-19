
// Manual declarations for environment variables to avoid "Cannot find type definition file for 'vite/client'" error.
// The app uses process.env.API_KEY exclusively on the server-side (BFF) as per security requirements.

interface ImportMetaEnv {
  // Client-side environment variables can be declared here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
