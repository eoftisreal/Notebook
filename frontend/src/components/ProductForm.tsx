'use client';

import { FormEvent, useState, useEffect } from 'react';
import { getAuthToken } from '@/lib/storage';

const apiBase = import.meta.env.VITE_API_URL || '/api';

export default function ProductForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [artistName, setArtistName] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState(0);

  const [categories, setCategories] = useState<{_id: string, name: string}[]>([]);
  const [brands, setBrands] = useState<{_id: string, name: string}[]>([]);

  useEffect(() => {
    async function fetchOptions() {
      try {
        const token = getAuthToken();
        const headers = { 'Authorization': `Bearer ${token}` };

        const [catsRes, brsRes] = await Promise.all([
          fetch(`${apiBase}/master/categories`, { headers }),
          fetch(`${apiBase}/master/brands`, { headers })
        ]);

        if (catsRes.ok) setCategories(await catsRes.json());
        if (brsRes.ok) setBrands(await brsRes.json());
      } catch (e) {
        console.error('Error fetching categories/brands', e);
      }
    }
    fetchOptions();
  }, []);
  const [stock, setStock] = useState(0);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [r2Key, setR2Key] = useState('');

  async function handleImageUpload(e: FormEvent) {
    e.preventDefault();
    if (!file) return;

    setUploadingImage(true);
    const token = getAuthToken();

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${apiBase}/admin/upload`, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData,
      });

      const body = await res.json();
      if (res.ok) {
        setUploadedUrl(body.url);
        setR2Key(body.key);
        setFile(null);
      } else {
        setMessage(body.message || 'Image upload failed');
      }
    } catch {
      setMessage('Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  }

  async function submitProduct(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = getAuthToken();
      const payload = {
        title,
        description,
        artistName,
        category,
        brand: brand || undefined,
        price,
        stock,
        images: uploadedUrl ? [uploadedUrl] : [],
        r2ImageKeys: r2Key ? [r2Key] : []
      };

      const response = await fetch(`${apiBase}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload),
      });

      const body = await response.json();
      if (response.ok) {
        setMessage('Product created successfully!');
        setTitle('');
        setDescription('');
        setArtistName('');
        setCategory('');
        setBrand('');
        setPrice(0);
        setStock(0);
        setUploadedUrl('');
        setR2Key('');
      } else {
        setMessage(body.message || 'Failed to create product');
      }
    } catch {
      setMessage('Failed to create product');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow space-y-6">
      <h2 className="font-bold text-xl border-b pb-2">Add New Product</h2>

      {/* Image Upload Section */}
      <div className="space-y-2 border-b pb-4">
        <h3 className="font-semibold">1. Upload Product Image (Optional)</h3>
        <div className="flex gap-2 items-center">
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            className="text-sm text-slate-500 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-brand-purple/10 file:text-brand-purple hover:file:bg-brand-purple/20"
          />
          <button
            type="button"
            onClick={handleImageUpload}
            disabled={!file || uploadingImage}
            className="rounded bg-brand-purple hover:bg-brand-pink px-3 py-1 text-sm font-semibold text-white disabled:opacity-50"
          >
            {uploadingImage ? 'Uploading...' : 'Upload Image'}
          </button>
        </div>
        {uploadedUrl && (
          <div className="mt-2">
            <p className="text-xs text-green-600 mb-1">Image uploaded successfully!</p>
            {}
            <img src={uploadedUrl} alt="Uploaded preview" className="max-h-32 rounded object-cover border" />
          </div>
        )}
      </div>

      {/* Product Form Section */}
      <form onSubmit={submitProduct} className="space-y-4">
        <h3 className="font-semibold">2. Product Details</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1 w-full rounded border px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Artist Name</label>
          <input type="text" required value={artistName} onChange={e => setArtistName(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select required value={category} onChange={e => setCategory(e.target.value)} className="mt-1 w-full rounded border px-3 py-2">
              <option value="">Select a category</option>
              {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Brand (Optional)</label>
            <select value={brand} onChange={e => setBrand(e.target.value)} className="mt-1 w-full rounded border px-3 py-2">
              <option value="">None / Unknown</option>
              {brands.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Price</label>
            <input type="number" required min="0" value={price} onChange={e => setPrice(Number(e.target.value))} className="mt-1 w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Stock</label>
            <input type="number" required min="0" value={stock} onChange={e => setStock(Number(e.target.value))} className="mt-1 w-full rounded border px-3 py-2" />
          </div>
        </div>

        <button disabled={loading} className="w-full rounded bg-brand-purple hover:bg-brand-pink px-4 py-2 font-semibold text-white disabled:opacity-50">
          {loading ? 'Creating Product...' : 'Create Product'}
        </button>
      </form>

      {message && <p className="mt-3 text-sm text-center font-medium">{message}</p>}
    </div>
  );
}
