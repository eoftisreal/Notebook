const apiBase = import.meta.env.VITE_API_URL || '/api';

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return response.json();
}


export async function apiPost<T>(path: string, body: any): Promise<T> {
  const token = localStorage.getItem('kapdakraft_token'); // from getAuthToken logic normally
  const response = await fetch(`${apiBase}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API request failed: ${response.status}`);
  }
  return response.json();
}

export type Product = {
  _id: string;
  title: string;
  description: string;
  artistName: string;
  category: string;
  images: string[];
  price: number;
  compareAtPrice?: number;
  stock: number;
  isFeatured?: boolean;
  isCustomizable?: boolean;
  minDeliveryDays?: number;
  maxDeliveryDays?: number;
  tags?: string[];
};
