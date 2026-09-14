/** Ensure a local path is a file:// URI for native save APIs. */
export function toFileUri(uri: string): string {
  if (uri.startsWith('file://') || uri.startsWith('content://')) {
    return uri;
  }
  return `file://${uri.startsWith('/') ? '' : '/'}${uri}`;
}

export function encodedImageFileName(): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `myangar-encoded-${stamp}.png`;
}
