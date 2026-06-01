import { Product } from './types';

// Default mock collections if localStorage is empty
const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    name: 'Royal Mahogany Sofa Set',
    price: 3200,
    oldPrice: 4500,
    category: 'Sofa',
    description: 'Immerse Yourself in ultimate luxury. Premium quality solid mahogany wood framed royal sofa with high-density plush comfort padding and luxurious upholstery.',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
    images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80'],
    isTrending: true
  },
  {
    id: 'prod_2',
    name: 'Premium King Size Bed',
    price: 4200,
    oldPrice: 5500,
    category: 'Bed',
    description: 'Beautifully crafted premium king-size bed made from season-treated premium Malaysian timber, offering durability and classic mid-century royalty design.',
    image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80',
    images: ['https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80'],
    isTrending: true
  },
  {
    id: 'prod_3',
    name: 'Classic Wooden Dinning Set',
    price: 2400,
    oldPrice: 3200,
    category: 'Dining',
    description: 'High polish mahogany wood dining table with 6 comfortable cushioned dining chairs. Resilien gloss lacquer shielding from food & drink spills.',
    image: 'https://images.unsplash.com/photo-1617806118233-18e1db207f62?auto=format&fit=crop&w=600&q=80',
    images: ['https://images.unsplash.com/photo-1617806118233-18e1db207f62?auto=format&fit=crop&w=600&q=80'],
    isTrending: false
  },
  {
    id: 'prod_4',
    name: 'Modern Wardrobe Cabinet',
    price: 1950,
    oldPrice: 2600,
    category: 'Wardrobe',
    description: 'An expansive three-door wardrobe cabinet. Comes with integrated inner drawers, hanging rails, and vanity mirror setup.',
    image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=600&q=80',
    images: ['https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=600&q=80'],
    isTrending: false
  },
  {
    id: 'prod_5',
    name: 'Cozy Retro Accent Chair',
    price: 850,
    oldPrice: 1200,
    category: 'Sofa',
    description: 'Add a vintage aesthetic touch to your reading lounge or study corner. Constructed from steam-bent Teak wood frame.',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80',
    images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80'],
    isTrending: true
  }
];

const DEFAULT_SLIDES = [
  {
    id: 'slide_1',
    title: 'Premium Handcrafted Furniture',
    subtitle: 'Elevate your living space with our luxurious, comfy collections.',
    bg: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'slide_2',
    title: 'Sustainable Wooden Designs',
    subtitle: 'Experience classic artistry combined with durable modern aesthetics.',
    bg: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'slide_3',
    title: 'Cozy Royal Sofa Set',
    subtitle: 'Designed for ultimate relaxation and supreme spinal comfort.',
    bg: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80'
  }
];

const DEFAULT_CATEGORIES = [
  { 
    id: 'cat_sofa', 
    name: 'Sofa', 
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80' 
  },
  { 
    id: 'cat_bed', 
    name: 'Bed', 
    image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=400&q=80' 
  },
  { 
    id: 'cat_dining', 
    name: 'Dining', 
    image: 'https://images.unsplash.com/photo-1617806118233-18e1db207f62?auto=format&fit=crop&w=400&q=80' 
  },
  { 
    id: 'cat_wardrobe', 
    name: 'Wardrobe', 
    image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=400&q=80' 
  }
];

const DEFAULT_USERS = {
  '01700555555': {
    name: 'RK Furniture Admin',
    email: 'admin@rkfurniture.com',
    password: 'rkfurniture0123'
  },
  '01700000000': {
    name: 'RK Furniture Admin',
    email: 'admin@rkfurniture.com',
    password: 'rkfurniture0123'
  }
};

const DEFAULT_SHIPPING_AREAS = [
  { id: 'ship_1', name: 'Dubai', charge: 30 },
  { id: 'ship_2', name: 'Abu Dhabi', charge: 50 },
  { id: 'ship_3', name: 'Sharjah & Ajman', charge: 40 },
  { id: 'ship_4', name: 'Other Emirates', charge: 60 }
];

// Global in-memory active sessions mapping
const activeSessions: { [id: string]: any } = {};

export function setupMockApiInterceptor() {
  const originalFetch = window.fetch;

  const mockFetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : (input instanceof URL ? input.href : (input as Request).url);
    const method = (init?.method || 'GET').toUpperCase();

    // Check if URL belongs to /api/
    if (url.includes('/api/')) {
      try {
        // Attempt actual API call
        const response = await originalFetch(input, init);
        const contentType = response.headers.get('content-type') || '';

        // If returned an HTML body (which means Netlify redirected 404 to index.html) or fails, fall back!
        if (response.ok && contentType.includes('application/json')) {
          const clone = response.clone();
          try {
            await clone.json();
            return response; // Successful parsed JSON
          } catch (e) {
            // Fails to parse as JSON (likely HTML) -> fallback
          }
        }

        if (!response.ok || contentType.includes('text/html')) {
          return await handleMockRequest(url, method, init);
        }

        return response;
      } catch (err) {
        // Network error/offline -> fallback
        return await handleMockRequest(url, method, init);
      }
    }

    return originalFetch(input, init);
  };

  try {
    window.fetch = mockFetch;
  } catch (e) {
    try {
      Object.defineProperty(window, 'fetch', {
        value: mockFetch,
        writable: true,
        configurable: true
      });
    } catch (err) {
      console.error('Failed to intercept fetch, API mocking may be partially limited:', err);
    }
  }
}

import { db } from './firebase';
import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  deleteDoc, 
  getDoc 
} from 'firebase/firestore';

// Helper to fetch collection directly from Firestore with fallback & seeding
async function getFirestoreCollection<T>(collectionName: string, defaultValue: T[]): Promise<T[]> {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    
    // Check if system has been seeded before
    const seedRef = doc(db, 'system_meta', 'seed_status');
    const seedSnap = await getDoc(seedRef);
    const isSeeded = seedSnap.exists() && seedSnap.data()?.seeded === true;

    if (!snapshot.empty) {
      const items: T[] = [];
      snapshot.forEach((d) => {
        items.push({ ...d.data() } as any);
      });
      // Sort collections if necessary
      if (collectionName === 'orders') {
        (items as any[]).sort((a, b) => {
          const idA = String(a.id || '');
          const idB = String(b.id || '');
          return idB.localeCompare(idA);
        });
      } else {
        (items as any[]).sort((a, b) => String(a.id || '').localeCompare(String(b.id || '')));
      }
      return items;
    } else {
      // Seed Firestore with default value only if the DB has NEVER been seeded before
      if (!isSeeded && defaultValue.length > 0) {
        for (const item of defaultValue) {
          const docId = String((item as any).id || (item as any).orderNumber || (item as any).name || 'gen_' + Math.random().toString(36).substring(2, 9));
          await setDoc(doc(db, collectionName, docId), item);
        }
        await setDoc(seedRef, { seeded: true });
        return defaultValue;
      }
      // If already seeded, returning empty list is correct (meaning the user cleared the collection)
      return [];
    }
  } catch (err) {
    console.warn(`[Firestore sync fallback] Failed for ${collectionName}:`, err);
    // Fallback to local storage
    const stored = localStorage.getItem(`netlify_${collectionName}`);
    if (stored) {
      try { return JSON.parse(stored); } catch { return defaultValue; }
    }
    return defaultValue;
  }
}

async function getFirestoreUsers(): Promise<{ [key: string]: any }> {
  try {
    const colRef = collection(db, 'users');
    const snapshot = await getDocs(colRef);
    
    const seedRef = doc(db, 'system_meta', 'seed_status');
    const seedSnap = await getDoc(seedRef);
    const isSeeded = seedSnap.exists() && seedSnap.data()?.seeded === true;

    const usersObj: { [key: string]: any } = {};
    if (!snapshot.empty) {
      snapshot.forEach((d) => {
        usersObj[d.id] = d.data();
      });
      return usersObj;
    } else {
      if (!isSeeded) {
        for (const phone in DEFAULT_USERS) {
          await setDoc(doc(db, 'users', phone), (DEFAULT_USERS as any)[phone]);
        }
        await setDoc(seedRef, { seeded: true });
        return DEFAULT_USERS;
      }
      return {};
    }
  } catch (err) {
    console.warn(`[Firestore users sync error]`, err);
    // Fallback to local storage
    const stored = localStorage.getItem('rk_registered_users');
    if (stored) {
      try { return JSON.parse(stored); } catch { return DEFAULT_USERS; }
    }
    return DEFAULT_USERS;
  }
}

async function saveFirestoreDoc(collectionName: string, docId: string, data: any) {
  try {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, data);
  } catch (err) {
    console.error(`[Firestore saveDoc error] ${collectionName}/${docId}:`, err);
  }
}

async function deleteFirestoreDoc(collectionName: string, docId: string) {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error(`[Firestore deleteDoc error] ${collectionName}/${docId}:`, err);
  }
}

async function handleMockRequest(url: string, method: string, init: RequestInit | undefined): Promise<Response> {
  // Extract route after "/api/"
  const parts = url.split('/api/');
  const path = parts[1]?.split('?')[0] || '';
  const pathParts = path.split('/');
  const resource = pathParts[0];
  const idValue = pathParts[1];

  let status = 200;
  let responseData: any = null;

  // 1. PRODUCTS
  if (resource === 'products') {
    const currentProducts = await getFirestoreCollection('products', DEFAULT_PRODUCTS);

    if (method === 'GET') {
      responseData = currentProducts;
    } else if (method === 'POST') {
      const payload = JSON.parse(init?.body as string);
      if (!payload.id) {
        payload.id = 'product_' + Date.now();
      }
      await saveFirestoreDoc('products', payload.id, payload);
      responseData = payload;
      status = 201;
    } else if (method === 'PUT' && idValue) {
      const payload = JSON.parse(init?.body as string);
      const idx = currentProducts.findIndex((p: any) => p.id === idValue);
      if (idx !== -1) {
        const updated = { ...currentProducts[idx], ...payload };
        await saveFirestoreDoc('products', idValue, updated);
        responseData = updated;
      } else {
        status = 404;
        responseData = { error: 'Product not found' };
      }
    } else if (method === 'DELETE' && idValue) {
      await deleteFirestoreDoc('products', idValue);
      responseData = { success: true, message: 'Product deleted' };
    }
  }

  // 2. SLIDES
  else if (resource === 'slides') {
    const currentSlides = await getFirestoreCollection('slides', DEFAULT_SLIDES);

    if (method === 'GET') {
      responseData = currentSlides;
    } else if (method === 'POST') {
      const payload = JSON.parse(init?.body as string);
      if (Array.isArray(payload)) {
        for (const slide of payload) {
          if (slide.id) {
            await saveFirestoreDoc('slides', slide.id, slide);
          }
        }
        // Properly cleanup deleted slides from Firestore
        try {
          const colRef = collection(db, 'slides');
          const snapshot = await getDocs(colRef);
          for (const dSnap of snapshot.docs) {
            if (!payload.some((s: any) => s.id === dSnap.id)) {
              await deleteDoc(dSnap.ref);
            }
          }
        } catch (err) {
          console.error('Mock Firestore slides cleanup error:', err);
        }
        responseData = { success: true, slides: payload };
      } else {
        status = 400;
        responseData = { error: 'Slides must be an array' };
      }
    }
  }

  // 3. CATEGORIES
  else if (resource === 'categories') {
    const currentCategories = await getFirestoreCollection('categories', DEFAULT_CATEGORIES);

    if (method === 'GET') {
      responseData = currentCategories;
    } else if (method === 'POST') {
      const payload = JSON.parse(init?.body as string);
      if (!payload.id) {
        payload.id = 'category_' + Date.now();
      }
      const existingIdx = currentCategories.findIndex((c: any) => c.name.toLowerCase() === payload.name.toLowerCase() || c.id === payload.id);
      let finalDoc = payload;
      if (existingIdx !== -1) {
        finalDoc = { ...currentCategories[existingIdx], ...payload };
      }
      await saveFirestoreDoc('categories', payload.id, finalDoc);
      responseData = finalDoc;
      status = 201;
    } else if (method === 'DELETE' && idValue) {
      await deleteFirestoreDoc('categories', idValue);
      responseData = { success: true, message: 'Category deleted' };
    }
  }

  // 3b. SHIPPING AREAS
  else if (resource === 'shipping-areas') {
    const currentAreas = await getFirestoreCollection('shipping_areas', DEFAULT_SHIPPING_AREAS);

    if (method === 'GET') {
      responseData = currentAreas;
    } else if (method === 'POST') {
      const payload = JSON.parse(init?.body as string);
      if (!payload.id) {
        payload.id = 'ship_' + Date.now();
      }
      payload.charge = Number(payload.charge);
      const existingIdx = currentAreas.findIndex((a: any) => a.id === payload.id || a.name.toLowerCase() === payload.name.toLowerCase());
      let finalDoc = payload;
      if (existingIdx !== -1) {
        finalDoc = { ...currentAreas[existingIdx], ...payload };
      }
      await saveFirestoreDoc('shipping_areas', payload.id, finalDoc);
      responseData = finalDoc;
      status = 201;
    } else if (method === 'DELETE' && idValue) {
      await deleteFirestoreDoc('shipping_areas', idValue);
      responseData = { success: true, message: 'Shipping area deleted' };
    }
  }

  // 4. ORDERS
  else if (resource === 'orders') {
    const currentOrders = await getFirestoreCollection('orders', []);

    if (method === 'GET') {
      responseData = currentOrders;
    } else if (method === 'POST') {
      const payload = JSON.parse(init?.body as string);
      const orderId = String(payload.id || 'order_' + Date.now());
      await saveFirestoreDoc('orders', orderId, payload);
      responseData = payload;
      status = 201;
    } else if (method === 'PUT' && idValue) {
      const payload = JSON.parse(init?.body as string);
      const idx = currentOrders.findIndex((o: any) => o.id === idValue);
      if (idx !== -1) {
        const updated = { ...currentOrders[idx], ...payload };
        await saveFirestoreDoc('orders', idValue, updated);
        responseData = updated;
      } else {
        status = 404;
        responseData = { error: 'Order not found' };
      }
    } else if (method === 'DELETE' && idValue) {
      await deleteFirestoreDoc('orders', idValue);
      responseData = { success: true, message: 'Order deleted successfully' };
    }
  }

  // 5. USERS
  else if (resource === 'users') {
    const currentUsers = await getFirestoreUsers();

    if (method === 'GET') {
      responseData = currentUsers;
    } else if (method === 'POST') {
      const { phone, userObj } = JSON.parse(init?.body as string);
      if (phone && userObj) {
        await saveFirestoreDoc('users', phone, userObj);
        responseData = { success: true, user: userObj };
      } else {
        status = 400;
        responseData = { error: 'Missing phone or userObj' };
      }
    }
  }

  // 6. SESSIONS
  else if (resource === 'sessions') {
    if (idValue === 'ping' && method === 'POST') {
      const { sessionId, deviceName, isAdmin, phone } = JSON.parse(init?.body as string);
      if (sessionId) {
        activeSessions[sessionId] = {
          sessionId,
          deviceName: deviceName || 'Unknown Device',
          isAdmin: !!isAdmin,
          phone: phone || '',
          lastSeen: Date.now()
        };
      }
      responseData = { success: true };
    } else if (idValue === 'active' && method === 'GET') {
      const now = Date.now();
      const list = Object.values(activeSessions).filter((s: any) => now - s.lastSeen < 45000);
      responseData = list;
    }
  }

  // Default response builder matching Response constructor properties
  const responseInit: ResponseInit = {
    status,
    statusText: status === 200 || status === 201 ? 'OK' : 'Error',
    headers: { 'Content-Type': 'application/json' }
  };

  return new Response(JSON.stringify(responseData), responseInit);
}
