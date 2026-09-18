/**
 * Resolves absolute paths dynamically based on Astro's BASE_URL configuration.
 * Prevents broken assets when deploying to GitHub Pages subdirectories.
 */
export function resolvePath(path: string): string {
  const base = import.meta.env.BASE_URL;
  const cleanBase = base === '/' ? '' : base.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // If the path is exactly '/' and base is empty, we must return '/'
  if (cleanPath === '/' && cleanBase === '') {
    return '/';
  }
  
  return `${cleanBase}${cleanPath}`;
}
