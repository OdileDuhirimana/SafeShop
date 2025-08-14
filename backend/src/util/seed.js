import Product from '../models/Product.js';

export async function seedProducts() {
  const count = await Product.countDocuments();
  if (count > 0) return;
  await Product.insertMany([
    { title: 'Smartphone X', description: 'Great phone', price: 699, images: [], category: 'Electronics', rating: 4.5, stock: 20 },
    { title: 'Wireless Headphones', description: 'Noise cancelling', price: 199, images: [], category: 'Electronics', rating: 4.2, stock: 50 },
    { title: 'Running Shoes', description: 'Comfortable', price: 89, images: [], category: 'Sports', rating: 4.0, stock: 100 },
  ]);
}
