export function unicodeToBase64(str: string): string {
  const uriEncoded = encodeURIComponent(str);
  const base64 = btoa(uriEncoded)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return base64;
}

export function base64ToUnicode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const uriEncoded = atob(base64);
  return decodeURIComponent(uriEncoded);
}
