/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API Base URL - full URL in production, '/api' for dev proxy */
  readonly VITE_API_BASE_URL?: string
  /** Base path for the application when behind a reverse proxy */
  readonly VITE_BASE_PATH?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
