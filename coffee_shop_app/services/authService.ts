import { fireBaseDB } from '../config/firebaseConfig';
import { ref, get, push, update } from 'firebase/database';

export interface UserData {
  id?: string;
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  phone?: string;
  gender?: string;
  birthday?: string;
  location?: string;
  avatarUrl?: string;
  isBlocked?: boolean;
}

export type UserProfileInput = Pick<UserData, 'name' | 'phone' | 'gender' | 'birthday' | 'location' | 'avatarUrl'>;

// Đăng nhập: tìm user theo email và kiểm tra password
export const loginUser = async (email: string, password: string): Promise<UserData> => {
  const usersRef = ref(fireBaseDB, 'users');
  const snapshot = await get(usersRef);
  const data = snapshot.val();

  if (!data) {
    throw new Error('USER_NOT_FOUND');
  }

  for (const key in data) {
    if (data[key].email === email) {
      if (data[key].isBlocked) {
        throw new Error('ACCOUNT_BLOCKED');
      }
      if (data[key].password === password) {
        return { ...data[key], id: key };
      } else {
        throw new Error('WRONG_PASSWORD');
      }
    }
  }

  throw new Error('USER_NOT_FOUND');
};

// Đăng ký: kiểm tra email trùng, tạo user mới với role "user"
export const registerUser = async (name: string, email: string, password: string): Promise<UserData> => {
  // Kiểm tra email đã tồn tại chưa
  const usersRef = ref(fireBaseDB, 'users');
  const snapshot = await get(usersRef);
  const data = snapshot.val();

  if (data) {
    for (const key in data) {
      if (data[key].email === email) {
        throw new Error('EMAIL_EXISTS');
      }
    }
  }

  // Tạo user mới
  const newUser: Omit<UserData, 'id'> = {
    name,
    email,
    password,
    role: 'user',
  };

  const newUserRef = await push(usersRef, newUser);
  return { ...newUser, id: newUserRef.key || '' };
};

export const updateUserProfile = async (userId: string, profile: UserProfileInput): Promise<void> => {
  if (!userId) throw new Error('MISSING_USER_ID');

  await update(ref(fireBaseDB, `users/${userId}`), profile);
};
