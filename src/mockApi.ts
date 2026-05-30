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
  { id: 'cat_sofa', name: 'Sofa' },
  { id: 'cat_bed', name: 'Bed' },
  { id: 'cat_dining', name: 'Dining' },
  { id: 'cat_wardrobe', name: 'Wardrobe' }
];

const DEFAULT_USERS = {
  '01700000000': {
    name: 'RK Furniture Admin',
    email: 'admin@rkfurniture.com',
    password: 'rkfurniture0123'
  }
};

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

async function handleMockRequest(url: string, method: string, init: RequestInit | undefined): Promise<Response> {
  // Extract route after "/api/"
  const parts = url.split('/api/');
  const path = parts[1]?.split('?')[0] || '';
  const pathParts = path.split('/');
  const resource = pathParts[0];
  const idValue = pathParts[1];

  let status = 200;
  let responseData: any = null;

  // Initial read helpers mapping to local storage
  const getStored = (key: string, defaultValue: any) => {
    const data = localStorage.getItem(key);
    if (!data) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    try {
      return JSON.parse(data);
    } catch {
      return defaultValue;
    }
  };

  const setStored = (key: string, value: any) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  // 1. PRODUCTS
  if (resource === 'products') {
    const currentProducts = getStored('netlify_products', DEFAULT_PRODUCTS);

    if (method === 'GET') {
      responseData = currentProducts;
    } else if (method === 'POST') {
      const payload = JSON.parse(init?.body as string);
      if (!payload.id) {
        payload.id = 'product_' + Date.now();
      }
      currentProducts.push(payload);
      setStored('netlify_products', currentProducts);
      responseData = payload;
      status = 201;
    } else if (method === 'PUT' && idValue) {
      const payload = JSON.parse(init?.body as string);
      const idx = currentProducts.findIndex((p: any) => p.id === idValue);
      if (idx !== -1) {
        currentProducts[idx] = { ...currentProducts[idx], ...payload };
        setStored('netlify_products', currentProducts);
        responseData = currentProducts[idx];
      } else {
        status = 404;
        responseData = { error: 'Product not found' };
      }
    } else if (method === 'DELETE' && idValue) {
      const filtered = currentProducts.filter((p: any) => p.id !== idValue);
      setStored('netlify_products', filtered);
      responseData = { success: true, message: 'Product deleted' };
    }
  }

  // 2. SLIDES
  else if (resource === 'slides') {
    const currentSlides = getStored('netlify_slides', DEFAULT_SLIDES);

    if (method === 'GET') {
      responseData = currentSlides;
    } else if (method === 'POST') {
      const payload = JSON.parse(init?.body as string);
      if (Array.isArray(payload)) {
        setStored('netlify_slides', payload);
        responseData = { success: true, slides: payload };
      } else {
        status = 400;
        responseData = { error: 'Slides must be an array' };
      }
    }
  }

  // 3. CATEGORIES
  else if (resource === 'categories') {
    const currentCategories = getStored('netlify_categories', DEFAULT_CATEGORIES);

    if (method === 'GET') {
      responseData = currentCategories;
    } else if (method === 'POST') {
      const payload = JSON.parse(init?.body as string);
      if (!payload.id) {
        payload.id = 'category_' + Date.now();
      }
      const existingIdx = currentCategories.findIndex((c: any) => c.name.toLowerCase() === payload.name.toLowerCase() || c.id === payload.id);
      if (existingIdx !== -1) {
        currentCategories[existingIdx] = { ...currentCategories[existingIdx], ...payload };
      } else {
        currentCategories.push(payload);
      }
      setStored('netlify_categories', currentCategories);
      responseData = payload;
      status = 201;
    } else if (method === 'DELETE' && idValue) {
      const filtered = currentCategories.filter((c: any) => c.id !== idValue);
      setStored('netlify_categories', filtered);
      responseData = { success: true, message: 'Category deleted' };
    }
  }

  // 4. ORDERS
  else if (resource === 'orders') {
    // Sync seamlessly with existing local storage keys to prevent duplicate states
    const currentOrders = getStored('rk_orders', getStored('netlify_orders', []));

    if (method === 'GET') {
      responseData = currentOrders;
    } else if (method === 'POST') {
      const payload = JSON.parse(init?.body as string);
      currentOrders.unshift(payload);
      setStored('rk_orders', currentOrders);
      setStored('netlify_orders', currentOrders);
      responseData = payload;
      status = 201;
    } else if (method === 'PUT' && idValue) {
      const payload = JSON.parse(init?.body as string);
      const idx = currentOrders.findIndex((o: any) => o.id === idValue);
      if (idx !== -1) {
        currentOrders[idx] = { ...currentOrders[idx], ...payload };
        setStored('rk_orders', currentOrders);
        setStored('netlify_orders', currentOrders);
        responseData = currentOrders[idx];
      } else {
        status = 404;
        responseData = { error: 'Order not found' };
      }
    } else if (method === 'DELETE' && idValue) {
      const filtered = currentOrders.filter((o: any) => o.id !== idValue);
      setStored('rk_orders', filtered);
      setStored('netlify_orders', filtered);
      responseData = { success: true, message: 'Order deleted successfully' };
    }
  }

  // 5. USERS
  else if (resource === 'users') {
    const currentUsers = getStored('rk_registered_users', getStored('netlify_users', DEFAULT_USERS));

    if (method === 'GET') {
      responseData = currentUsers;
    } else if (method === 'POST') {
      const { phone, userObj } = JSON.parse(init?.body as string);
      if (phone && userObj) {
        currentUsers[phone] = userObj;
        setStored('rk_registered_users', currentUsers);
        setStored('netlify_users', currentUsers);
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
      // Filter out stale sessions older than 45 seconds
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
