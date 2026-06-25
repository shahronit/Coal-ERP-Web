export const DEFAULT_APP_NAME = 'VK Trading ERP';

export function resolveAppName(name) {
  return name?.trim() || DEFAULT_APP_NAME;
}

export function splitAppName(name) {
  const resolved = resolveAppName(name);
  if (resolved.endsWith(' ERP')) {
    return { primary: resolved.slice(0, -4).trim(), suffix: 'ERP' };
  }
  const parts = resolved.split(/\s+/);
  if (parts.length <= 1) return { primary: resolved, suffix: null };
  return { primary: parts.slice(0, -1).join(' '), suffix: parts[parts.length - 1] };
}

export function initialsFromAppName(name) {
  const resolved = resolveAppName(name);
  const words = resolved.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return resolved.slice(0, 2).toUpperCase();
}
