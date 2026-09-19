/**
 * Uploads a file (File object or base64 string) to Cloudinary.
 * Falls back to base64 if Cloudinary environment variables are not set.
 */
export async function uploadToCloudinary(fileOrBase64: File | string): Promise<string> {
  let cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  let uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  try {
    const rawData = localStorage.getItem('flatManagerData');
    if (rawData) {
      const parsed = JSON.parse(rawData);
      if (parsed?.flatInfo?.cloudinaryCloudName) {
        cloudName = parsed.flatInfo.cloudinaryCloudName;
      }
      if (parsed?.flatInfo?.cloudinaryUploadPreset) {
        uploadPreset = parsed.flatInfo.cloudinaryUploadPreset;
      }
    }
  } catch (e) {
    console.error('Error reading cloudinary config from localStorage', e);
  }

  // Fallback if not configured
  if (!cloudName || !uploadPreset) {
    console.warn("Cloudinary credentials are not set. Falling back to local Base64 string.");
    if (fileOrBase64 instanceof File) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(fileOrBase64);
      });
    }
    return fileOrBase64;
  }

  try {
    const formData = new FormData();
    formData.append('file', fileOrBase64);
    formData.append('upload_preset', uploadPreset);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData?.error?.message || 'Cloudinary upload failed');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    // Fallback to local Base64 so the user experience doesn't break
    if (fileOrBase64 instanceof File) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(fileOrBase64);
      });
    }
    return fileOrBase64;
  }
}

/**
 * Extracts the public_id from a Cloudinary URL.
 */
export function getPublicIdFromUrl(url: string): string | null {
  if (!url.includes('cloudinary.com')) return null;
  
  try {
    // Standard Cloudinary URL pattern: .../upload/v12345678/public_id.ext
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;
    
    // Everything after the version string (v12345678) until the extension
    const afterUpload = parts.slice(uploadIndex + 1);
    
    // If there's a version string, skip it
    let publicIdWithExt = '';
    if (afterUpload[0].startsWith('v') && !isNaN(Number(afterUpload[0].substring(1)))) {
      publicIdWithExt = afterUpload.slice(1).join('/');
    } else {
      publicIdWithExt = afterUpload.join('/');
    }
    
    // Remove extension
    return publicIdWithExt.split('.')[0];
  } catch (e) {
    return null;
  }
}

/**
 * Deletes a file from Cloudinary via the server-side proxy.
 */
export async function deleteFromCloudinary(url: string, resourceType: 'image' | 'video' = 'image'): Promise<boolean> {
  const publicId = getPublicIdFromUrl(url);
  if (!publicId) return false;

  let cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  let apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;
  let apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET;

  try {
    const rawData = localStorage.getItem('flatManagerData');
    if (rawData) {
      const parsed = JSON.parse(rawData);
      if (parsed?.flatInfo?.cloudinaryCloudName) cloudName = parsed.flatInfo.cloudinaryCloudName;
      if (parsed?.flatInfo?.cloudinaryApiKey) apiKey = parsed.flatInfo.cloudinaryApiKey;
      if (parsed?.flatInfo?.cloudinaryApiSecret) apiSecret = parsed.flatInfo.cloudinaryApiSecret;
    }
  } catch (e) {
    console.error('Error reading cloudinary config from localStorage', e);
  }

  if (!cloudName || !apiKey || !apiSecret) {
    console.warn("Cloudinary API credentials are not fully set. Skipping server-side deletion.");
    return false;
  }

  try {
    const response = await fetch('/api/cloudinary/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicId, cloudName, apiKey, apiSecret, resourceType }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Cloudinary deletion failed:', errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error calling deletion API:', error);
    return false;
  }
}
