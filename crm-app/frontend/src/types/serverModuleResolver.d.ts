/**
 * Type definition for serverModuleResolver plugin
 */
declare module './src/plugins/serverModuleResolver.js' {
  /**
   * Custom Vite plugin to handle server-side modules in browser context
   */
  export default function serverModuleResolver(): {
    name: string;
    resolveId(source: string): string | null;
    load(id: string): string | null;
  };
}
