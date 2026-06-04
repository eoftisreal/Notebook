'use client';

import { Link } from 'react-router-dom';
import { useCartStore } from '@/store/cart';

type Props = {
  productId: string;
  title: string;
  price: number;
  image?: string;
};

export default function AddToCartButton({ productId, title, price, image }: Props) {
  const { addItem } = useCartStore();

  return (
    <Link
      to="/cart"
      onClick={() => {
        addItem({ productId, title, unitPrice: price, image });
      }}
      className="inline-block rounded-full bg-pink-600 px-6 py-3 font-semibold text-white"
    >
      Add to Cart
    </Link>
  );
}
