import { fireBaseDB } from '../config/firebaseConfig';
import { Product } from '../types/types';
import { ref, get, push, set, update, remove } from 'firebase/database';

const productsRef = ref(fireBaseDB, 'products');

const fetchProducts = async (): Promise<Product[]> => {
  const snapshot = await get(productsRef);
  const data = snapshot.val();
  
  const products: Product[] = [];
  if (data) {
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        products.push({ ...data[key], id: key });
      }
    }
  }
  
  return products;
};

export type ProductInput = Omit<Product, 'id'>;

const addProduct = async (product: ProductInput): Promise<string> => {
  const newProductRef = push(productsRef);
  const id = newProductRef.key || '';
  await set(newProductRef, { id, ...product });
  return id;
};

const updateProduct = async (productId: string, product: ProductInput): Promise<void> => {
  if (!productId) throw new Error('Missing product id');
  await update(ref(fireBaseDB, `products/${productId}`), { id: productId, ...product });
};

const deleteProduct = async (productId: string): Promise<void> => {
  if (!productId) throw new Error('Missing product id');
  await remove(ref(fireBaseDB, `products/${productId}`));
};

export { fetchProducts, addProduct, updateProduct, deleteProduct };
