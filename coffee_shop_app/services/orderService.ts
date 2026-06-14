import { fireBaseDB } from '../config/firebaseConfig';
import { ref, push, get, query, orderByChild, equalTo } from 'firebase/database';

export interface OrderItem {
  name: string;
  quantity: number;
}

export interface Order {
  items: OrderItem[];
  totalPrice: number;
  paymentMethod: string;
  createdAt: string;
  status: string;
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
  const newOrderRef = await push(ordersRef, order);
  return newOrderRef.key || '';
};

const fetchOrdersByUser = async (email: string): Promise<OrderWithId[]> => {
  const ordersRef = ref(fireBaseDB, 'orders');
  const snapshot = await get(ordersRef);
  const data = snapshot.val();
  
  const orders: OrderWithId[] = [];
  if (data) {
    for (const key in data) {
      if (data[key].userEmail === email) {
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
