/**
 * Utility to sanitize image URLs, specifically handling cases where users
 * paste Google Image Search URLs (e.g. https://www.google.com/imgres?imgurl=...)
 * instead of direct image links.
 */
export function cleanImageUrl(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  try {
    // Tangani gambar kunyit lama dari pemda yang 403 Forbidden
    if (trimmed.includes('desagrogol') && trimmed.toUpperCase().includes('KUNYIT')) {
      return '/images/kunyit.jpg';
    }

    if (trimmed.includes('google.') && (trimmed.includes('imgurl=') || trimmed.includes('/imgres'))) {
      const parsed = new URL(trimmed);
      const imgUrl = parsed.searchParams.get('imgurl');
      if (imgUrl) return decodeURIComponent(imgUrl);
    }
  } catch {
    // fallback if URL parsing fails
  }
  return trimmed;
}
