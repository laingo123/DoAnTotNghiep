import { fireBaseDB } from '../config/firebaseConfig';
import { ref, push, get } from 'firebase/database';

export interface Review {
  productName: string;
  userEmail: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ReviewWithId extends Review {
  id: string;
}

const saveReview = async (review: Review): Promise<string> => {
  const reviewsRef = ref(fireBaseDB, 'reviews');
  const newRef = await push(reviewsRef, review);
  return newRef.key || '';
};

const fetchReviewsByProduct = async (productName: string): Promise<ReviewWithId[]> => {
  const reviewsRef = ref(fireBaseDB, 'reviews');
  const snapshot = await get(reviewsRef);
  const data = snapshot.val();

  const reviews: ReviewWithId[] = [];
  if (data) {
    for (const key in data) {
      if (data[key].productName === productName) {
        reviews.push({ id: key, ...data[key] });
      }
    }
  }

  reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return reviews;
};

export { saveReview, fetchReviewsByProduct };
