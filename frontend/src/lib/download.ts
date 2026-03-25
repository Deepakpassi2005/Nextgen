/**
 * Force follows a URL and triggers a download (bypassing cross-origin browser behavior
 * where the 'download' attribute is ignored for different origins).
 */
export async function downloadFile(url: string, filename: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Download failed');
    
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Download error:', error);
    // Fallback: open in new tab if blob download fails
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
