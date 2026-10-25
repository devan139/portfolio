// Vite-native asset existence checking without requiring Node.js types
const projectImages = import.meta.glob('/public/images/projects/*', { eager: false });

export function hasProjectImage(imagePath?: string): boolean {
  if (!imagePath) return false;
  const clean = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  const publicPath = `/public${clean}`;
  return publicPath in projectImages;
}
