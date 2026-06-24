import { fireBaseDB } from '../config/firebaseConfig';
import { ref, push, get } from 'firebase/database';

export interface Review {
  product_id: string;
  user_id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  productName?: string;
  userEmail?: string;
}

export interface ReviewWithId extends Review {
  id: string;
}

const saveReview = async (review: Review): Promise<string> => {
  const reviewsRef = ref(fireBaseDB, 'reviews');
  const newRef = await push(reviewsRef, review);
  return newRef.key || '';
};

const fetchReviewsByProduct = async (productId: string, productName?: string): Promise<ReviewWithId[]> => {
  const reviewsRef = ref(fireBaseDB, 'reviews');
  const snapshot = await get(reviewsRef);
  const data = snapshot.val();

  const reviews: ReviewWithId[] = [];
  if (data) {
    for (const key in data) {
      if (data[key].product_id === productId || (productName && data[key].productName === productName)) {
        reviews.push({ id: key, ...data[key] });
      }
    }
  }

  reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return reviews;
};

export { saveReview, fetchReviewsByProduct };
