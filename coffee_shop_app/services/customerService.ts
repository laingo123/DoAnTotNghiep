import { get, ref, update } from 'firebase/database';
import { fireBaseDB } from '@/config/firebaseConfig';
import { UserData } from './authService';

export type CustomerData = Omit<UserData, 'password'> & {
  id: string;
  isBlocked?: boolean;
};

export const fetchCustomers = async (): Promise<CustomerData[]> => {
  const snapshot = await get(ref(fireBaseDB, 'users'));
  const data = snapshot.val();
  if (!data) return [];

  return Object.entries(data)
    .map(([id, value]: [string, any]) => {
      const { password: _password, ...safeCustomer } = value;
      return { id, ...safeCustomer } as CustomerData;
    })
    .filter((customer) => customer.role === 'user')
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
};

export const setCustomerBlocked = async (customerId: string, isBlocked: boolean): Promise<void> => {
  if (!customerId) throw new Error('MISSING_CUSTOMER_ID');
  await update(ref(fireBaseDB, `users/${customerId}`), { isBlocked });
};
