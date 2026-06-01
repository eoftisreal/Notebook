'use client';

import { FormEvent, useState } from 'react';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export default function MediaUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();

    if (!file) {
      setMessage('Please select a file to upload');
      return;
    }

    setLoading(true);
    setMessage('Uploading to Cloudflare R2...');
    setUploadedUrl('');

    try {
      // In a real app, you would get this from a proper context or secure storage
      const token = localStorage.getItem('token');

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${apiBase}/admin/upload`, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData,
      });

      const body = await response.json();

      if (response.ok) {
        setMessage('Upload successful!');
        setUploadedUrl(body.url);
        setFile(null);
      } else {
        setMessage(body.message || 'Failed to upload file');
      }
    } catch {
      setMessage('Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl bg-white p-4 shadow">
      <h2 className="font-bold">Media Upload</h2>
      <p className="text-sm text-slate-600 mb-4">Upload images to Cloudflare R2.</p>

      <form onSubmit={submit} className="space-y-3">
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-brand-purple/10 file:text-brand-purple hover:file:bg-brand-purple/20"
          />
        </div>

        <button
          disabled={!file || loading}
          className="w-full rounded bg-brand-purple hover:bg-brand-pink px-4 py-2 font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Uploading...' : 'Upload Image'}
        </button>
      </form>

      {message && (
        <p className={`mt-3 text-sm ${uploadedUrl ? 'text-green-600' : 'text-slate-600'}`}>
          {message}
        </p>
      )}

      {uploadedUrl && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-mono bg-slate-100 p-2 rounded break-all">
            {uploadedUrl}
          </p>
          {}
          <img src={uploadedUrl} alt="Uploaded" className="max-h-48 rounded object-cover border" />
        </div>
      )}
    </div>
  );
}
