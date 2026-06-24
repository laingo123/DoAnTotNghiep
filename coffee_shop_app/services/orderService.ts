import { fireBaseDB } from '../config/firebaseConfig';
import { ref, push, get, set } from 'firebase/database';

export interface OrderItem {
  item_id?: string;
  order_id?: string;
  product_id: string;
  quantity: number;
  size: string;
  price: number;
  name?: string;
}

export interface Order {
  items: OrderItem[];
  totalPrice: number;
  paymentMethod: string;
  createdAt: string;
  status: string;
  user_id?: string;
  userEmail?: string;
  deliveryType?: string;
  deliveryAddress?: string;
  deliveryPhone?: string;
  deliveryNote?: string;
  distance?: number;
  duration?: number;
  userCoords?: { latitude: number; longitude: number };
}

export interface OrderWithId extends Order {
  id: string;
}

const saveOrder = async (order: Order): Promise<string> => {
  const ordersRef = ref(fireBaseDB, 'orders');
  const newOrderRef = push(ordersRef);
  const order_id = newOrderRef.key || '';
  const normalizedItems = order.items.map((item, index) => ({
    ...item,
    item_id: item.item_id || `${order_id}_item_${index + 1}`,
    order_id,
  }));

  await set(newOrderRef, {
    ...order,
    order_id,
    items: normalizedItems,
  });

  return order_id;
};

const fetchOrdersByUser = async (userId: string, email?: string): Promise<OrderWithId[]> => {
  const ordersRef = ref(fireBaseDB, 'orders');
  const snapshot = await get(ordersRef);
  const data = snapshot.val();
  
  const orders: OrderWithId[] = [];
  if (data) {
    for (const key in data) {
      if (data[key].user_id === userId || (email && data[key].userEmail === email)) {
        orders.push({ id: key, ...data[key] });
      }
    }
  }
  
  // Sắp xếp theo thời gian mới nhất
  orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return orders;
};

const fetchAllOrders = async (): Promise<OrderWithId[]> => {
  const ordersRef = ref(fireBaseDB, 'orders');
  const snapshot = await get(ordersRef);
  const data = snapshot.val();
  
  const orders: OrderWithId[] = [];
  if (data) {
    for (const key in data) {
      orders.push({ id: key, ...data[key] });
    }
  }
  
  orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return orders;
};

export { saveOrder, fetchOrdersByUser, fetchAllOrders };
