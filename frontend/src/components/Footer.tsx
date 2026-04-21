import { Link } from 'react-router-dom';
import { Store } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <Link to="/" className="flex items-center space-x-2">
              <Store className="h-8 w-8 text-primary-500" />
              <span className="text-xl font-bold text-white">MicroShop</span>
            </Link>
            <p className="mt-4 text-sm">
              Modern e-commerce platform built with microservices architecture.
              Secure, scalable, and reliable.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-white font-semibold mb-4">Shop</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/products" className="text-sm hover:text-white transition-colors">
                  All Products
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-white font-semibold mb-4">Account</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/orders" className="text-sm hover:text-white transition-colors">
                  My Orders
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-sm hover:text-white transition-colors">
                  Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Tech Stack */}
          <div>
            <h3 className="text-white font-semibold mb-4">Built With</h3>
            <ul className="space-y-2 text-sm">
              <li>Node.js + Express</li>
              <li>PostgreSQL + Redis</li>
              <li>Docker + React</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} MicroShop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
