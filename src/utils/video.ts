const YOUTUBE_HOSTS = ['youtube.com', 'www.youtube.com', 'youtu.be'];
const VIMEO_HOSTS = ['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'];

const toUrl = (value: string) => {
  try {
    return new URL(value.trim());
  } catch {
    return null;
  }
};

export const isDirectVideoUrl = (value?: string) => {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return ['.mp4', '.webm', '.ogg', '.mov', '.m3u8'].some((extension) => normalized.includes(extension));
};

export const getVideoEmbedUrl = (value?: string) => {
  if (!value) return null;
  const url = toUrl(value);
  if (!url) return null;

  if (YOUTUBE_HOSTS.includes(url.hostname)) {
    const pathParts = url.pathname.split('/').filter(Boolean);
    const videoId =
      url.hostname === 'youtu.be'
        ? pathParts[0]
        : url.searchParams.get('v') ||
          (pathParts[0] === 'shorts' ? pathParts[1] : pathParts[pathParts.length - 1]);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  }

  if (VIMEO_HOSTS.includes(url.hostname)) {
    const parts = url.pathname.split('/').filter(Boolean);
    const videoId = parts[0] === 'video' ? parts[1] : parts[0];
    return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
  }

  return null;
};
