module.exports = {
  validateUserRegistration: (user) => {
    const errors = [];
    if (!user.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
      errors.push('Valid email is required');
    }
    if (!user.password || user.password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }
    if (!user.name || user.name.trim().length === 0) {
      errors.push('Name is required');
    }
    return errors;
  },
  validateProduct: (product) => {
    const errors = [];
    if (!product.name || product.name.trim().length === 0) {
      errors.push('Product name is required');
    }
    if (!product.price || isNaN(product.price) || product.price <= 0) {
      errors.push('Valid price is required');
    }
    return errors;
  },
  validateOrder: (order) => {
    const errors = [];
    if (!order.userId) {
      errors.push('User ID is required');
    }
    if (!order.productId) {
      errors.push('Product ID is required');
    }
    return errors;
  }
};
