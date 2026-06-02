import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  deleteDoc 
} from 'firebase/firestore';
import compression from 'compression';

const app = express();
const PORT = 3000;

app.use(compression());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Firebase credentials matching client config to integrate persistent Firestore db
const defaultFirebaseConfig = {
  apiKey: "AIzaSyDfuSipIqlV69-bzFg24F52DLf6GR7PYwQ",
  authDomain: "rk-furniture-e0b7e.firebaseapp.com",
  projectId: "rk-furniture-e0b7e",
  storageBucket: "rk-furniture-e0b7e.firebasestorage.app",
  messagingSenderId: "396188287069",
  appId: "1:396188287069:web:bb1150bb693cd6b72c8db4",
  measurementId: "G-7V079KPE44"
};

const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
let firebaseConfig: any = defaultFirebaseConfig;
if (fs.existsSync(configPath)) {
  try {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    console.log('[Firebase config loaded from platform]', firebaseConfig.projectId);
  } catch (error) {
    console.error('Failed to parse firebase-applet-config.json:', error);
  }
}

const firebaseApp = initializeApp(firebaseConfig);
const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId)
  : getFirestore(firebaseApp);

// JSON Local Persistence DB Paths
const PRODUCTS_DB_PATH = path.join(process.cwd(), 'db_products.json');
const ORDERS_DB_PATH = path.join(process.cwd(), 'db_orders.json');
const USERS_DB_PATH = path.join(process.cwd(), 'db_users.json');
const SLIDES_DB_PATH = path.join(process.cwd(), 'db_slides.json');
const CATEGORIES_DB_PATH = path.join(process.cwd(), 'db_categories.json');
const SHIPPING_AREAS_DB_PATH = path.join(process.cwd(), 'db_shipping_areas.json');
const STORE_CONTACT_DB_PATH = path.join(process.cwd(), 'db_store_contact.json');
const COUPONS_DB_PATH = path.join(process.cwd(), 'db_coupons.json');
const SHOP_POLICIES_DB_PATH = path.join(process.cwd(), 'db_shop_policies.json');

const INITIAL_STORE_CONTACT = [
  {
    id: 'contact_info',
    phone: '01715838191',
    whatsappUrl: 'https://wa.me/8801715838191',
    hours: 'Available 24/7 for support'
  }
];

const INITIAL_COUPONS = [
  { id: 'coupon_1', code: 'RK10', discountPercent: 10, description: '10% OFF Discount Coupon', isActive: true },
  { id: 'coupon_2', code: 'SUPER20', discountPercent: 20, description: 'Super 20% discount coupon', isActive: true },
  { id: 'coupon_3', code: 'EID30', discountPercent: 30, description: 'Eid Special 30% discount coupon', isActive: true }
];

const INITIAL_SHOP_POLICIES = [
  {
    id: 'policies',
    aboutUs: 'RK Furniture is a premium furniture provider based in Dubai, UAE, offering high-quality design elements.',
    privacyPolicy: 'We respect your privacy. All customer data remains strictly confidential and secure.',
    termsConditions: 'Standard service terms apply. Delivery details and times are calculated custom for each zone.',
    refundPolicy: 'Refunds are managed based on specific defect reviews within 7 days of package delivery.',
    cancelationPolicy: 'Orders may be cancelled within 12 hours. Returns may attract standard logistics costs.'
  }
];

// Helper function to read/write JSON databases
function readJSONFile(filePath: string, defaultValue: any) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
  }
  return defaultValue;
}

function writeJSONFile(filePath: string, data: any) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error);
  }
}

// Global in-memory registry for active sessions
interface ActiveSession {
  sessionId: string;
  deviceName: string;
  isAdmin: boolean;
  phone?: string;
  lastSeen: number;
}
const activeSessions: { [sessionId: string]: ActiveSession } = {};

// Clean up expired sessions (older than 20 seconds) every 10 seconds
setInterval(() => {
  const now = Date.now();
  for (const sessionId in activeSessions) {
    if (now - activeSessions[sessionId].lastSeen > 20000) {
      delete activeSessions[sessionId];
    }
  }
}, 10000);

// In-Memory cache for all collections to ensure instant page loads
const memoryCache: { [collectionName: string]: any[] } = {};
let usersCache: { [phone: string]: any } | null = null;
const syncedCollections: { [key: string]: boolean } = {};
let hasUsersSynced = false;

// Background fetch and sync routine for collections
async function syncCollectionWithFirestoreInBackground(collectionName: string, localFilePath: string, defaultValue: any[]) {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    const localData = readJSONFile(localFilePath, defaultValue) as any[];
    
    if (!snapshot.empty) {
      const firestoreItems: any[] = [];
      snapshot.forEach((d) => {
        const item = d.data() as any;
        if (item && !item.id) {
          item.id = d.id;
        }
        firestoreItems.push(item);
      });
      
      // Bidirectional Safe Merge: Keep local items that are NOT in Firestore, and auto-seed them
      const mergedItems = [...firestoreItems];
      for (const localItem of localData) {
        if (localItem && localItem.id) {
          const alreadyInFirestore = firestoreItems.some(
            (f) => String(f.id) === String(localItem.id)
          );
          if (!alreadyInFirestore) {
            mergedItems.push(localItem);
            const docId = String(localItem.id);
            setDoc(doc(db, collectionName, docId), localItem).catch((err) => {
              console.error(`[Background Seed Error] for ${collectionName}/${docId}:`, err);
            });
          }
        }
      }
      
      // Ensure collections stay sorted
      if (collectionName === 'orders') {
        mergedItems.sort((a, b) => {
          const idA = String(a.id || '');
          const idB = String(b.id || '');
          return idB.localeCompare(idA);
        });
      } else {
        mergedItems.sort((a, b) => String(a.id || '').localeCompare(String(b.id || '')));
      }

      // Refresh cache and local file
      memoryCache[collectionName] = mergedItems;
      writeJSONFile(localFilePath, mergedItems);
      console.log(`[Background Sync Success] Synced ${collectionName}. Data count: ${mergedItems.length}`);
    } else {
      // If Firestore is empty, seed from local JSON in background
      if (Array.isArray(localData) && localData.length > 0) {
        console.log(`[Background Firestore Seed] Seeding collection: ${collectionName} with ${localData.length} records`);
        for (const item of localData) {
          if (item) {
            const docId = String(item.id || item.orderNumber || item.name || Math.random());
            setDoc(doc(db, collectionName, docId), item).catch((err) => {
              console.error(`[Background Seed Error] for ${collectionName}/${docId}:`, err);
            });
          }
        }
      }
    }
  } catch (error) {
    console.warn(`[Background Firestore Sync Warning] Failed to fetch collection ${collectionName} in background:`, error);
  }
}

// Background users sync routine
async function syncUsersWithFirestoreInBackground() {
  try {
    const colRef = collection(db, 'users');
    const snapshot = await getDocs(colRef);
    const localUsers = readJSONFile(USERS_DB_PATH, {});
    
    if (!snapshot.empty) {
      const usersObj: { [key: string]: any } = {};
      snapshot.forEach((d) => {
        usersObj[d.id] = d.data();
      });
      
      // Merge local users who are not in Firestore
      const mergedUsers = { ...usersObj };
      for (const phone in localUsers) {
        if (!mergedUsers[phone]) {
          mergedUsers[phone] = localUsers[phone];
          setDoc(doc(db, 'users', phone), localUsers[phone]).catch(() => {});
        }
      }
      
      usersCache = mergedUsers;
      writeJSONFile(USERS_DB_PATH, mergedUsers);
      console.log('[Background Users Sync Success]');
    } else {
      for (const phone in localUsers) {
        setDoc(doc(db, 'users', phone), localUsers[phone]).catch(() => {});
      }
    }
  } catch (error) {
    console.warn(`[Background Users Sync Warning] Failed to load users in background:`, error);
  }
}

// Generic function to load collection from Cloud Firestore with local sync and default fallback
async function loadCollectionFromFirestore<T>(collectionName: string, localFilePath: string, defaultValue: T[]): Promise<T[]> {
  // 1. Return cached data or local disk data immediately of O(1) time
  if (!memoryCache[collectionName]) {
    memoryCache[collectionName] = readJSONFile(localFilePath, defaultValue);
  }
  const cachedData = memoryCache[collectionName] as T[];

  // 2. Schedule non-blocking background synchronization if not done yet
  if (!syncedCollections[collectionName]) {
    syncedCollections[collectionName] = true;
    syncCollectionWithFirestoreInBackground(collectionName, localFilePath, defaultValue).catch((err) => {
      console.error(`[Background Sync Error Trigger] for ${collectionName}:`, err);
    });
  }

  return cachedData;
}

// Save or edit a doc in Firestore (non-blocking)
async function saveDocToFirestore(collectionName: string, docId: string, data: any) {
  try {
    // Sync memory cache first to keep UI instant
    if (memoryCache[collectionName]) {
      const colData = memoryCache[collectionName];
      const index = colData.findIndex((item: any) => item.id === docId);
      if (index !== -1) {
        colData[index] = { ...colData[index], ...data };
      } else {
        colData.push(data);
      }
    }
    
    // Write in background
    setDoc(doc(db, collectionName, docId), data).catch((error) => {
      console.error(`[Background Write Error] Failed to upload ${docId} to ${collectionName}:`, error);
    });
  } catch (error) {
    console.error(`[Firestore Sync Sync-Error] Failed to write document ${docId} in ${collectionName}:`, error);
  }
}

// Delete a doc from Firestore (non-blocking)
async function deleteDocFromFirestore(collectionName: string, docId: string) {
  try {
    // Sync memory cache first
    if (memoryCache[collectionName]) {
      memoryCache[collectionName] = memoryCache[collectionName].filter((item: any) => item.id !== docId);
    }
    
    // Delete in background
    deleteDoc(doc(db, collectionName, docId)).catch((error) => {
      console.error(`[Background Delete Error] Failed to delete ${docId} from ${collectionName}:`, error);
    });
  } catch (error) {
    console.error(`[Firestore Sync Sync-Error] Failed to delete document ${docId} from ${collectionName}:`, error);
  }
}

// Sync users collection
async function loadUsersFromFirestore(): Promise<{ [key: string]: any }> {
  if (!usersCache) {
    usersCache = readJSONFile(USERS_DB_PATH, {});
  }
  
  if (!hasUsersSynced) {
    hasUsersSynced = true;
    syncUsersWithFirestoreInBackground().catch((err) => {
      console.error('[Background Users Sync Trigger Error]:', err);
    });
  }
  
  return usersCache;
}

async function saveUserToFirestore(phone: string, userObj: any) {
  try {
    if (usersCache) {
      usersCache[phone] = userObj;
    }
    setDoc(doc(db, 'users', phone), userObj).catch((err) => {
      console.error('[Background Save User Error]:', err);
    });
  } catch (error) {
    console.error(`[Firestore Sync Error] Failed to write user userObj:`, error);
  }
}

// Initialize local DBs with Admin if missing & seed Firestore Auth user mapping
const usersDB = readJSONFile(USERS_DB_PATH, {});
if (!usersDB['01700000000']) {
  usersDB['01700000000'] = {
    name: 'RK Furniture Admin',
    email: 'admin@rkfurniture.com',
    password: 'rkfurniture0123'
  };
  writeJSONFile(USERS_DB_PATH, usersDB);
}
// Seed admin to firestore
saveUserToFirestore('01700000000', usersDB['01700000000']).catch(() => {});


// Initial Data structures matching front-end data
const INITIAL_PRODUCTS = [
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
const INITIAL_ORDERS: any[] = [];
const INITIAL_SLIDES = [
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
  }
];

const INITIAL_CATEGORIES = [
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

const INITIAL_SHIPPING_AREAS = [
  { id: 'ship_1', name: 'Dubai', charge: 30 },
  { id: 'ship_2', name: 'Abu Dhabi', charge: 50 },
  { id: 'ship_3', name: 'Sharjah & Ajman', charge: 40 },
  { id: 'ship_4', name: 'Other Emirates', charge: 60 }
];

// Seed DBs with initial products and categories if empty
try {
  if (!fs.existsSync(PRODUCTS_DB_PATH) || fs.readFileSync(PRODUCTS_DB_PATH, 'utf-8').trim() === '[]' || fs.readFileSync(PRODUCTS_DB_PATH, 'utf-8').trim() === '') {
    fs.writeFileSync(PRODUCTS_DB_PATH, JSON.stringify(INITIAL_PRODUCTS, null, 2), 'utf-8');
  }
  if (!fs.existsSync(CATEGORIES_DB_PATH) || fs.readFileSync(CATEGORIES_DB_PATH, 'utf-8').trim() === '[]' || fs.readFileSync(CATEGORIES_DB_PATH, 'utf-8').trim() === '') {
    fs.writeFileSync(CATEGORIES_DB_PATH, JSON.stringify(INITIAL_CATEGORIES, null, 2), 'utf-8');
  }
  if (!fs.existsSync(ORDERS_DB_PATH)) {
    fs.writeFileSync(ORDERS_DB_PATH, JSON.stringify(INITIAL_ORDERS, null, 2), 'utf-8');
  }
  if (!fs.existsSync(SLIDES_DB_PATH) || fs.readFileSync(SLIDES_DB_PATH, 'utf-8').trim() === '[]' || fs.readFileSync(SLIDES_DB_PATH, 'utf-8').trim() === '') {
    fs.writeFileSync(SLIDES_DB_PATH, JSON.stringify(INITIAL_SLIDES, null, 2), 'utf-8');
  }
  if (!fs.existsSync(SHIPPING_AREAS_DB_PATH) || fs.readFileSync(SHIPPING_AREAS_DB_PATH, 'utf-8').trim() === '[]' || fs.readFileSync(SHIPPING_AREAS_DB_PATH, 'utf-8').trim() === '') {
    fs.writeFileSync(SHIPPING_AREAS_DB_PATH, JSON.stringify(INITIAL_SHIPPING_AREAS, null, 2), 'utf-8');
  }
  if (!fs.existsSync(SHOP_POLICIES_DB_PATH) || fs.readFileSync(SHOP_POLICIES_DB_PATH, 'utf-8').trim() === '[]' || fs.readFileSync(SHOP_POLICIES_DB_PATH, 'utf-8').trim() === '') {
    fs.writeFileSync(SHOP_POLICIES_DB_PATH, JSON.stringify(INITIAL_SHOP_POLICIES, null, 2), 'utf-8');
  }
} catch (e) {
  console.error('Error performing DB initial seeding:', e);
}

// -------------------------------------------------------------
// API ENDPOINTS
// -------------------------------------------------------------

// 1. PRODUCTS ENDPOINTS
app.get('/api/products', async (req, res) => {
  const products = await loadCollectionFromFirestore('products', PRODUCTS_DB_PATH, INITIAL_PRODUCTS);
  res.json(products);
});

app.post('/api/products', async (req, res) => {
  const products = await loadCollectionFromFirestore('products', PRODUCTS_DB_PATH, INITIAL_PRODUCTS);
  const newProduct = req.body;
  if (!newProduct.id) {
    newProduct.id = 'product_' + Date.now();
  }
  products.push(newProduct);
  writeJSONFile(PRODUCTS_DB_PATH, products);
  await saveDocToFirestore('products', newProduct.id, newProduct);
  res.status(201).json(newProduct);
});

app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  let products = await loadCollectionFromFirestore('products', PRODUCTS_DB_PATH, INITIAL_PRODUCTS);
  products = products.filter((p: any) => p.id !== id);
  writeJSONFile(PRODUCTS_DB_PATH, products);
  await deleteDocFromFirestore('products', id);
  res.json({ success: true, message: 'Product deleted' });
});

// 2. ORDERS ENDPOINTS
app.get('/api/orders', async (req, res) => {
  const { phone } = req.query;
  const orders = await loadCollectionFromFirestore('orders', ORDERS_DB_PATH, INITIAL_ORDERS);
  
  if (phone === '01700000000') {
    // Admin request
    res.json(orders);
  } else if (phone && typeof phone === 'string') {
    // Only return orders which match this specific client's phone number
    const filteredOrders = orders.filter((o: any) => o.customerMobile === phone);
    res.json(filteredOrders);
  } else {
    // Block leakage
    res.json([]);
  }
});

app.post('/api/orders', async (req, res) => {
  const orders = await loadCollectionFromFirestore('orders', ORDERS_DB_PATH, INITIAL_ORDERS);
  const newOrder = req.body;
  const orderId = String(newOrder.id || 'order_' + Date.now());
  orders.unshift(newOrder); // Add to beginning
  writeJSONFile(ORDERS_DB_PATH, orders);
  await saveDocToFirestore('orders', orderId, newOrder);
  res.status(201).json(newOrder);
});

app.put('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  const { status, customerName, customerMobile, deliveryAddress, note, total, shippingArea } = req.body;
  const orders = await loadCollectionFromFirestore('orders', ORDERS_DB_PATH, INITIAL_ORDERS);
  const orderIndex = orders.findIndex((o: any) => o.id === id);
  if (orderIndex !== -1) {
    if (status !== undefined) orders[orderIndex].status = status;
    if (customerName !== undefined) orders[orderIndex].customerName = customerName;
    if (customerMobile !== undefined) orders[orderIndex].customerMobile = customerMobile;
    if (deliveryAddress !== undefined) orders[orderIndex].deliveryAddress = deliveryAddress;
    if (note !== undefined) orders[orderIndex].note = note;
    if (total !== undefined) orders[orderIndex].total = total;
    if (shippingArea !== undefined) orders[orderIndex].shippingArea = shippingArea;
    writeJSONFile(ORDERS_DB_PATH, orders);
    await saveDocToFirestore('orders', id, orders[orderIndex]);
    res.json(orders[orderIndex]);
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  let orders = await loadCollectionFromFirestore('orders', ORDERS_DB_PATH, INITIAL_ORDERS);
  orders = orders.filter((o: any) => o.id !== id);
  writeJSONFile(ORDERS_DB_PATH, orders);
  await deleteDocFromFirestore('orders', id);
  res.json({ success: true, message: 'Order deleted successfully' });
});

// Update/Edit Product (For Admin)
app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  const products = await loadCollectionFromFirestore('products', PRODUCTS_DB_PATH, INITIAL_PRODUCTS);
  const prodIndex = products.findIndex((p: any) => p.id === id);
  if (prodIndex !== -1) {
    products[prodIndex] = { ...products[prodIndex], ...updatedData };
    writeJSONFile(PRODUCTS_DB_PATH, products);
    await saveDocToFirestore('products', id, products[prodIndex]);
    res.json(products[prodIndex]);
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

// 3. USERS ENDPOINTS (For system registrations database)
app.get('/api/users', async (req, res) => {
  const { phone } = req.query;
  const users = await loadUsersFromFirestore();
  
  if (phone === '01700000000') {
    // Admin request
    res.json(users);
  } else if (phone && typeof phone === 'string') {
    // Return ONLY the requested user profile if it exists, blocking other user accounts
    if (users[phone]) {
      res.json({ [phone]: users[phone] });
    } else {
      res.json({});
    }
  } else {
    // Return empty to block data leakage
    res.json({});
  }
});

app.post('/api/users', async (req, res) => {
  const { phone, userObj } = req.body;
  if (!phone || !userObj) {
    return res.status(400).json({ error: 'Missing phone or userObj' });
  }
  const users = await loadUsersFromFirestore();
  users[phone] = userObj;
  writeJSONFile(USERS_DB_PATH, users);
  await saveUserToFirestore(phone, userObj);
  res.status(200).json({ success: true, user: userObj });
});

// SLIDES ENDPOINTS
app.get('/api/slides', async (req, res) => {
  const slides = await loadCollectionFromFirestore('slides', SLIDES_DB_PATH, INITIAL_SLIDES);
  res.json(slides);
});

app.post('/api/slides', async (req, res) => {
  const slides = req.body;
  if (Array.isArray(slides)) {
    writeJSONFile(SLIDES_DB_PATH, slides);
    for (const slide of slides) {
      if (slide.id) {
        await saveDocToFirestore('slides', slide.id, slide);
      }
    }
    // Cleanup deleted slides from Firestore and await it
    try {
      const colRef = collection(db, 'slides');
      const snapshot = await getDocs(colRef);
      for (const dSnap of snapshot.docs) {
        const dId = dSnap.id;
        if (!slides.some((s: any) => s.id === dId)) {
          await deleteDoc(dSnap.ref);
        }
      }
    } catch (err) {
      console.error('Firestore slides cleanup error:', err);
    }
    res.json({ success: true, slides });
  } else {
    res.status(400).json({ error: 'Must be an array' });
  }
});

// CATEGORIES ENDPOINTS
app.get('/api/categories', async (req, res) => {
  const categories = await loadCollectionFromFirestore('categories', CATEGORIES_DB_PATH, INITIAL_CATEGORIES);
  res.json(categories);
});

app.post('/api/categories', async (req, res) => {
  const categories = await loadCollectionFromFirestore('categories', CATEGORIES_DB_PATH, INITIAL_CATEGORIES);
  const newCat = req.body;
  if (!newCat.id) {
    newCat.id = 'category_' + Date.now();
  }
  const existingIndex = categories.findIndex((c: any) => c.name.toLowerCase() === newCat.name.toLowerCase() || c.id === newCat.id);
  if (existingIndex !== -1) {
    categories[existingIndex] = { ...categories[existingIndex], ...newCat };
  } else {
    categories.push(newCat);
  }
  writeJSONFile(CATEGORIES_DB_PATH, categories);
  await saveDocToFirestore('categories', newCat.id, newCat);
  res.status(201).json(newCat);
});

app.delete('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  let categories = await loadCollectionFromFirestore('categories', CATEGORIES_DB_PATH, INITIAL_CATEGORIES);
  categories = categories.filter((c: any) => c.id !== id);
  writeJSONFile(CATEGORIES_DB_PATH, categories);
  await deleteDocFromFirestore('categories', id);
  res.json({ success: true, message: 'Category deleted' });
});

// SHIPPING AREAS ENDPOINTS
app.get('/api/shipping-areas', async (req, res) => {
  const areas = await loadCollectionFromFirestore('shipping_areas', SHIPPING_AREAS_DB_PATH, INITIAL_SHIPPING_AREAS);
  res.json(areas);
});

app.post('/api/shipping-areas', async (req, res) => {
  const areas = await loadCollectionFromFirestore('shipping_areas', SHIPPING_AREAS_DB_PATH, INITIAL_SHIPPING_AREAS);
  const newArea = req.body;
  if (!newArea.id) {
    newArea.id = 'ship_' + Date.now();
  }
  const existingIndex = areas.findIndex((a: any) => a.id === newArea.id || a.name.toLowerCase() === newArea.name.toLowerCase());
  if (existingIndex !== -1) {
    areas[existingIndex] = { ...areas[existingIndex], ...newArea, charge: Number(newArea.charge) };
  } else {
    newArea.charge = Number(newArea.charge);
    areas.push(newArea);
  }
  writeJSONFile(SHIPPING_AREAS_DB_PATH, areas);
  await saveDocToFirestore('shipping_areas', newArea.id, newArea);
  res.status(201).json(newArea);
});

app.delete('/api/shipping-areas/:id', async (req, res) => {
  const { id } = req.params;
  let areas = await loadCollectionFromFirestore('shipping_areas', SHIPPING_AREAS_DB_PATH, INITIAL_SHIPPING_AREAS);
  areas = areas.filter((a: any) => a.id !== id);
  writeJSONFile(SHIPPING_AREAS_DB_PATH, areas);
  await deleteDocFromFirestore('shipping_areas', id);
  res.json({ success: true, message: 'Shipping area deleted' });
});

// STORE CONTACT HELP DESK ENDPOINTS
app.get('/api/store-contact', async (req, res) => {
  try {
    const contacts = await loadCollectionFromFirestore('store_contact', STORE_CONTACT_DB_PATH, INITIAL_STORE_CONTACT);
    res.json(contacts[0] || INITIAL_STORE_CONTACT[0]);
  } catch (err) {
    console.error('Failed to get store contact:', err);
    res.status(500).json({ error: 'Failed to find help desk number' });
  }
});

app.post('/api/store-contact', async (req, res) => {
  try {
    const { phone, whatsappUrl, hours } = req.body;
    const updatedContact = {
      id: 'contact_info',
      phone: phone || '01715838191',
      whatsappUrl: whatsappUrl || `https://wa.me/88${phone || '01715838191'}`,
      hours: hours || 'Available 24/7 for support'
    };
    try {
      await setDoc(doc(db, 'store_contact', 'contact_info'), updatedContact);
    } catch (firestoreErr) {
      console.warn('Failed to save store-contact to Firestore (unreachable or offline), proceeding with local disk save:', firestoreErr);
    }
    writeJSONFile(STORE_CONTACT_DB_PATH, [updatedContact]);
    res.json(updatedContact);
  } catch (err) {
    console.error('Failed to update store contact:', err);
    res.status(500).json({ error: 'Failed to update help desk details' });
  }
});

// SHOP POLICIES ENDPOINTS
app.get('/api/shop-policies', async (req, res) => {
  try {
    const policies = await loadCollectionFromFirestore('shop_policies', SHOP_POLICIES_DB_PATH, INITIAL_SHOP_POLICIES);
    res.json(policies[0] || INITIAL_SHOP_POLICIES[0]);
  } catch (err) {
    console.error('Failed to get shop policies:', err);
    res.status(500).json({ error: 'Failed to load shop policies' });
  }
});

app.post('/api/shop-policies', async (req, res) => {
  try {
    const { aboutUs, privacyPolicy, termsConditions, refundPolicy, cancelationPolicy } = req.body;
    const updatedPolicies = {
      id: 'policies',
      aboutUs: aboutUs || '',
      privacyPolicy: privacyPolicy || '',
      termsConditions: termsConditions || '',
      refundPolicy: refundPolicy || '',
      cancelationPolicy: cancelationPolicy || ''
    };
    try {
      await setDoc(doc(db, 'shop_policies', 'policies'), updatedPolicies);
    } catch (firestoreErr) {
      console.warn('Failed to save shop-policies to Firestore, proceeding with local disk save:', firestoreErr);
    }
    writeJSONFile(SHOP_POLICIES_DB_PATH, [updatedPolicies]);
    res.json(updatedPolicies);
  } catch (err) {
    console.error('Failed to update shop policies:', err);
    res.status(500).json({ error: 'Failed to save shop policies' });
  }
});

// COUPONS ENDPOINTS
app.get('/api/coupons', async (req, res) => {
  const coupons = await loadCollectionFromFirestore('coupons', COUPONS_DB_PATH, INITIAL_COUPONS);
  res.json(coupons);
});

app.post('/api/coupons', async (req, res) => {
  const coupons = await loadCollectionFromFirestore('coupons', COUPONS_DB_PATH, INITIAL_COUPONS);
  const newCoupon = req.body;
  if (!newCoupon.id) {
    newCoupon.id = 'coupon_' + Date.now();
  }
  newCoupon.discountPercent = Number(newCoupon.discountPercent);
  newCoupon.isActive = newCoupon.isActive !== false;
  
  const existingIndex = coupons.findIndex((c: any) => c.id === newCoupon.id || c.code.toLowerCase() === newCoupon.code.toLowerCase());
  if (existingIndex !== -1) {
    coupons[existingIndex] = { ...coupons[existingIndex], ...newCoupon };
  } else {
    coupons.push(newCoupon);
  }
  
  writeJSONFile(COUPONS_DB_PATH, coupons);
  await saveDocToFirestore('coupons', newCoupon.id, newCoupon);
  res.status(201).json(newCoupon);
});

app.delete('/api/coupons/:id', async (req, res) => {
  const { id } = req.params;
  let coupons = await loadCollectionFromFirestore('coupons', COUPONS_DB_PATH, INITIAL_COUPONS);
  coupons = coupons.filter((c: any) => c.id !== id);
  writeJSONFile(COUPONS_DB_PATH, coupons);
  await deleteDocFromFirestore('coupons', id);
  res.json({ success: true, message: 'Coupon deleted successfully' });
});

// 4. ACTIVE SESSIONS MONITORING
app.post('/api/sessions/ping', (req, res) => {
  const { sessionId, deviceName, isAdmin, phone } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'Missing sessionId' });
  }
  activeSessions[sessionId] = {
    sessionId,
    deviceName: deviceName || 'Unknown Device',
    isAdmin: !!isAdmin,
    phone: phone || '',
    lastSeen: Date.now()
  };
  res.json({ success: true });
});

app.get('/api/sessions/active', (req, res) => {
  const list = Object.values(activeSessions);
  res.json(list);
});

// --- Vite Middleware / Static Files Setup ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      maxAge: '1d',
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        } else if (filePath.match(/\.(js|css|woff2?|png|jpg|jpeg|gif|svg|ico)$/)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=86400');
        }
      }
    }));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
