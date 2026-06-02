import ProductForm from '@/components/ProductForm';
import MediaUpload from '@/components/MediaUpload';

export default function AdminProductsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black">Manage Products</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start">
        <div className="lg:col-span-2">
          <ProductForm />
        </div>
        <div>
          <MediaUpload />
        </div>
      </div>
    </div>
  );
}
