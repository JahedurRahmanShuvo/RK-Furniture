import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// JSON Local Persistence DB Paths
const PRODUCTS_DB_PATH = path.join(process.cwd(), 'db_products.json');
const ORDERS_DB_PATH = path.join(process.cwd(), 'db_orders.json');
const USERS_DB_PATH = path.join(process.cwd(), 'db_users.json');
const SLIDES_DB_PATH = path.join(process.cwd(), 'db_slides.json');
const CATEGORIES_DB_PATH = path.join(process.cwd(), 'db_categories.json');

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

// Initialize DBs with Admin if missing
const usersDB = readJSONFile(USERS_DB_PATH, {});
if (!usersDB['01700000000']) {
  usersDB['01700000000'] = {
    name: 'RK Furniture Admin',
    email: 'admin@rkfurniture.com',
    password: 'rkfurniture0123'
  };
  writeJSONFile(USERS_DB_PATH, usersDB);
}

// Initial Data structures matching front-end data
const INITIAL_PRODUCTS: any[] = [];
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
  },
  {
    id: 'slide_3',
    title: 'Cozy Royal Sofa Set',
    subtitle: 'Designed for ultimate relaxation and supreme spinal comfort.',
    bg: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'slide_4',
    title: 'Luxury Bedroom Collections',
    subtitle: 'Wooden bed frames crafted to give you a royal sleeping experience.',
    bg: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'slide_5',
    title: 'Premium Dining Delights',
    subtitle: 'Gather with your family on polished mahogany wood tables.',
    bg: 'https://images.unsplash.com/photo-1617806118233-18e1db207f62?auto=format&fit=crop&w=1200&q=80'
  }
];

const INITIAL_CATEGORIES: any[] = [];

// Force clean-up of saved mock products, categories and orders on sandboxed disk to start totally empty
try {
  if (fs.existsSync(PRODUCTS_DB_PATH)) {
    const data = fs.readFileSync(PRODUCTS_DB_PATH, 'utf-8');
    if (data.includes('montana_bed') || data.includes('restoric_sofa')) {
      fs.writeFileSync(PRODUCTS_DB_PATH, JSON.stringify([], null, 2), 'utf-8');
    }
  } else {
    fs.writeFileSync(PRODUCTS_DB_PATH, JSON.stringify([], null, 2), 'utf-8');
  }

  if (fs.existsSync(CATEGORIES_DB_PATH)) {
    const data = fs.readFileSync(CATEGORIES_DB_PATH, 'utf-8');
    if (data.includes('furniture') || data.includes('bedroom')) {
      fs.writeFileSync(CATEGORIES_DB_PATH, JSON.stringify([], null, 2), 'utf-8');
    }
  } else {
    fs.writeFileSync(CATEGORIES_DB_PATH, JSON.stringify([], null, 2), 'utf-8');
  }

  if (fs.existsSync(ORDERS_DB_PATH)) {
    const data = fs.readFileSync(ORDERS_DB_PATH, 'utf-8');
    if (data.includes('20260524-11275833')) {
      fs.writeFileSync(ORDERS_DB_PATH, JSON.stringify([], null, 2), 'utf-8');
    }
  } else {
    fs.writeFileSync(ORDERS_DB_PATH, JSON.stringify([], null, 2), 'utf-8');
  }
} catch (e) {
  console.error('Error performing DB force initialization:', e);
}

// -------------------------------------------------------------
// API ENDPOINTS
// -------------------------------------------------------------

// 1. PRODUCTS ENDPOINTS
app.get('/api/products', (req, res) => {
  const products = readJSONFile(PRODUCTS_DB_PATH, INITIAL_PRODUCTS);
  res.json(products);
});

app.post('/api/products', (req, res) => {
  const products = readJSONFile(PRODUCTS_DB_PATH, INITIAL_PRODUCTS);
  const newProduct = req.body;
  if (!newProduct.id) {
    newProduct.id = 'product_' + Date.now();
  }
  products.push(newProduct);
  writeJSONFile(PRODUCTS_DB_PATH, products);
  res.status(201).json(newProduct);
});

app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  let products = readJSONFile(PRODUCTS_DB_PATH, INITIAL_PRODUCTS);
  products = products.filter((p: any) => p.id !== id);
  writeJSONFile(PRODUCTS_DB_PATH, products);
  res.json({ success: true, message: 'Product deleted' });
});

// 2. ORDERS ENDPOINTS
app.get('/api/orders', (req, res) => {
  const orders = readJSONFile(ORDERS_DB_PATH, INITIAL_ORDERS);
  res.json(orders);
});

app.post('/api/orders', (req, res) => {
  const orders = readJSONFile(ORDERS_DB_PATH, INITIAL_ORDERS);
  const newOrder = req.body;
  orders.unshift(newOrder); // Add to beginning
  writeJSONFile(ORDERS_DB_PATH, orders);
  res.status(201).json(newOrder);
});

app.put('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const { status, customerName, customerMobile, deliveryAddress, note, total, shippingArea } = req.body;
  const orders = readJSONFile(ORDERS_DB_PATH, INITIAL_ORDERS);
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
    res.json(orders[orderIndex]);
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

app.delete('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  let orders = readJSONFile(ORDERS_DB_PATH, INITIAL_ORDERS);
  orders = orders.filter((o: any) => o.id !== id);
  writeJSONFile(ORDERS_DB_PATH, orders);
  res.json({ success: true, message: 'Order deleted successfully' });
});

// Update/Edit Product (For Admin)
app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  const products = readJSONFile(PRODUCTS_DB_PATH, INITIAL_PRODUCTS);
  const prodIndex = products.findIndex((p: any) => p.id === id);
  if (prodIndex !== -1) {
    products[prodIndex] = { ...products[prodIndex], ...updatedData };
    writeJSONFile(PRODUCTS_DB_PATH, products);
    res.json(products[prodIndex]);
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

// 3. USERS ENDPOINTS (For system registrations database)
app.get('/api/users', (req, res) => {
  const users = readJSONFile(USERS_DB_PATH, {});
  res.json(users);
});

app.post('/api/users', (req, res) => {
  const users = readJSONFile(USERS_DB_PATH, {});
  const { phone, userObj } = req.body;
  if (!phone || !userObj) {
    return res.status(400).json({ error: 'Missing phone or userObj' });
  }
  users[phone] = userObj;
  writeJSONFile(USERS_DB_PATH, users);
  res.status(200).json({ success: true, user: userObj });
});

// SLIDES ENDPOINTS
app.get('/api/slides', (req, res) => {
  const slides = readJSONFile(SLIDES_DB_PATH, INITIAL_SLIDES);
  res.json(slides);
});

app.post('/api/slides', (req, res) => {
  const slides = req.body;
  if (Array.isArray(slides)) {
    writeJSONFile(SLIDES_DB_PATH, slides);
    res.json({ success: true, slides });
  } else {
    res.status(400).json({ error: 'Must be an array' });
  }
});

// CATEGORIES ENDPOINTS
app.get('/api/categories', (req, res) => {
  const categories = readJSONFile(CATEGORIES_DB_PATH, INITIAL_CATEGORIES);
  res.json(categories);
});

app.post('/api/categories', (req, res) => {
  const categories = readJSONFile(CATEGORIES_DB_PATH, INITIAL_CATEGORIES);
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
  res.status(201).json(newCat);
});

app.delete('/api/categories/:id', (req, res) => {
  const { id } = req.params;
  let categories = readJSONFile(CATEGORIES_DB_PATH, INITIAL_CATEGORIES);
  categories = categories.filter((c: any) => c.id !== id);
  writeJSONFile(CATEGORIES_DB_PATH, categories);
  res.json({ success: true, message: 'Category deleted' });
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
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
