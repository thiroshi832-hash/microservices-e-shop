import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { ordersApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Package, Calendar, ArrowRight } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Orders() {
  const { user } = useAuth();

  const { data: orders, isLoading, error } = useQuery(
    'user-orders',
    () => ordersApi.getUserOrders(user!.id),
    {
      enabled: !!user,
      select: (response) => response.data || [],
    }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

      {error ? (
        <div className="text-center py-12">
          <p className="text-red-600">Failed to load orders</p>
        </div>
      ) : orders?.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No orders yet
          </h2>
          <p className="text-gray-600 mb-6">
            Start shopping to see your orders here!
          </p>
          <Link
            to="/products"
            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
          >
            Browse Products
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders?.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center space-x-4">
                  {order.product.image ? (
                    <img
                      src={order.product.image}
                      alt={order.product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {order.product.name}
                    </h3>
                    <p className="text-sm text-gray-500">Quantity: {order.quantity}</p>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-2">
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary-600">
                      ${order.total.toFixed(2)}
                    </p>
                    <span
                      className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded-full ${
                        order.status === 'delivered'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : order.status === 'shipped'
                          ? 'bg-blue-100 text-blue-800'
                          : order.status === 'processing'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                  <Link
                    to={`/orders/${order.id}`}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
                  >
                    View Details
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
