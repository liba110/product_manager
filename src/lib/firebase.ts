import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDocs, setDoc, deleteDoc, updateDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { TaskCategory } from './productTemplates';

// Firebase configuration - you'll need to replace these with your actual Firebase config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "your-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export interface FirebaseProduct {
  id: string;
  name: string;
  image: string | null;
  categories: TaskCategory[];
  createdAt: string;
  updatedAt: string;
  userId?: string;
}

// Products collection reference
const productsCollection = collection(db, 'products');

// Create or update a product
export const saveProductToFirebase = async (product: Omit<FirebaseProduct, 'id'> & { id?: string }): Promise<FirebaseProduct> => {
  const productId = product.id || `product-${Date.now()}`;
  const productData: FirebaseProduct = {
    ...product,
    id: productId,
    updatedAt: new Date().toISOString()
  };

  await setDoc(doc(productsCollection, productId), productData);
  return productData;
};

// Get all products
export const getProductsFromFirebase = async (): Promise<FirebaseProduct[]> => {
  const q = query(productsCollection, orderBy('updatedAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as FirebaseProduct);
};

// Delete a product
export const deleteProductFromFirebase = async (productId: string): Promise<void> => {
  await deleteDoc(doc(productsCollection, productId));
};

// Listen to real-time updates
export const subscribeToProducts = (callback: (products: FirebaseProduct[]) => void) => {
  const q = query(productsCollection, orderBy('updatedAt', 'desc'));
  return onSnapshot(q, (querySnapshot) => {
    const products = querySnapshot.docs.map(doc => doc.data() as FirebaseProduct);
    callback(products);
  });
};

// Check if Firebase is configured
export const isFirebaseConfigured = (): boolean => {
  return firebaseConfig.apiKey !== "your-api-key" && 
         firebaseConfig.projectId !== "your-project-id";
};