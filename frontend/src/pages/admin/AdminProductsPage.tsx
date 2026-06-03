import ProductForm from '@/components/ProductForm';
import AdminProductList from '@/components/AdminProductList';

export default function AdminProductsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black">Manage Products</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 items-start">
        <div>
          <ProductForm />
        </div>
        <div>
          <AdminProductList />
        </div>
      </div>
    </div>
  );
}
