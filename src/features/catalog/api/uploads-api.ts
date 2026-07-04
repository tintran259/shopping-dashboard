import { apiClient } from '@/lib/api-client';

export const uploadsApi = {
  /** [admin] Upload images (multipart) → absolute URLs served at /uploads/*. */
  upload: (files: File[]) => {
    const fd = new FormData();
    for (const f of files) fd.append('files', f);
    return apiClient.post<{ urls: string[] }>('/admin/uploads', fd, {
      // Let the browser set multipart/form-data with the boundary.
      headers: { 'Content-Type': undefined as unknown as string },
    });
  },
};
