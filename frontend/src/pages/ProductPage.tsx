import { useParams } from 'react-router-dom';
import ProductDetailClient from './product-detail-client';

export default function ProductDetailPage() {
  const { id } = useParams();
  if (!id) return <p>Invalid product</p>;
  return <ProductDetailClient id={id} />;
}
