/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_REPOSITORY: string
    readonly VITE_BACKEND_TYPE: string
    readonly VITE_BACKEND_URL: string
    // more env variables...
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }