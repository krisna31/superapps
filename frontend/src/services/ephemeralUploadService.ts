export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  expiry: string;
}

export type ExpiryTime = '1h' | '12h' | '24h' | '72h';

/**
 * Uploads a file directly to Litterbox (ephemeral temporary storage with automatic deletion)
 */
export async function uploadToLitterbox(file: File, expiry: ExpiryTime = '24h'): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('reqtype', 'fileupload');
  formData.append('time', expiry);
  formData.append('fileToUpload', file);

  try {
    const response = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload server responded with status: ${response.status}`);
    }

    const text = await response.text();
    if (text.startsWith('http')) {
      return {
        success: true,
        url: text.trim(),
        expiry,
      };
    } else {
      throw new Error(text || 'Upload returned invalid response');
    }
  } catch (err: any) {
    console.error('Litterbox upload error:', err);
    return {
      success: false,
      error: err.message || 'Failed to upload to ephemeral storage. Try P2P mode or local stash.',
      expiry,
    };
  }
}
