'use client';

import { Link } from 'react-router-dom';
import { addCartItem } from '@/lib/storage';

type Props = {
  productId: string;
  title: string;
  price: number;
};

export default function AddToCartButton({ productId, title, price }: Props) {
  return (
    <Link
      to="/cart"
      onClick={() => {
        addCartItem({ productId, title, unitPrice: price });
      }}
      className="inline-block rounded-full bg-pink-600 px-6 py-3 font-semibold text-white"
    >
      Add to Cart
    </Link>
  );
}
