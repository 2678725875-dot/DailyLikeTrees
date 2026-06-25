/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LOCAL_BACKEND?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
