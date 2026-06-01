import ProductDetailClient from './product-detail-client';

export function generateStaticParams() {
  return [{ id: 'demo-product' }];
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  return <ProductDetailClient id={params.id} />;
}
