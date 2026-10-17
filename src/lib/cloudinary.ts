/**
 * Uploads a file (File object or base64 string) to Cloudinary.
 * Falls back to base64 if Cloudinary environment variables are not set.
 */
export async function uploadToCloudinary(fileOrBase64: File | string): Promise<string> {
  // Helper to convert File to Base64
  const toBase64 = (file: File | string): Promise<string> => {
    if (typeof file === 'string') return Promise.resolve(file);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  let cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  let uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  try {
    const rawData = localStorage.getItem('flatManagerData');
    if (rawData) {
      const parsed = JSON.parse(rawData);
      if (parsed?.flatInfo?.cloudinaryCloudName) {
        cloudName = parsed.flatInfo.cloudinaryCloudName.trim();
      }
      if (parsed?.flatInfo?.cloudinaryUploadPreset) {
        uploadPreset = parsed.flatInfo.cloudinaryUploadPreset.trim();
      }
    }
  } catch (e) {
    console.error('Error reading cloudinary config from localStorage', e);
  }

  // Fallback to Base64 if Cloudinary credentials are missing or default empty
  if (!cloudName || !uploadPreset) {
    return toBase64(fileOrBase64);
  }

  try {
    const formData = new FormData();
    formData.append('file', fileOrBase64);
    formData.append('upload_preset', uploadPreset);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 second timeout

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      // Try swapped credentials attempt in case user entered Cloud Name and Upload Preset inverted
      try {
        const swappedForm = new FormData();
        swappedForm.append('file', fileOrBase64);
        swappedForm.append('upload_preset', cloudName);
        const swappedRes = await fetch(`https://api.cloudinary.com/v1_1/${uploadPreset}/auto/upload`, {
          method: 'POST',
          body: swappedForm
        });
        if (swappedRes.ok) {
          const swappedData = await swappedRes.json();
          if (swappedData?.secure_url) return swappedData.secure_url;
        }
      } catch (e) {
        // ignore swapped fallback error
      }

      const errorData = await response.json().catch(() => ({}));
      console.warn('Cloudinary upload notice (switching to Base64):', errorData?.error?.message || response.statusText);
      return toBase64(fileOrBase64);
    }

    const data = await response.json();
    if (data?.secure_url) {
      return data.secure_url;
    }
    return toBase64(fileOrBase64);
  } catch (error: any) {
    console.warn('Cloudinary upload notice (fallback applied):', error?.message || error);
    return toBase64(fileOrBase64);
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
      const errorData = await response.json().catch(() => ({}));
      console.warn('Cloudinary deletion notice:', errorData);
      return false;
    }

    return true;
  } catch (error: any) {
    console.warn('Notice calling deletion API:', error?.message || error);
    return false;
  }
}

/**
 * Tests Cloudinary connection credentials with a dry test.
 */
export async function testCloudinaryConnection(
  cloudName: string,
  uploadPreset?: string,
  apiKey?: string,
  apiSecret?: string
): Promise<{ success: boolean; message: string }> {
  if (!cloudName) {
    return { success: false, message: 'Cloud Name প্রদান করা হয়নি।' };
  }

  // If apiKey and apiSecret are provided, check via server-side verification endpoint
  if (apiKey && apiSecret) {
    try {
      const res = await fetch('/api/cloudinary/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cloudName, apiKey, apiSecret, uploadPreset })
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json().catch(() => ({}));
        if (data.success) {
          return { success: true, message: 'ক্লাউডিনারি সার্ভার ভেরিফিকেশন সফল হয়েছে! ✅' };
        }
      }
    } catch (e: any) {
      console.warn('Server test unavailable, falling back to client upload preset test:', e?.message || e);
    }
  }

  // Helper to construct a 1x1 PNG Blob for upload test
  const getTestBlob = () => {
    const byteCharacters = atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    return new Blob([new Uint8Array(byteNumbers)], { type: 'image/png' });
  };

  // If uploadPreset is provided, test unsigned upload endpoint
  if (uploadPreset) {
    try {
      const formData = new FormData();
      formData.append('file', getTestBlob(), 'test.png');
      formData.append('upload_preset', uploadPreset);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        return { success: true, message: 'ক্লাউডিনারি (Client Direct Upload) সফলভাবে সংযুক্ত ও ভেরিফাইড হয়েছে! ✅' };
      } else {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData?.error?.message || 'অজানা ত্রুটি';

        // Check if user swapped Cloud Name and Upload Preset
        try {
          const swappedForm = new FormData();
          swappedForm.append('file', getTestBlob(), 'test.png');
          swappedForm.append('upload_preset', cloudName);
          const swappedRes = await fetch(`https://api.cloudinary.com/v1_1/${uploadPreset}/auto/upload`, {
            method: 'POST',
            body: swappedForm
          });
          if (swappedRes.ok) {
            return {
              success: false,
              message: `⚠️ আপনি Cloud Name এবং Upload Preset উল্টো করে বসিয়েছেন! "Cloud Name" ঘরে "${uploadPreset}" এবং "Upload Preset" ঘরে "${cloudName}" বসিয়ে সংরক্ষণ করুন।`
            };
          }
        } catch (e) {
          // ignore swapped test errors
        }

        if (msg.includes('unsigned') || msg.includes('Unsigned')) {
          return { success: false, message: `Cloudinary ড্যাশবোর্ডে গিয়ে Upload Preset (${uploadPreset}) এর "Signing Mode" অবশ্যই 'Unsigned' সেট করুন।` };
        }

        if (msg.includes('Unknown API key') || msg.includes('Invalid cloud_name') || msg.includes('not found')) {
          return { success: false, message: `ক্লাউড নাম "${cloudName}" বা প্রিসেট "${uploadPreset}" সঠিক নয় (${msg})। Cloudinary ড্যাশবোর্ড থেকে সঠিক তথ্য বসান।` };
        }

        return { success: false, message: `আপলোড টেস্ট ব্যর্থ: ${msg}` };
      }
    } catch (err: any) {
      return { success: false, message: `সংযোগ ব্যর্থ: ${err?.message || 'ইন্টারনেট সমস্যা'}` };
    }
  }

  return { success: false, message: 'দয়া করে Upload Preset অথবা API Key & Secret প্রদান করুন।' };
}
