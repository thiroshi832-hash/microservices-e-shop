import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { ordersApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Package, Calendar, MapPin, CreditCard, ArrowLeft } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const { data: order, isLoading, error } = useQuery(
    ['order', id],
    () => ordersApi.getById(Number(id)),
    {
      enabled: !!id,
      select: (response) => response.data,
    }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Order not found</h2>
          <Link
            to="/orders"
            className="text-primary-600 hover:text-primary-700 flex items-center justify-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/orders"
        className="text-primary-600 hover:text-primary-700 flex items-center mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Orders
      </Link>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-primary-600 text-white px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h1 className="text-2xl font-bold">Order #{order.id}</h1>
              <p className="text-primary-100 text-sm">
                Placed on {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                order.status === 'delivered'
                  ? 'bg-green-500 text-white'
                  : order.status === 'cancelled'
                  ? 'bg-red-500 text-white'
                  : order.status === 'shipped'
                  ? 'bg-blue-500 text-white'
                  : order.status === 'processing'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-500 text-white'
              }`}
            >
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Product Details */}
            <div className="lg:col-span-2">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Order Items
              </h2>

              <div className="border rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-4">
                  {order.product.image ? (
                    <img
                      src={order.product.image}
                      alt={order.product.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package className="h-10 w-10 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{order.product.name}</h3>
                    <p className="text-gray-600">Quantity: {order.quantity}</p>
                    <p className="text-primary-600 font-bold mt-1">
                      ${order.total.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Timeline (simplified) */}
              <div className="border-l-2 border-primary-200 pl-4 ml-2 space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Order Placed</p>
                  <p className="font-medium">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                {order.status !== 'pending' && (
                  <div>
                    <p className="text-sm text-gray-500">Status Updated</p>
                    <p className="font-medium">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Order Summary
                </h2>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">${order.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium text-green-600">Free</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-lg font-bold text-primary-600">
                      ${order.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="mt-6 bg-gray-50 rounded-lg p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Shipping Address
                </h2>
                <p className="text-gray-600">
                  {order.user.name}<br />
                  Demo address would appear here<br />
                  City, Country, ZIP
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
