import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { productsApi } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { ShoppingCart, ArrowLeft, Package } from 'lucide-react';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { useState } from 'react';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading, error } = useQuery(
    ['product', id],
    () => productsApi.getById(Number(id)),
    {
      enabled: !!id,
      select: (response) => response.data,
    }
  );

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
      toast.success(`${product.name} added to cart!`);
      navigate('/cart');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-red-600 mb-4">Product not found</p>
        <Link
          to="/products"
          className="text-primary-600 hover:text-primary-700 flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <Link
          to="/products"
          className="text-primary-600 hover:text-primary-700 flex items-center text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Link>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Image */}
        <div className="aspect-w-1 aspect-h-1 bg-gray-100 rounded-lg overflow-hidden">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-96 lg:h-full object-cover"
            />
          ) : (
            <div className="w-full h-96 lg:h-full bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
              <Package className="h-32 w-32 text-primary-300" />
            </div>
          )}
        </div>

        {/* Product Details */}
        <div>
          {product.category && (
            <span className="inline-block bg-primary-100 text-primary-700 text-sm px-3 py-1 rounded-full mb-4">
              {product.category}
            </span>
          )}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {product.name}
          </h1>

          <div className="mb-6">
            <span className="text-4xl font-bold text-primary-600">
              ${product.price.toFixed(2)}
            </span>
          </div>

          <p className="text-gray-600 mb-8 leading-relaxed">
            {product.description || 'No description available for this product.'}
          </p>

          {product.stock !== undefined && (
            <p className="text-sm text-gray-500 mb-6">
              {product.stock > 0 ? (
                <span className="text-green-600">{product.stock} in stock</span>
              ) : (
                <span className="text-red-600">Out of stock</span>
              )}
            </p>
          )}

          {/* Quantity Selector */}
          <div className="flex items-center space-x-4 mb-6">
            <label className="text-sm font-medium text-gray-700">Quantity:</label>
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                -
              </button>
              <span className="px-4 py-2 font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="w-full md:w-auto flex items-center justify-center space-x-2 px-8 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="h-5 w-5" />
            <span>Add to Cart</span>
          </button>

          {/* Product Info */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Product Details</h3>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Product ID</dt>
                <dd className="font-medium text-gray-900">#{product.id}</dd>
              </div>
              {product.category && (
                <div>
                  <dt className="text-gray-500">Category</dt>
                  <dd className="font-medium text-gray-900">{product.category}</dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500">Price</dt>
                <dd className="font-medium text-gray-900">${product.price.toFixed(2)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Availability</dt>
                <dd className="font-medium text-gray-900">
                  {product.stock !== undefined
                    ? product.stock > 0
                      ? 'In Stock'
                      : 'Out of Stock'
                    : 'Unknown'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
