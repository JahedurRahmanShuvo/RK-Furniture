import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  ShoppingCart,
  ShoppingBag,
  User,
  Heart,
  Trash2,
  Home,
  LayoutGrid,
  CheckCircle,
  Check,
  Clock,
  MapPin,
  Phone,
  MessageSquare,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Plus,
  Minus,
  X,
  Lock,
  Menu,
  ChevronDown,
  ChevronUp,
  FileText,
  BadgeAlert,
  Send,
  Eye,
  LogOut,
  UserCheck,
  Ticket,
  ClipboardList,
  IdCard
} from 'lucide-react';

import { INITIAL_PRODUCTS, SHIPPING_RATES, STORE_CONTACT } from './data';
import { Product, Order, OrderStatus, UserProfile, ShippingAddress } from './types';
import BoxWithRays from './components/BoxWithRays';
import OrderReceipt from './components/OrderReceipt';
import BottomNav from './components/BottomNav';
import Navbar from './components/Navbar';
import ProductDetailView from './components/ProductDetailView';
import AdminDashboard from './components/AdminDashboard';
import { auth } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile 
} from 'firebase/auth';

const toBengaliNumber = (num: number): string => {
  const formatted = Math.round(num).toLocaleString('en-US'); // inserts commas
  return 'AED ' + formatted;
};

const CabinetIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`}>
    {/* Main cabinet outer box */}
    <rect x="8" y="8" width="32" height="34" rx="2" fill="#E2A76F" stroke="#4A2F13" strokeWidth="3" />
    
    {/* Vertical line splitting Left cupboards & Right drawers */}
    <line x1="26" y1="8" x2="26" y2="42" stroke="#4A2F13" strokeWidth="2.5" />
    
    {/* Left doors divider */}
    <line x1="17" y1="8" x2="17" y2="42" stroke="#4A2F13" strokeWidth="1.5" strokeDasharray="2 2" />
    
    {/* Handles for left cupboard doors */}
    <rect x="23" y="16" width="1.5" height="6" rx="0.5" fill="#4A2F13" />
    
    {/* Right drawers horizontal separators */}
    <line x1="26" y1="19" x2="40" y2="19" stroke="#4A2F13" strokeWidth="2" />
    <line x1="26" y1="30" x2="40" y2="30" stroke="#4A2F13" strokeWidth="2" />
    
    {/* Drawer handles */}
    <line x1="30" y1="13.5" x2="36" y2="13.5" stroke="#4A2F13" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="30" y1="24.5" x2="36" y2="24.5" stroke="#4A2F13" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="30" y1="35.5" x2="36" y2="35.5" stroke="#4A2F13" strokeWidth="2.5" strokeLinecap="round" />
    
    {/* Cabinet legs */}
    <rect x="12" y="42" width="5" height="3" fill="#4A2F13" />
    <rect x="31" y="42" width="5" height="3" fill="#4A2F13" />
  </svg>
);

export default function App() {
  // --- Persistent State Manager (Local Storage) ---
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('rk_user');
    return saved ? JSON.parse(saved) : { name: '', phone: '', email: '', isLoggedIn: false };
  });

  const [cart, setCart] = useState<{ productId: string; quantity: number }[]>(() => {
    const saved = localStorage.getItem('rk_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('rk_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('rk_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [addresses, setAddresses] = useState<ShippingAddress[]>(() => {
    const saved = localStorage.getItem('rk_addresses');
    return saved ? JSON.parse(saved) : [];
  });

  const [registeredUsers, setRegisteredUsers] = useState<{ [phone: string]: { name: string; email: string; password?: string } }>(() => {
    const saved = localStorage.getItem('rk_registered_users');
    if (saved) return JSON.parse(saved);
    return {};
  });

  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<any[]>([]);
  const [shippingAreas, setShippingAreas] = useState<any[]>([
    { id: 'ship_1', name: 'Dubai', charge: 30 },
    { id: 'ship_2', name: 'Abu Dhabi', charge: 50 },
    { id: 'ship_3', name: 'Sharjah & Ajman', charge: 40 },
    { id: 'ship_4', name: 'Other Emirates', charge: 60 }
  ]);

  const [storeContact, setStoreContact] = useState<{ phone: string; whatsappUrl: string; hours: string }>({
    phone: '01715838191',
    whatsappUrl: 'https://wa.me/8801715838191',
    hours: 'Available 24/7 for support'
  });

  const [appLoading, setAppLoading] = useState(true);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [promoDiscountPercent, setPromoDiscountPercent] = useState<number>(0);

  // Synchronize orders, products, and users with global server databases with rapid real-time polling
  const syncDatabaseGlobal = () => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
        }
      })
      .catch((err) => console.error('Failed to sync products from server:', err));

    fetch('/api/slides')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setSlides(data);
        }
      })
      .catch((err) => console.error('Failed to sync slides from server:', err));

    fetch('/api/orders')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setOrders(data);
        }
      })
      .catch((err) => console.error('Failed to sync orders from server:', err));

    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data === 'object') {
          setRegisteredUsers(data);
        }
      })
      .catch((err) => console.error('Failed to sync users from server:', err));

    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data);
        }
      })
      .catch((err) => console.error('Failed to sync categories from server:', err));

    fetch('/api/shipping-areas')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setShippingAreas(data);
          // Only initialize checkout area once if it hasn't been set yet
          setCheckoutArea((prev) => prev || data[0].id);
        }
      })
      .catch((err) => console.error('Failed to sync shipping areas from server:', err));

    fetch('/api/store-contact')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.phone) {
          setStoreContact(data);
        }
      })
      .catch((err) => console.error('Failed to sync store contact:', err));

    fetch('/api/coupons')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCoupons(data);
        }
      })
      .catch((err) => console.error('Failed to sync coupons from server:', err));
  };

  useEffect(() => {
    const runInitialSync = async () => {
      try {
        // Fetch products, slides, and categories in parallel first to block loading screen until everything arrives
        await Promise.allSettled([
          fetch('/api/products')
            .then((res) => res.json())
            .then((data) => {
              if (Array.isArray(data)) {
                setProducts(data);
              }
            }),
          fetch('/api/slides')
            .then((res) => res.json())
            .then((data) => {
              if (Array.isArray(data) && data.length > 0) {
                setSlides(data);
              }
            }),
          fetch('/api/categories')
            .then((res) => res.json())
            .then((data) => {
              if (Array.isArray(data)) {
                setCategories(data);
              }
            }),
          fetch('/api/shipping-areas')
            .then((res) => res.json())
            .then((data) => {
              if (Array.isArray(data) && data.length > 0) {
                setShippingAreas(data);
                setCheckoutArea((prev) => prev || data[0].id);
              }
            }),
          fetch('/api/store-contact')
            .then((res) => res.json())
            .then((data) => {
              if (data && data.phone) {
                setStoreContact(data);
              }
            }),
          fetch('/api/coupons')
            .then((res) => res.json())
            .then((data) => {
              if (Array.isArray(data)) {
                setCoupons(data);
              }
            }),
          fetch('/api/orders')
            .then((res) => res.json())
            .then((data) => {
              if (Array.isArray(data)) {
                setOrders(data);
              }
            }),
          fetch('/api/users')
            .then((res) => res.json())
            .then((data) => {
              if (data && typeof data === 'object') {
                setRegisteredUsers(data);
              }
            })
        ]);
      } catch (err) {
        console.error('Error during initial sync:', err);
      } finally {
        // Enforce a minimum aesthetic delay of 1200ms so the loading screen doesn't flicker
        setTimeout(() => {
          setAppLoading(false);
        }, 1200);
      }
    };

    runInitialSync();

    // Set up rapid background real-time synchronization every 3.5 seconds
    const interval = setInterval(syncDatabaseGlobal, 3500);
    return () => {
      clearInterval(interval);
    };
  }, []);

  // --- Active Viewer Session Heartbeat ---
  useEffect(() => {
    let sessionId = sessionStorage.getItem('rk_session_id');
    if (!sessionId) {
      sessionId = 'sess_' + Math.random().toString(36).substring(2, 11);
      sessionStorage.setItem('rk_session_id', sessionId);
    }

    const ua = navigator.userAgent;
    let deviceName = 'PC / Desktop Explorer';
    if (/android/i.test(ua)) {
      deviceName = 'Android Phone';
    } else if (/iPhone|iPad|iPod/i.test(ua)) {
      deviceName = 'Apple iPhone';
    } else if (/mobile/i.test(ua)) {
      deviceName = 'Mobile Device';
    } else if (/Macintosh/i.test(ua)) {
      deviceName = 'Macbook Desktop';
    } else if (/Windows/i.test(ua)) {
      deviceName = 'Windows Laptop';
    } else if (/Linux/i.test(ua)) {
      deviceName = 'Linux Workstation';
    }

    const sendPing = () => {
      fetch('/api/sessions/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          deviceName,
          isAdmin: user.phone === '01700000000',
          phone: user.isLoggedIn ? (user.phone === '01700000000' ? 'Admin' : user.phone) : 'Guest Visitor'
        })
      }).catch(() => {});
    };

    sendPing();
    const interval = setInterval(sendPing, 8000);
    return () => clearInterval(interval);
  }, [user]);

  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editProfileMessage, setEditProfileMessage] = useState('');

  // Save states back to local storage
  useEffect(() => {
    localStorage.setItem('rk_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('rk_registered_users', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  useEffect(() => {
    if (user.isLoggedIn) {
      setEditName(user.name);
      setEditEmail(user.email);
      setEditPhone(user.phone);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('rk_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('rk_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('rk_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('rk_addresses', JSON.stringify(addresses));
  }, [addresses]);

  // --- Active Navigation States ---
  const [view, setView] = useState<'home' | 'product_detail' | 'checkout' | 'order_success' | 'track_order' | 'dashboard' | 'auth' | 'trending_products' | 'admin_dashboard'>('home');
  const [currentTab, setCurrentTab] = useState<'home' | 'categories' | 'cart' | 'profile'>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  
  // Dashboard submenu views
  const [dashboardView, setDashboardView] = useState<'stats' | 'account' | 'orders' | 'order_detail' | 'wishlist' | 'chat' | 'addresses' | 'password_reset'>('stats');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [dashboardDrawerOpen, setDashboardDrawerOpen] = useState(false);

  // Authentication mode screen toggle
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');

  // Categories Drawer state
  const [categoriesDrawerOpen, setCategoriesDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Search overlay toggle
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Cart slide-out toggle
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  // Tracking query inputs
  const [trackQuery, setTrackQuery] = useState('');
  const [scannedOrder, setScannedOrder] = useState<Order | null>(null);
  const [trackError, setTrackError] = useState('');

  // Receipt Modal overlay
  const [viewReceiptOrder, setViewReceiptOrder] = useState<Order | null>(null);

  // Checkout inputs
  const [addedProductPopup, setAddedProductPopup] = useState<{ productId: string; qty: number } | null>(null);
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutMobile, setCheckoutMobile] = useState('');
  const [checkoutAddress, setCheckoutAddress] = useState('');
  const [checkoutArea, setCheckoutArea] = useState<string>('ship_1');
  const [checkoutGlobalCountry, setCheckoutGlobalCountry] = useState('');
  const [checkoutGlobalCity, setCheckoutGlobalCity] = useState('');
  const [checkoutNote, setCheckoutNote] = useState('');
  const [promoInput, setPromoInput] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoMessage, setPromoMessage] = useState('');
  const [latestPlacedOrder, setLatestPlacedOrder] = useState<Order | null>(null);

  // Auto-fill checkout details based on logged-in user profile & shipping locations
  useEffect(() => {
    if (view === 'checkout') {
      if (user && user.isLoggedIn) {
        if (!checkoutName) {
          setCheckoutName(user.name || '');
        }
        if (!checkoutMobile) {
          setCheckoutMobile(user.phone || '');
        }
        if (!checkoutAddress && addresses && addresses.length > 0) {
          setCheckoutAddress(addresses[0].address || '');
        }
      }
    }
  }, [view, user, addresses, checkoutName, checkoutMobile, checkoutAddress]);

  // Auth form states
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Password Reset fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordResetMessage, setPasswordResetMessage] = useState({ text: '', type: 'success' });

  // Add Address helper fields
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [newAddressName, setNewAddressName] = useState('');
  const [newAddressMobile, setNewAddressMobile] = useState('');
  const [newAddressEmail, setNewAddressEmail] = useState('');
  const [newAddressDetails, setNewAddressDetails] = useState('');

  // Hero image slider index state
  const [activeSlide, setActiveSlide] = useState(0);
  const [slides, setSlides] = useState<any[]>([
    {
      id: 'slide_1',
      title: 'Premium Handcrafted Furniture',
      subtitle: 'Elevate your living space with our luxurious, comfy collections.',
      bg: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 'slide_2',
      title: 'Sustainable Wooden Designs',
      subtitle: 'Experience classic artistry combined with durable modern aesthetics.',
      bg: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 'slide_3',
      title: 'Cozy Royal Sofa Set',
      subtitle: 'Designed for ultimate relaxation and supreme spinal comfort.',
      bg: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 'slide_4',
      title: 'Luxury Bedroom Collections',
      subtitle: 'Wooden bed frames crafted to give you a royal sleeping experience.',
      bg: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 'slide_5',
      title: 'Premium Dining Delights',
      subtitle: 'Gather with your family on polished mahogany wood tables.',
      bg: 'https://images.unsplash.com/photo-1617806118233-18e1db207f62?auto=format&fit=crop&w=1200&q=80',
    }
  ]);

  // Autoplay slideshow
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  // Sync state between Tab clicks and view panel
  const handleTabChange = (tab: 'home' | 'categories' | 'cart' | 'profile') => {
    if (tab === 'categories') {
      setCategoriesDrawerOpen(true);
      return;
    }
    setCurrentTab(tab);
    if (tab === 'home') {
      setView('home');
      setSelectedProductId(null);
      setSelectedCategory(null);
    } else if (tab === 'cart') {
      setCartDrawerOpen(true);
    } else if (tab === 'profile') {
      if (user.isLoggedIn) {
        setView('dashboard');
        setDashboardView('stats');
      } else {
        setView('auth');
        setAuthView('login');
      }
    }
  };

  // Helper to resolve currently correct dynamic prices for display
  const getProductPrices = (prod: Product) => {
    const hasDiscount = !!prod.discountPercent && prod.discountPercent > 0;
    const currentPrice = hasDiscount 
      ? Math.round(prod.price * (1 - prod.discountPercent / 100))
      : prod.price;
    const oldPrice = hasDiscount 
      ? prod.price 
      : (prod.oldPrice || undefined);
    return { currentPrice, oldPrice, discountPercent: prod.discountPercent };
  };

  // --- Helpers for Cart actions ---
  const addToCart = (productId: string, qty: number = 1) => {
    setCart((prev) => {
      const match = prev.find((item) => item.productId === productId);
      if (match) {
        return prev.map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + qty } : item
        );
      }
      return [...prev, { productId, quantity: qty }];
    });
    // Trigger the beautiful success popup notification matching screenshot
    setAddedProductPopup({ productId, qty });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const updateCartQty = (productId: string, change: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const finalQty = item.quantity + change;
            return { ...item, quantity: finalQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  // Cart summary calculator
  const getCartTotals = () => {
    let subtotal = 0;
    cart.forEach((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        const { currentPrice } = getProductPrices(product);
        subtotal += currentPrice * item.quantity;
      }
    });

    const discount = promoApplied ? subtotal * (promoDiscountPercent / 100) : 0; // Dynamic coupon discount percentage
    const selectedAreaObj = shippingAreas.find((a) => a.id === checkoutArea || a.name === checkoutArea);
    const shippingCharge = selectedAreaObj ? selectedAreaObj.charge : (shippingAreas[0]?.charge || 0);
    const total = subtotal - discount + shippingCharge;

    return { subtotal, discount, shippingCharge, total };
  };

  // --- Wishlist management ---
  const toggleWishlist = (productId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  // --- Authentication Handlers ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPhone || !loginPassword) {
      setAuthError('Please fill in all fields');
      return;
    }

    // Guard/Check for master Admin Login
    const adminPassword = localStorage.getItem('rk_admin_password') || 'rkfurniture0123';
    if (loginPhone === '01700000000') {
      if (loginPassword === adminPassword) {
        // Log into Firebase Auth as admin
        try {
          const adminEmail = 'admin@rkfurniture.com';
          try {
            await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
          } catch (fbErr: any) {
            if (fbErr.code === 'auth/user-not-found' || fbErr.code === 'auth/invalid-credential') {
              try {
                await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
              } catch (_) {}
            }
          }
        } catch (_) {}

        setUser({
          name: 'RK Furniture Admin',
          phone: '01700000000',
          email: 'admin@rkfurniture.com',
          isLoggedIn: true
        });
        setAuthError('');
        setLoginPhone('');
        setLoginPassword('');
        setView('admin_dashboard');
        return;
      } else {
        setAuthError('Incorrect Admin Password.');
        return;
      }
    }

    const registered = registeredUsers[loginPhone];
    if (!registered) {
      setAuthError('This phone number is not registered. Please sign up first.');
      return;
    }
    if (registered.password && registered.password !== loginPassword) {
      setAuthError('Incorrect password. Please try again.');
      return;
    }

    // Firebase Auth Authentication Integration
    const targetEmail = registered.email || `${loginPhone}@rkfurniture.com`;
    try {
      await signInWithEmailAndPassword(auth, targetEmail, loginPassword);
    } catch (fbError: any) {
      // Auto-migrate user to Firebase Auth if they exist in DB/localStorage but are missing in Firebase Auth
      if (fbError.code === 'auth/user-not-found' || fbError.code === 'auth/invalid-credential') {
        try {
          await createUserWithEmailAndPassword(auth, targetEmail, loginPassword);
          const currentUser = auth.currentUser;
          if (currentUser) {
            await updateProfile(currentUser, { displayName: registered.name });
          }
        } catch (signupErr: any) {
          console.error('Firebase auto-migration failed:', signupErr);
          setAuthError('Firebase Auth Error: ' + signupErr.message);
          return;
        }
      } else {
        setAuthError('Firebase Auth Error: ' + fbError.message);
        return;
      }
    }

    setUser({
      name: registered.name,
      phone: loginPhone,
      email: registered.email,
      isLoggedIn: true
    });
    setAuthError('');
    // Clear inputs
    setLoginPhone('');
    setLoginPassword('');
    // Guide back
    setView('dashboard');
    setDashboardView('stats');
    setCurrentTab('profile');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName || !signupPhone || !signupPassword || !signupConfirmPassword) {
      setAuthError('Please fill in all asterisks (*) fields');
      return;
    }
    if (signupPhone === '01700000000') {
      setAuthError('This mobile number is reserved for admin.');
      return;
    }
    if (signupPassword.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }

    // Connect to Firebase Authentication
    const targetEmail = signupEmail || `${signupPhone}@rkfurniture.com`;
    try {
      const userCred = await createUserWithEmailAndPassword(auth, targetEmail, signupPassword);
      if (userCred.user) {
        await updateProfile(userCred.user, { displayName: signupName });
      }
    } catch (fbError: any) {
      console.error('Firebase Auth Signup Error:', fbError);
      setAuthError('Firebase Auth Error: ' + fbError.message);
      return;
    }
    
    const userObj = { 
      name: signupName, 
      email: signupEmail || 'shuvojahedurrahman15@gmail.com',
      password: signupPassword
    };

    const newRegistered = {
      ...registeredUsers,
      [signupPhone]: userObj
    };
    setRegisteredUsers(newRegistered);

    // Save to server global DB
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: signupPhone, userObj })
    }).catch(err => console.error('Error posting registration to server:', err));

    setUser({
      name: signupName,
      phone: signupPhone,
      email: signupEmail || 'shuvojahedurrahman15@gmail.com',
      isLoggedIn: true
    });
    setAuthError('');
    // Clear fields
    setSignupName('');
    setSignupPhone('');
    setSignupEmail('');
    setSignupPassword('');
    setSignupConfirmPassword('');
    // Route to Dashboard
    setView('dashboard');
    setDashboardView('stats');
    setCurrentTab('profile');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Firebase Auth logout error:', err);
    }
    setUser({ name: '', phone: '', email: '', isLoggedIn: false });
    setView('home');
    setCurrentTab('home');
  };

  // Password change simulator
  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordResetMessage({ text: 'Please fill in all password fields.', type: 'error' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordResetMessage({ text: 'New passwords do not match.', type: 'error' });
      return;
    }
    setPasswordResetMessage({ text: 'Password changed successfully!', type: 'success' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  // Add Address Handler
  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddressName || !newAddressMobile || !newAddressDetails) {
      alert('All marked fields are required!');
      return;
    }
    const nAddress: ShippingAddress = {
      id: Date.now().toString(),
      name: newAddressName,
      mobile: newAddressMobile,
      email: newAddressEmail,
      address: newAddressDetails
    };
    setAddresses((prev) => [...prev, nAddress]);
    setNewAddressName('');
    setNewAddressMobile('');
    setNewAddressEmail('');
    setNewAddressDetails('');
    setShowAddAddressModal(false);
  };

  // Promo Code trigger checks
  const handleApplyPromo = () => {
    if (!promoInput) return;
    const cleanCode = promoInput.trim().toLowerCase();
    const found = coupons.find((c: any) => c.code.toLowerCase() === cleanCode && c.isActive);
    if (found) {
      setPromoApplied(true);
      setPromoDiscountPercent(found.discountPercent);
      setPromoMessage(`অভিনন্দন! আপনার "${found.code}" কোডটি সফলভাবে যুক্ত হয়েছে। আপনি ${found.discountPercent}% ছাড় পেয়েছেন।`);
    } else {
      setPromoApplied(false);
      setPromoDiscountPercent(0);
      setPromoMessage('ভুল কিংবা নিষ্ক্রিয় কোড! অনুগ্রহ করে যাচাই করে পুনরায় চেষ্টা করুন।');
    }
  };

  // --- Place Order creation workflow ---
  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutName || !checkoutMobile || !checkoutAddress) {
      alert('Please fill in your name, mobile and address details!');
      return;
    }

    const { subtotal, discount, shippingCharge, total } = getCartTotals();

    // Map cart items
    const orderProducts = cart
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (product) {
          return { product, quantity: item.quantity };
        }
        return null;
      })
      .filter((p) => p !== null) as { product: Product; quantity: number }[];

    // Format new ID
    const dateObj = new Date();
    const dateString = dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }) + ' at ' + dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const stamp = dateObj.getFullYear() +
      String(dateObj.getMonth() + 1).padStart(2, '0') +
      String(dateObj.getDate()).padStart(2, '0') + '-' +
      String(Date.now()).slice(-8);

    const selectedAreaObj = shippingAreas.find((a) => a.id === checkoutArea || a.name === checkoutArea);
    const isGlobal = selectedAreaObj?.name?.toLowerCase().includes('global');
    const finalAddress = isGlobal
      ? `${checkoutAddress} (Country: ${checkoutGlobalCountry}, City: ${checkoutGlobalCity} [Global Delivery])`
      : checkoutAddress;

    const newOrder: Order = {
      id: stamp,
      orderNumber: stamp,
      date: dateString,
      customerName: checkoutName,
      customerMobile: checkoutMobile,
      deliveryAddress: finalAddress,
      shippingArea: selectedAreaObj ? selectedAreaObj.name : checkoutArea,
      shippingCharge,
      paymentMethod: 'Cash on Delivery',
      subtotal,
      total,
      status: 'pending',
      products: orderProducts,
      note: checkoutNote
    };

    setOrders((prev) => [newOrder, ...prev]);
    // Save globally to Express server
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder)
    }).catch(err => console.error('Error posting order to server:', err));
    setLatestPlacedOrder(newOrder);
    setViewReceiptOrder(newOrder); // Automatically open the invoice!
    setCart([]); // Reset Cart
    setPromoApplied(false);
    setPromoInput('');
    setPromoMessage('');
    setView('order_success');
  };

  // --- Order Tracking Search engine ---
  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackQuery.trim()) {
      setTrackError('Please enter a valid Order Code or Phone Number');
      setScannedOrder(null);
      return;
    }

    const cleanedQuery = trackQuery.trim();
    // Search by order code or customer phone matching
    const found = orders.find(
      (o) =>
        o.orderNumber === cleanedQuery ||
        o.customerMobile.includes(cleanedQuery) ||
        cleanedQuery.includes(o.customerMobile)
    );

    if (found) {
      setScannedOrder(found);
      setTrackError('');
    } else {
      setTrackError('No orders match your criteria. Please verify and try again.');
      setScannedOrder(null);
    }
  };

  const handleRefreshProductsFromAdmin = () => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
        }
      })
      .catch((err) => console.error('Failed to sync products from admin page:', err));
  };

  if (appLoading) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[9999]">
        <div className="relative flex flex-col items-center select-none">
          {/* Circular spinner matching user image precisely: light-grey circle on bottom, dark-arc spinning on top */}
          <div className="w-16 h-16 rounded-full border-[6px] border-[#e2e8f0] border-t-[#222222] animate-spin mb-5" />
          <span className="text-[#222222] text-xl font-extrabold tracking-wide font-sans">Loading...</span>
        </div>
      </div>
    );
  }

  if (view === 'admin_dashboard' && user.isLoggedIn && user.phone === '01700000000') {
    return (
      <AdminDashboard
        user={user}
        onLogout={handleLogout}
        allProducts={products}
        onRefreshProducts={handleRefreshProductsFromAdmin}
        slides={slides}
        onRefreshSlides={() => {
          fetch('/api/slides')
            .then((res) => res.json())
            .then((data) => {
              if (Array.isArray(data) && data.length > 0) {
                setSlides(data);
              }
            })
            .catch((err) => console.error('Failed to sync slides from admin:', err));
        }}
      />
    );
  }

  return (
    <div className="bg-[#fcfaf7] min-h-screen text-slate-800 pb-20 select-none antialiased font-sans flex flex-col justify-between">
      {/* --- Sticky Top Header --- */}
      <div>
        <Navbar
          user={user}
          cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
          onCartToggle={() => setCartDrawerOpen(true)}
          onSearchToggle={() => setSearchOpen(true)}
          onLoginClick={() => {
            if (user.isLoggedIn) {
              if (user.phone === '01700000000') {
                setView('admin_dashboard');
              } else {
                setView('dashboard');
                setDashboardView('stats');
              }
            } else {
              setView('auth');
              setAuthView('login');
            }
          }}
          onLogoClick={() => {
            setView('home');
            setSelectedProductId(null);
            setSelectedCategory(null);
          }}
        />

        {/* --- Main Contents Panel --- */}
        <main className="max-w-4xl mx-auto px-4 py-5 w-full">
          {/* --- VIEW 1: HOME PANEL --- */}
          {view === 'home' && (
            <div className="space-y-6">
              {selectedCategory ? (
                /* --- DEDICATED CATEGORY LOOK (MATCHES USER SCREENSHOTS) --- */
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 -mt-5"
                >
                  {/* Category Info Header Banner block with back button and dresser icon */}
                  <div className="bg-white border-b border-t border-slate-100 p-4 -mx-4 sm:-mx-6 flex items-center gap-3">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="p-2 rounded-full hover:bg-slate-50 transition-colors cursor-pointer text-slate-700 flex items-center justify-center focus:outline-none"
                      id="btn-category-back"
                      title="Back to home"
                    >
                      <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                    </button>

                    {(() => {
                      const activeCat = categories.find(c => c.name === selectedCategory);
                      return activeCat?.image ? (
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                          <img
                            src={activeCat.image}
                            alt={selectedCategory}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200/50 flex items-center justify-center shrink-0 shadow-sm justify-center">
                          <CabinetIcon />
                        </div>
                      );
                    })()}

                    <div className="text-left">
                      <h3 className="font-extrabold text-slate-800 text-base leading-none font-sans">
                        {selectedCategory}
                      </h3>
                      <p className="text-xs text-slate-400 font-bold mt-1 font-sans">
                        {products.filter(p => p.category === selectedCategory).length} Products
                      </p>
                    </div>
                  </div>

                  {/* Grid Layout of category products mirroring Image 2 */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {products
                      .filter((p) => p.category === selectedCategory)
                      .map((prod) => {
                        const inWish = wishlist.includes(prod.id);
                        return (
                          <motion.div
                            key={prod.id}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-2xl overflow-hidden border border-slate-100/70 shadow-sm hover:shadow-md transition-all relative flex flex-col justify-between"
                          >
                            {/* Product Image Cover block */}
                            <div
                              onClick={() => {
                                setSelectedProductId(prod.id);
                                setView('product_detail');
                              }}
                              className="h-32 sm:h-44 bg-slate-50 relative flex items-center justify-center overflow-hidden cursor-pointer group"
                            >
                              {prod.image === 'placeholder_box' ? (
                                <div className="p-6 animate-pulse">
                                  <BoxWithRays className="w-18 h-18 text-slate-400" />
                                </div>
                              ) : (
                                <img
                                  src={prod.image}
                                  alt={prod.name}
                                  className="w-full h-full object-cover group-hover:scale-105 duration-300"
                                  referrerPolicy="no-referrer"
                                />
                              )}
                            </div>

                            {/* Details and Actions block */}
                            <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                              <div
                                onClick={() => {
                                  setSelectedProductId(prod.id);
                                  setView('product_detail');
                                }}
                                className="cursor-pointer space-y-0.5 block text-left"
                              >
                                <h4 className="font-extrabold text-slate-800 hover:text-green-700 tracking-tight font-sans text-xs sm:text-sm line-clamp-2 min-h-[32px] sm:min-h-[40px] leading-tight font-sans">
                                  {prod.name}
                                </h4>
                              </div>

                              {/* Price stack with optional strikeout */}
                              {(() => {
                                const { currentPrice, oldPrice } = getProductPrices(prod);
                                return (
                                  <div className="flex items-center flex-wrap gap-2 text-left font-mono">
                                    <span className="text-[#c25927] font-black text-xs sm:text-sm">
                                      {currentPrice.toLocaleString()} AED
                                    </span>
                                    {oldPrice && (
                                      <span className="text-slate-400 font-bold line-through text-[10px] sm:text-xs">
                                        {oldPrice.toLocaleString()} AED
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}

                              {/* Interactive actions identical to premium trending style */}
                              <div className="space-y-1.5 pt-1">
                                <div className="grid grid-cols-[1fr_auto] gap-1.5 font-sans">
                                  <button
                                    onClick={() => addToCart(prod.id, 1)}
                                    className="flex items-center justify-center gap-1 border border-[#15803d]/40 text-[#15803d] rounded-xl text-[10px] sm:text-xs font-bold py-1.5 hover:bg-[#15803d]/5 active:scale-95 transition-all text-center cursor-pointer focus:outline-none"
                                  >
                                    <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                                    <span>Add to Cart</span>
                                  </button>
                                  <button
                                    onClick={(e) => toggleWishlist(prod.id, e)}
                                    className="p-1.5 sm:p-2 border border-slate-100 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-red-500 transition-colors cursor-pointer flex items-center justify-center focus:outline-none text-slate-400"
                                  >
                                    <Heart className={`w-3.5 h-3.5 shrink-0 ${inWish ? 'fill-red-500 text-red-500' : ''}`} />
                                  </button>
                                </div>
                                <button
                                  onClick={() => {
                                    addToCart(prod.id, 1);
                                    setView('checkout');
                                  }}
                                  className="w-full bg-[#15803d] hover:bg-[#15803d]/90 text-white rounded-xl text-[10px] sm:text-xs font-bold py-2 flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm cursor-pointer focus:outline-none"
                                >
                                  <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                                  <span>Buy Now</span>
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                  </div>

                  {products.filter(p => p.category === selectedCategory).length === 0 && (
                    <div className="py-12 text-center text-slate-400 text-sm font-sans bg-white border border-slate-100 rounded-2xl">
                      No products found in this category.
                    </div>
                  )}
                </motion.div>
              ) : (
                <>
                  {/* Promo Banner / Carousel */}
                  {(() => {
                    const currentSlide = slides[activeSlide] || slides[0];
                    if (!currentSlide) return null;
                    return (
                      <div className="relative rounded-2xl overflow-hidden h-44 sm:h-56 shadow-md border-r-4 border-[#c25927] flex items-center">
                        <img
                          src={currentSlide.bg}
                          alt="Banner"
                          className="absolute inset-0 w-full h-full object-cover brightness-[0.4]"
                          referrerPolicy="no-referrer"
                        />
                        <div className="relative z-10 p-6 text-white max-w-sm space-y-1.5">
                          <h2 className="font-extrabold text-xl sm:text-2xl leading-none text-orange-100 font-sans tracking-tight">
                            {currentSlide.title}
                          </h2>
                          <p className="text-[11px] sm:text-xs text-slate-200">
                            {currentSlide.subtitle}
                          </p>
                          <button
                            onClick={() => {
                              setSelectedCategory(null);
                              const el = document.getElementById('section-trending-products') || document.getElementById('section-all-products');
                              if (el) {
                                el.scrollIntoView({ behavior: 'smooth' });
                              }
                            }}
                            className="mt-2 text-[10px] bg-[#c25927] hover:bg-[#b04d20] cursor-pointer font-bold px-3 py-1 rounded transition text-white"
                          >
                            Browse Collections
                          </button>
                        </div>
                      </div>
                    );
                  })()}


              {/* --- 1. TRENDING PRODUCTS --- */}
              {(() => {
                const trendingProds = products.filter(p => p.isTrending && (!selectedCategory || p.category === selectedCategory));
                if (trendingProds.length === 0) return null;
                return (
                  <div className="space-y-4" id="section-trending-products">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-slate-800 text-base sm:text-lg tracking-tight font-sans">
                        Trending Products
                      </h3>
                      <button
                        onClick={() => setView('trending_products')}
                        className="bg-[#15803d] hover:bg-[#15803d]/90 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors cursor-pointer focus:outline-none shadow-sm"
                        id="btn-trending-view-more"
                      >
                        View More
                      </button>
                    </div>

                    {/* Horizontal slider container */}
                    <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x no-scrollbar select-none">
                      {trendingProds.map((prod) => {
                        const inWish = wishlist.includes(prod.id);
                        return (
                          <motion.div
                            key={`trending-${prod.id}`}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-[280px] shrink-0 bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                            id={`trending-card-${prod.id}`}
                          >
                            {/* Product cover image */}
                            <div
                              onClick={() => {
                                setSelectedProductId(prod.id);
                                setView('product_detail');
                              }}
                              className="h-44 bg-slate-50 relative flex items-center justify-center overflow-hidden cursor-pointer group"
                            >
                              {prod.image === 'placeholder_box' ? (
                                <div className="p-6">
                                  <BoxWithRays className="w-18 h-18 text-slate-400" />
                                </div>
                              ) : (
                                <img
                                  src={prod.image}
                                  alt={prod.name}
                                  className="w-full h-full object-cover group-hover:scale-105 duration-300"
                                  referrerPolicy="no-referrer"
                                />
                              )}
                            </div>

                            {/* Info card details */}
                            <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
                              <div
                                onClick={() => {
                                  setSelectedProductId(prod.id);
                                  setView('product_detail');
                                }}
                                className="cursor-pointer space-y-1 block text-left"
                              >
                                <h4 className="font-extrabold text-slate-800 hover:text-green-700 tracking-tight font-sans text-sm sm:text-base leading-tight line-clamp-1">
                                  {prod.name}
                                </h4>
                              </div>

                              {/* Price tier with comparison */}
                              {(() => {
                                const { currentPrice, oldPrice } = getProductPrices(prod);
                                return (
                                  <div className="flex items-center gap-2 text-left">
                                    <span className="text-[#c25927] font-black text-base sm:text-lg">
                                      {currentPrice.toLocaleString()} AED
                                    </span>
                                    {oldPrice && (
                                      <span className="text-slate-400 font-bold line-through text-xs">
                                        {oldPrice.toLocaleString()} AED
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}

                              {/* Action buttons mirroring user screenshot */}
                              <div className="space-y-1.5 pt-1.5">
                                <div className="grid grid-cols-[1fr_auto] gap-1.5">
                                  <button
                                    onClick={() => addToCart(prod.id, 1)}
                                    className="flex items-center justify-center gap-1.5 border border-[#15803d]/40 text-[#15803d] rounded-xl text-xs font-bold py-2 hover:bg-[#15803d]/5 active:scale-95 transition-all text-center cursor-pointer focus:outline-none"
                                    id={`btn-add-cart-t-${prod.id}`}
                                  >
                                    <ShoppingCart className="w-3.5 h-3.5" />
                                    <span>Add to Cart</span>
                                  </button>
                                  <button
                                    onClick={(e) => toggleWishlist(prod.id, e)}
                                    className="p-2.5 border border-slate-100 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-red-500 transition-colors cursor-pointer flex items-center justify-center focus:outline-none"
                                    id={`btn-wishlist-t-${prod.id}`}
                                  >
                                    <Heart className={`w-4 h-4 ${inWish ? 'fill-red-500 text-red-500' : ''}`} />
                                  </button>
                                </div>
                                <button
                                  onClick={() => {
                                    addToCart(prod.id, 1);
                                    setView('checkout');
                                  }}
                                  className="w-full bg-[#15803d] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold py-2 flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm cursor-pointer focus:outline-none"
                                  id={`btn-buy-now-t-${prod.id}`}
                                >
                                  <ShoppingBag className="w-3.5 h-3.5" />
                                  <span>Buy Now</span>
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* --- 2. ALL PRODUCTS --- */}
              <div className="space-y-4" id="section-all-products">
                {/* Featured Category Banner with wardrobe box logo */}
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
                  <div className="space-y-1 block text-left">
                    <h3 className="font-extrabold text-slate-800 text-base sm:text-lg flex items-center gap-1.5 font-sans">
                      <LayoutGrid className="w-4.5 h-4.5 text-[#15803d]" />
                      <span>All Products</span>
                    </h3>
                    <p className="text-slate-400 text-xs">Premium handcrafted accessories and wooden crafts</p>
                  </div>
                  
                  {selectedCategory && (
                    <div className="flex items-center gap-1.5 bg-[#15803d]/10 text-[#15803d] px-3 py-1 rounded-full text-[11px] font-bold self-start border border-[#15803d]/20 shadow-sm">
                      <span>Category: {selectedCategory}</span>
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className="hover:bg-[#15803d]/20 rounded-full p-0.5 transition-colors cursor-pointer"
                        title="Clear Filter"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Products Cards Grid Layout */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {products
                    .filter((p) => !selectedCategory || p.category === selectedCategory)
                    .map((prod) => {
                    const inWish = wishlist.includes(prod.id);
                    return (
                      <motion.div
                        key={prod.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl overflow-hidden border border-slate-100/50 shadow-sm hover:shadow transition-all relative flex flex-col"
                      >
                        {/* Wishlist toggle absolute button */}
                        <button
                          onClick={(e) => toggleWishlist(prod.id, e)}
                          className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/90 backdrop-blur border border-slate-50 shadow-sm z-10 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Heart className={`w-4 h-4 ${inWish ? 'fill-red-500 text-red-500' : ''}`} />
                        </button>

                        {/* Cover Image/Vector Display */}
                        <div
                          onClick={() => {
                            setSelectedProductId(prod.id);
                            setView('product_detail');
                          }}
                          className="h-32 sm:h-44 bg-slate-50 relative flex items-center justify-center overflow-hidden cursor-pointer group"
                        >
                          {prod.image === 'placeholder_box' ? (
                            <div className="duration-300 group-hover:scale-105 p-6 animate-pulse">
                              <BoxWithRays className="w-18 h-18 sm:w-24 sm:h-24 text-slate-800" />
                            </div>
                          ) : (
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-full h-full object-cover group-hover:scale-105 duration-300"
                              referrerPolicy="no-referrer"
                            />
                          )}
                        </div>

                        {/* Content details block */}
                        <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                          <div
                            onClick={() => {
                              setSelectedProductId(prod.id);
                              setView('product_detail');
                            }}
                            className="cursor-pointer space-y-0.5 block text-left"
                          >
                            <h4 className="font-bold text-slate-800 tracking-tight hover:text-green-700 font-sans text-sm sm:text-base leading-tight">
                              {prod.name}
                            </h4>
                          </div>

                          {/* Price & action stack */}
                          <div className="space-y-2 text-left">
                            {(() => {
                              const { currentPrice, oldPrice } = getProductPrices(prod);
                              return (
                                <div className="flex items-center gap-2 flex-wrap text-left font-mono">
                                  <span className="text-[#c25927] font-extrabold text-xs sm:text-sm">
                                    {currentPrice.toLocaleString()} AED
                                  </span>
                                  {oldPrice && (
                                    <span className="text-slate-400 font-bold line-through text-[10px] sm:text-xs">
                                      {oldPrice.toLocaleString()} AED
                                    </span>
                                  )}
                                </div>
                              );
                            })()}

                            <div className="grid grid-cols-2 gap-1.5">
                              <button
                                onClick={() => addToCart(prod.id, 1)}
                                className="text-[10px] sm:text-xs font-semibold py-1.5 px-2 text-center rounded border border-[#15803d]/40 text-[#15803d] hover:bg-[#15803d]/5 active:scale-95 transition-all cursor-pointer"
                              >
                                Add to Cart
                              </button>
                              <button
                                onClick={() => {
                                  addToCart(prod.id, 1);
                                  setView('checkout');
                                }}
                                className="text-[10px] sm:text-xs font-semibold py-1.5 px-2 text-center rounded bg-[#15803d] hover:bg-emerald-800 text-white active:scale-95 transition-all shadow-sm cursor-pointer"
                              >
                                Buy Now
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Order Tracking Fast Access Footer bar */}
              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="font-bold text-slate-800 text-sm sm:text-base flex items-center justify-center sm:justify-start gap-1">
                    <Clock className="w-4 h-4 text-orange-600 animate-spin-slow" />
                    <span>Track Your Furniture Order Status</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Instantly monitor processing stages, shipping dispatches & deliveries.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setView('track_order');
                    setTrackQuery('');
                    setScannedOrder(null);
                  }}
                  className="bg-[#c25927] hover:bg-[#a6481c] text-white font-bold text-xs py-2 px-5 rounded-lg shadow-md transition whitespace-nowrap"
                >
                  Track Order
                </button>
              </div>
              </>
              )}
            </div>
          )}


          {/* --- VIEW: TRENDING PRODUCTS SCREEN (AS IN USER SCREENSHOT) --- */}
          {view === 'trending_products' && (
            <div className="space-y-4 -mt-5">
              {/* Top Header Row with Back Button */}
              <div className="-mx-4 px-4 bg-white py-3.5 shadow-sm border-b border-slate-100 flex items-center gap-4">
                <button
                  onClick={() => setView('home')}
                  className="p-1.5 hover:bg-slate-50 active:scale-95 rounded-full transition text-slate-700 cursor-pointer focus:outline-none"
                  id="btn-trending-back"
                >
                  <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                </button>
                <div className="text-left">
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight font-sans">
                    Trending Products
                  </h3>
                  <p className="text-[11px] text-slate-400 font-bold">
                    {products.filter(p => p.isTrending).length} Products
                  </p>
                </div>
              </div>

              {/* Grid of isTrending Products */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {products.filter(p => p.isTrending).map((prod) => {
                  const inWish = wishlist.includes(prod.id);
                  return (
                    <motion.div
                      key={`grid-trending-${prod.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                      id={`grid-trending-card-${prod.id}`}
                    >
                      {/* Cover view */}
                      <div
                        onClick={() => {
                          setSelectedProductId(prod.id);
                          setView('product_detail');
                        }}
                        className="h-40 sm:h-48 bg-slate-50 relative flex items-center justify-center overflow-hidden cursor-pointer group"
                      >
                        {prod.image === 'placeholder_box' ? (
                          <div className="p-6">
                            <BoxWithRays className="w-18 h-18 text-slate-400" />
                          </div>
                        ) : (
                          <img
                            src={prod.image}
                            alt={prod.name}
                            className="w-full h-full object-cover group-hover:scale-105 duration-300"
                            referrerPolicy="no-referrer"
                          />
                        )}
                      </div>

                      {/* Info & Details */}
                      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div
                          onClick={() => {
                            setSelectedProductId(prod.id);
                            setView('product_detail');
                          }}
                          className="cursor-pointer space-y-0.5 text-center block"
                        >
                          <h4 className="font-bold text-slate-800 hover:text-green-700 tracking-tight font-sans text-xs sm:text-sm line-clamp-2 min-h-[36px] leading-snug">
                            {prod.name}
                          </h4>
                        </div>

                        {/* Price centered with cross-out */}
                        {(() => {
                          const { currentPrice, oldPrice } = getProductPrices(prod);
                          return (
                            <div className="flex justify-center items-center gap-1.5 flex-wrap">
                              <span className="text-[#c25927] font-extrabold text-xs sm:text-sm">
                                {currentPrice.toLocaleString()} AED
                              </span>
                              {oldPrice && (
                                <span className="text-slate-400 font-semibold line-through text-[10px] sm:text-xs">
                                  {oldPrice.toLocaleString()} AED
                                </span>
                              )}
                            </div>
                          );
                        })()}

                        {/* Button stack mimicking exactly the layout */}
                        <div className="space-y-1.5 pt-1">
                          <div className="grid grid-cols-[1fr_auto] gap-1.5">
                            <button
                              onClick={() => addToCart(prod.id, 1)}
                              className="flex items-center justify-center gap-1 border border-emerald-500/30 text-emerald-700 bg-white hover:bg-emerald-50 active:scale-95 transition-all text-[11px] font-bold py-2 px-2.5 rounded-lg cursor-pointer focus:outline-none"
                              id={`grid-btn-cart-${prod.id}`}
                            >
                              <ShoppingCart className="w-3 h-3 text-emerald-600" />
                              <span>Add to Cart</span>
                            </button>
                            <button
                              onClick={(e) => toggleWishlist(prod.id, e)}
                              className={`p-2 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-center focus:outline-none ${
                                inWish ? 'text-red-500 bg-red-50/50' : 'text-slate-400'
                              }`}
                              id={`grid-btn-wish-${prod.id}`}
                            >
                              <Heart className={`w-3.5 h-3.5 ${inWish ? 'fill-current text-red-500' : ''}`} />
                            </button>
                          </div>

                          <button
                            onClick={() => {
                              addToCart(prod.id, 1);
                              setView('checkout');
                            }}
                            className="w-full bg-[#15803d] hover:bg-emerald-800 text-white flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold leading-tight transition active:scale-95 cursor-pointer focus:outline-none shadow-sm"
                            id={`grid-btn-buy-${prod.id}`}
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Buy Now</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}


          {/* --- VIEW 2: PRODUCT DETAIL VIEW --- */}
          {view === 'product_detail' && (() => {
            const prod = products.find((p) => p.id === selectedProductId);
            return prod ? (
              <ProductDetailView
                prod={prod}
                onBack={() => {
                  setView('home');
                  setSelectedProductId(null);
                }}
                addToCart={addToCart}
                setView={setView}
              />
            ) : (
              <p className="text-center font-bold text-slate-500 py-10">Product not found.</p>
            );
          })()}


          {/* --- VIEW 3: CHECKOUT SCREEN --- */}
          {view === 'checkout' && (
            <div className="space-y-5">
              {/* Checkout page header */}
              <button
                onClick={() => setView('home')}
                className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Shopping</span>
              </button>

              <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Left side: Billing / Shipment Form inputs */}
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
                  <h3 className="font-extrabold text-base text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5 font-sans">
                    <User className="text-[#15803d] w-4.5 h-4.5" />
                    <span>Billing & Shipping Information</span>
                  </h3>

                  {/* Name field */}
                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-slate-600 block">Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Your Name"
                      value={checkoutName}
                      onChange={(e) => setCheckoutName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-[#15803d]"
                    />
                  </div>

                  {/* Mobile field with UAE Flag dropdown indicator */}
                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-slate-600 block">Mobile Number *</label>
                    <div className="flex">
                      {/* Flag dropdown style */}
                      <div className="bg-slate-100 border border-slate-200 border-r-0 rounded-l-lg px-2.5 flex items-center gap-1 text-xs text-slate-500 select-none">
                        {/* UAE flag */}
                        <div className="w-5 h-3.5 flex border border-slate-200/40 rounded overflow-hidden relative shrink-0">
                          <div className="w-[30%] bg-red-600 h-full"></div>
                          <div className="flex-1 flex flex-col h-full">
                            <div className="h-1/3 bg-emerald-600"></div>
                            <div className="h-1/3 bg-white"></div>
                            <div className="h-1/3 bg-black"></div>
                          </div>
                        </div>
                        <span>+971</span>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      </div>
                      <input
                        type="tel"
                        required
                        placeholder="Phone Number"
                        value={checkoutMobile}
                        onChange={(e) => setCheckoutMobile(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-r-lg p-2.5 text-xs text-slate-800 focus:outline-[#15803d]"
                      />
                    </div>
                  </div>

                  {/* Address Details */}
                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-slate-600 block">Delivery Address *</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="House, Road, Apartment, Post Area, District..."
                      value={checkoutAddress}
                      onChange={(e) => setCheckoutAddress(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-[#15803d] leading-relaxed resize-none"
                    />
                  </div>

                  {/* Shipping Area Selector */}
                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-slate-600 block mb-1">Shipping Area *</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      {shippingAreas.map((area) => {
                        const isSelected = checkoutArea === area.id || checkoutArea === area.name;
                        return (
                          <label
                            key={area.id}
                            className={`border rounded-xl p-3 flex flex-col justify-between cursor-pointer transition ${
                              isSelected
                                ? 'border-[#15803d] bg-emerald-50/20 shadow-sm'
                                : 'border-slate-200 bg-white hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex justify-between items-center w-full mb-1">
                              <span className="font-bold text-slate-800">{area.name}</span>
                              <input
                                type="radio"
                                name="shippingArea"
                                checked={isSelected}
                                onChange={() => setCheckoutArea(area.id)}
                                className="accent-[#15803d]"
                              />
                            </div>
                            <span className="text-[10px] text-[#15803d] font-bold">Charge: {area.charge} AED</span>
                            <span className="text-[10px] text-slate-400 font-sans mt-0.5">Estimated delivery time may vary</span>
                          </label>
                        );
                      })}
                    </div>

                    {(() => {
                      const selArea = shippingAreas.find(a => a.id === checkoutArea || a.name === checkoutArea);
                      return selArea?.name?.toLowerCase().includes('global') && (
                        <div className="mt-3 bg-blue-50/30 border border-blue-100 p-3 rounded-xl space-y-3 animation-fade-in">
                          <span className="font-bold text-blue-800 text-[11px] block">Global Shipment Detail (Specify your country and city):</span>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-slate-600 block mb-1">Country *</label>
                              <input 
                                type="text"
                                required
                                placeholder="e.g. United Kingdom"
                                value={checkoutGlobalCountry || ''}
                                onChange={(e) => setCheckoutGlobalCountry(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded p-2 text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-600 block mb-1">City *</label>
                              <input 
                                type="text"
                                required
                                placeholder="e.g. London"
                                value={checkoutGlobalCity || ''}
                                onChange={(e) => setCheckoutGlobalCity(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded p-2 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Right side: Your Order Summary Panel */}
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
                    <h3 className="font-extrabold text-base text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5 font-sans">
                      <ShoppingCart className="text-[#15803d] w-4.5 h-4.5" />
                      <span>Your Order Summary</span>
                    </h3>

                    {/* Cart Items small previews */}
                    <div className="divide-y divide-slate-50 max-h-36 overflow-y-auto pr-1 space-y-2">
                      {cart.map((item) => {
                        const product = products.find((p) => p.id === item.productId);
                        if (!product) return null;
                        return (
                          <div key={item.productId} className="flex justify-between items-center text-xs py-1">
                            <span className="text-slate-600 truncate font-semibold">
                              {product.name} <span className="text-slate-400 font-sans">x {item.quantity}</span>
                            </span>
                            <span className="font-bold text-slate-800">{(product.price * item.quantity).toLocaleString()} AED</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Promo/Coupon entry field */}
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Ticket className="absolute left-3 top-[10px] w-4 h-4 text-emerald-600" />
                        <input
                          type="text"
                          placeholder="Promo / Coupon Code (e.g. RK10)"
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 pl-9 text-xs focus:outline-none focus:border-[#15803d]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        className="bg-[#15803d] hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-lg transition duration-75 active:scale-95"
                      >
                        Apply
                      </button>
                    </div>
                    {promoMessage && (
                      <p className={`text-[10px] font-bold ${promoApplied ? 'text-[#15803d]' : 'text-red-500'}`}>
                        {promoMessage}
                      </p>
                    )}

                    {/* Total math sheet */}
                    {(() => {
                      const { subtotal, discount, shippingCharge, total } = getCartTotals();
                      return (
                        <div className="space-y-2 text-xs pt-3 border-t border-slate-50">
                          <div className="flex justify-between text-slate-600">
                            <span>Subtotal:</span>
                            <span>{subtotal.toLocaleString()} AED</span>
                          </div>
                          {promoApplied && (
                            <div className="flex justify-between text-[#15803d] font-semibold">
                              <span>Promo Discount ({promoDiscountPercent}%):</span>
                              <span>- {discount.toLocaleString()} AED</span>
                            </div>
                          )}
                          <div className="flex justify-between text-slate-600">
                            <span>Delivery Charge:</span>
                            <span>{shippingCharge.toLocaleString()} AED</span>
                          </div>
                          <div className="flex justify-between text-sm font-extrabold text-[#c25927] border-t border-slate-100 pt-2 font-sans">
                            <span>Total Payable Amount:</span>
                            <span className="text-[#c25927]">{total.toLocaleString()} AED</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Note Box */}
                    <div className="space-y-1 text-xs">
                      <label className="font-bold text-slate-600 block">Order Note (Optional)</label>
                      <textarea
                        rows={2}
                        placeholder="Special shipping note, preferred hours, etc."
                        value={checkoutNote}
                        onChange={(e) => setCheckoutNote(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[11px] text-slate-800 focus:outline-[#15803d] resize-none"
                      />
                    </div>
                  </div>

                  {/* Payment option defaults to COD */}
                  <div className="bg-[#f2f8f2] border border-[#d2edd2] rounded-xl p-4 text-xs flex gap-2 items-start">
                    <CheckCircle className="w-5 h-5 text-[#15803d] shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-bold text-[#15803d]">Cash on Delivery Only</p>
                      <p className="text-slate-500 text-[10px]">
                        Verify and pay upon safe material delivery right at your door.
                      </p>
                    </div>
                  </div>

                  {/* Submit checkout CTA button */}
                  <button
                    type="submit"
                    className="w-full bg-[#15803d] hover:bg-emerald-800 text-white font-extrabold text-sm py-3 rounded-2xl shadow-lg hover:shadow-xl transition flex items-center justify-center gap-1.5 focus:outline-none"
                  >
                    <span>Place Order</span>
                  </button>
                </div>
              </form>
            </div>
          )}


          {/* --- VIEW 4: ORDER SUCCESS PANEL --- */}
          {view === 'order_success' && latestPlacedOrder && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm max-w-lg mx-auto text-center space-y-6"
            >
              <div className="inline-flex p-4 rounded-full bg-emerald-50 text-emerald-600 mb-2">
                <CheckCircle className="w-12 h-12" />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight font-sans">
                  Order placed successfully!
                </h2>
                <p className="text-xs text-[#15803d] font-bold">
                  Your purchase invoice has been initiated and logged!
                </p>
              </div>

              {/* Order Info snippet */}
              <div className="bg-slate-50 p-4 rounded-xl text-xs space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Order Number:</span>
                  <span className="font-mono font-bold text-slate-800">{latestPlacedOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Order Date:</span>
                  <span className="text-slate-600">{latestPlacedOrder.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Customer Name:</span>
                  <span className="text-slate-800 font-bold">{latestPlacedOrder.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Customer Mobile:</span>
                  <span className="text-slate-700 font-mono font-bold">{latestPlacedOrder.customerMobile}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-slate-400 font-semibold shrink-0 w-24">Delivery Address:</span>
                  <span className="text-slate-600 text-right leading-relaxed">{latestPlacedOrder.deliveryAddress}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2">
                  <span className="text-slate-400 font-bold">Order Total:</span>
                  <span className="text-[#c25927] font-extrabold text-sm">{latestPlacedOrder.total.toLocaleString()} AED</span>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 pt-3">
                <button
                  onClick={() => {
                    setViewReceiptOrder(latestPlacedOrder);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs py-2.5 rounded-xl transition"
                >
                  View Receipt
                </button>
                <button
                  onClick={() => {
                    setScannedOrder(latestPlacedOrder);
                    setView('track_order');
                    setTrackQuery(latestPlacedOrder.orderNumber);
                  }}
                  className="bg-[#15803d] hover:bg-emerald-800 text-white font-extrabold text-xs py-2.5 rounded-xl shadow transition"
                >
                  Track Order
                </button>
              </div>

              <button
                onClick={() => setView('home')}
                className="text-xs text-slate-400 hover:text-slate-600 font-semibold underline block mx-auto pt-2"
              >
                Go back to Homepage
              </button>
            </motion.div>
          )}


          {/* --- VIEW 5: TRACK ORDER SCREEN --- */}
          {view === 'track_order' && (
            <div className="space-y-6">
              {/* Heading */}
              <div className="text-center space-y-1 max-w-sm mx-auto">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight font-sans">
                  Real-time Order Status
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Provide your unique order code or registered mobile phone to see shipping processing.
                </p>
              </div>

              {/* Form Input query block */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm max-w-md mx-auto">
                <form onSubmit={handleTrackSubmit} className="space-y-4">
                  <div className="space-y-1.5 text-xs text-left">
                    <label className="font-bold text-slate-600">Order Number / Mobile *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Order ID or Registered Mobile"
                      value={trackQuery}
                      onChange={(e) => setTrackQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-[#15803d]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#15803d] hover:bg-emerald-800 text-white font-bold text-xs py-2.5 rounded-xl shadow transition cursor-pointer"
                  >
                    Search Order Status
                  </button>
                </form>

                {trackError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] text-red-600 text-left mt-3">
                    {trackError}
                  </div>
                )}
              </div>

              {/* Stepper Status Tracking Block */}
              {scannedOrder && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm max-w-md mx-auto space-y-6"
                >
                  <div className="border-b border-slate-50 pb-3 flex justify-between items-center text-xs">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400">TRACKING ORDER:</p>
                      <p className="font-mono font-bold text-slate-800">{scannedOrder.orderNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400">PLACED ON:</p>
                      <p className="text-slate-600 font-semibold">{scannedOrder.date.split(' at ')[0]}</p>
                    </div>
                  </div>

                  {/* Vertical Stepper layout representation */}
                  <div className="relative pl-6 space-y-6 text-xs text-left">
                    {/* Progress vertical divider bar */}
                    <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-slate-100">
                      <div
                        className="w-full bg-[#15803d]"
                        style={{
                          height:
                            scannedOrder.status === 'completed' || scannedOrder.status === 'completed'
                              ? '100%'
                              : scannedOrder.status === 'shipped'
                              ? '66%'
                              : scannedOrder.status === 'confirmed'
                              ? '33%'
                              : '0%'
                        }}
                      ></div>
                    </div>

                    {/* Step 1: Placed / Pending */}
                    <div className="relative flex gap-3.5 items-start">
                      <span className="absolute -left-6 top-1 w-4 h-4 bg-[#15803d] border-2 border-emerald-50 rounded-full flex items-center justify-center text-[8px] text-white font-bold">
                        ✓
                      </span>
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-800">Order Placed Successfully</p>
                        <p className="text-[10px] text-slate-400 font-medium">Logged on server and waiting verification.</p>
                      </div>
                    </div>

                    {/* Step 2: Confirmed */}
                    {(() => {
                      const isDone = ['confirmed', 'shipped', 'delivered', 'completed'].includes(scannedOrder.status);
                      return (
                        <div className="relative flex gap-3.5 items-start">
                          <span className={`absolute -left-6 top-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${
                            isDone ? 'bg-[#15803d] border-2 border-emerald-50 text-white' : 'bg-slate-100 text-slate-400'
                          }`}>
                            {isDone ? '✓' : '2'}
                          </span>
                          <div className="space-y-0.5">
                            <p className={`font-bold ${isDone ? 'text-slate-800' : 'text-slate-400'}`}>Payment/Order Confirmed</p>
                            <p className="text-[10px] text-slate-400 font-medium">Delivery executive assigned.</p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Step 3: Shipped */}
                    {(() => {
                      const isDone = ['shipped', 'delivered', 'completed'].includes(scannedOrder.status);
                      return (
                        <div className="relative flex gap-3.5 items-start">
                          <span className={`absolute -left-6 top-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${
                            isDone ? 'bg-[#15803d] border-2 border-emerald-50 text-white' : 'bg-slate-100 text-slate-400'
                          }`}>
                            {isDone ? '✓' : '3'}
                          </span>
                          <div className="space-y-0.5">
                            <p className={`font-bold ${isDone ? 'text-slate-800' : 'text-slate-400'}`}>Shipped / Out for Delivery</p>
                            <p className="text-[10px] text-slate-400 font-medium">Material dispatched with carrier.</p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Step 4: Delivered */}
                    {(() => {
                      const isDone = ['delivered', 'completed'].includes(scannedOrder.status);
                      return (
                        <div className="relative flex gap-3.5 items-start">
                          <span className={`absolute -left-6 top-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${
                            isDone ? 'bg-[#15803d] border-2 border-emerald-50 text-white' : 'bg-slate-100 text-slate-400'
                          }`}>
                            {isDone ? '✓' : '4'}
                          </span>
                          <div className="space-y-0.5">
                            <p className={`font-bold ${isDone ? 'text-[#15803d]' : 'text-slate-400'}`}>Delivered Successfully</p>
                            <p className="text-[10px] text-slate-400 font-medium">Sofa elements assembled safely!</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Receipt & Support shortcuts */}
                  <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between gap-3 text-xs border-r-4 border-slate-200">
                    <div>
                      <p className="font-bold text-slate-700">Need immediate help?</p>
                      <p className="text-[10px] text-slate-400">Call us contextually on {storeContact.phone}</p>
                    </div>
                    <button
                      onClick={() => setViewReceiptOrder(scannedOrder)}
                      className="bg-slate-200 hover:bg-slate-300 px-3.5 py-1.5 rounded-lg text-slate-800 text-[11px] font-extrabold transition whitespace-nowrap"
                    >
                      View Receipt
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          )}


          {/* --- VIEW 6: AUTHORIZATION LOGIN & REGISTER --- */}
          {view === 'auth' && (
            <div className="max-w-md mx-auto space-y-6">
              <div className="text-center space-y-1">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight font-sans">
                  {authView === 'login' ? 'Welcome Back!' : 'Register Account'}
                </h2>
                <p className="text-xs text-slate-400">
                  {authView === 'login'
                    ? 'Log in to view orders history and manage shipping addresses.'
                    : 'Create your shopping account profile for future fast checkouts.'}
                </p>
              </div>

              {/* Form card wrapper */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                {authError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 text-left mb-4">
                    {authError}
                  </div>
                )}

                {/* LOGIN FORM PANEL Representation of Image 19 */}
                {authView === 'login' && (
                  <form onSubmit={handleLogin} className="space-y-4">
                    {/* Mobile Input with prefix */}
                    <div className="space-y-1.5 text-xs text-left">
                      <label className="font-bold text-slate-600 block">Phone *</label>
                      <div className="flex">
                        <div className="bg-slate-100 border border-slate-200 border-r-0 rounded-l-lg px-2.5 flex items-center gap-1 text-slate-500 text-xs">
                          {/* UAE flag */}
                          <div className="w-5 h-3.5 flex border border-slate-200/40 rounded overflow-hidden relative shrink-0">
                            <div className="w-[30%] bg-red-600 h-full"></div>
                            <div className="flex-1 flex flex-col h-full">
                              <div className="h-1/3 bg-emerald-600"></div>
                              <div className="h-1/3 bg-white"></div>
                              <div className="h-1/3 bg-black"></div>
                            </div>
                          </div>
                          <span>+971</span>
                        </div>
                        <input
                          type="tel"
                          required
                          placeholder="Phone Number"
                          value={loginPhone}
                          onChange={(e) => setLoginPhone(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-r-lg p-2.5 text-xs text-slate-800 focus:outline-[#15803d]"
                        />
                      </div>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-1.5 text-xs text-left">
                      <div className="flex justify-between items-center w-full">
                        <label className="font-bold text-slate-600">Password *</label>
                        <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Please call support for account rescue.'); }} className="text-[#15803d] hover:underline font-bold text-[10px]">
                          Forgot Password?
                        </a>
                      </div>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-[#15803d]"
                      />
                    </div>

                    {/* Button */}
                    <button
                      type="submit"
                      className="w-full bg-[#15803d] hover:bg-emerald-800 text-white font-bold text-xs py-2.5 rounded-xl shadow transition"
                    >
                      Login Account
                    </button>

                    {/* Switch helper toggle link */}
                    <p className="text-[11px] text-center text-slate-400 pt-1">
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => { setAuthView('signup'); setAuthError(''); }}
                        className="text-[#15803d] hover:underline font-bold"
                      >
                        Sign up now
                      </button>
                    </p>
                  </form>
                )}

                {/* SIGN UP / REGISTER FORM Representation of Image 18 */}
                {authView === 'signup' && (
                  <form onSubmit={handleSignup} className="space-y-4">
                    {/* Name */}
                    <div className="space-y-1.5 text-xs text-left">
                      <label className="font-bold text-slate-600 block">Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Your Name"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-[#15803d]"
                      />
                    </div>

                    {/* Mobile with country code prefix */}
                    <div className="space-y-1.5 text-xs text-left">
                      <label className="font-bold text-slate-600 block">Phone *</label>
                      <div className="flex">
                        <div className="bg-slate-100 border border-slate-200 border-r-0 rounded-l-lg px-2.5 flex items-center gap-1 text-slate-500 text-xs">
                          {/* UAE flag */}
                          <div className="w-5 h-3.5 flex border border-slate-200/40 rounded overflow-hidden relative shrink-0">
                            <div className="w-[30%] bg-red-600 h-full"></div>
                            <div className="flex-1 flex flex-col h-full">
                              <div className="h-1/3 bg-emerald-600"></div>
                              <div className="h-1/3 bg-white"></div>
                              <div className="h-1/3 bg-black"></div>
                            </div>
                          </div>
                          <span>+971</span>
                        </div>
                        <input
                          type="tel"
                          required
                          placeholder="Phone Number"
                          value={signupPhone}
                          onChange={(e) => setSignupPhone(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-r-lg p-2.5 text-xs text-slate-800 focus:outline-[#15803d]"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5 text-xs text-left">
                      <label className="font-bold text-slate-400 block">Email (Optional)</label>
                      <input
                        type="email"
                        placeholder="Email Address"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-[#15803d]"
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5 text-xs text-left">
                      <label className="font-bold text-slate-600 block">Password *</label>
                      <input
                        type="password"
                        required
                        placeholder="Min 6 characters"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-[#15803d]"
                      />
                    </div>

                    {/* Password Confirm */}
                    <div className="space-y-1.5 text-xs text-left">
                      <label className="font-bold text-slate-600 block">Confirm Password *</label>
                      <input
                        type="password"
                        required
                        placeholder="Re-type password"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-[#15803d]"
                      />
                    </div>

                    {/* Button */}
                    <button
                      type="submit"
                      className="w-full bg-[#15803d] hover:bg-emerald-800 text-white font-bold text-xs py-2.5 rounded-xl shadow transition"
                    >
                      Register Account
                    </button>

                    <p className="text-[11px] text-center text-slate-400 pt-1">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => { setAuthView('login'); setAuthError(''); }}
                        className="text-[#15803d] hover:underline font-bold"
                      >
                        Login
                      </button>
                    </p>
                  </form>
                )}
              </div>
            </div>
          )}


          {/* --- VIEW 7: USER DASHBOARD AND CORE SECTIONS --- */}
          {view === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-800 tracking-tight font-sans">
                    Welcome to Dashboard
                  </h2>
                  <p className="text-xs text-slate-400">
                    Logged in as: <span className="font-bold text-slate-700">{user.name}</span>
                  </p>
                </div>

                {/* Dashboard sidebar mobile trigger layout */}
                <button
                  onClick={() => setDashboardDrawerOpen(true)}
                  className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-1.5 px-3 rounded-lg md:hidden"
                >
                  <Menu className="w-4 h-4" />
                  <span>Menu</span>
                </button>
              </div>

              {/* Grid Layout: Left Sidebar (Desktop), Right Contents */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                {/* --- Left Sidebar (Desktop Only) --- */}
                <aside className="hidden md:flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
                  <button
                    onClick={() => setDashboardView('stats')}
                    className={`text-left p-3.5 text-xs font-semibold font-sans flex items-center justify-between transition ${
                      dashboardView === 'stats' ? 'bg-[#15803d]/5 text-[#15803d] border-l-4 border-[#15803d]' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <LayoutGrid className={`w-4 h-4 shrink-0 transition-colors ${dashboardView === 'stats' ? 'text-[#15803d]' : 'text-slate-400'}`} />
                      <span>Dashboard Stats</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </button>

                  <button
                    onClick={() => setDashboardView('account')}
                    className={`text-left p-3.5 text-xs font-semibold font-sans flex items-center justify-between transition ${
                      dashboardView === 'account' ? 'bg-[#15803d]/5 text-[#15803d] border-l-4 border-[#15803d]' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <IdCard className={`w-4 h-4 shrink-0 transition-colors ${dashboardView === 'account' ? 'text-[#15803d]' : 'text-slate-400'}`} />
                      <span>Account Details</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </button>

                  <button
                    onClick={() => {
                      setCartDrawerOpen(true);
                    }}
                    className="text-left p-3.5 text-xs font-semibold font-sans flex items-center justify-between transition text-slate-600 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingCart className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>My Cart</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </button>

                  <button
                    onClick={() => setDashboardView('chat')}
                    className={`text-left p-3.5 text-xs font-semibold font-sans flex items-center justify-between transition ${
                      dashboardView === 'chat' ? 'bg-[#15803d]/5 text-[#15803d] border-l-4 border-[#15803d]' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <MessageSquare className={`w-4 h-4 shrink-0 transition-colors ${dashboardView === 'chat' ? 'text-[#15803d]' : 'text-slate-400'}`} />
                      <span>My Chat / WhatsApp</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </button>

                  <button
                    onClick={() => setDashboardView('orders')}
                    className={`text-left p-3.5 text-xs font-semibold font-sans flex items-center justify-between transition ${
                      dashboardView === 'orders' || dashboardView === 'order_detail' ? 'bg-[#15803d]/5 text-[#15803d] border-l-4 border-[#15803d]' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ClipboardList className={`w-4 h-4 shrink-0 transition-colors ${dashboardView === 'orders' || dashboardView === 'order_detail' ? 'text-[#15803d]' : 'text-slate-400'}`} />
                      <span>My Orders</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </button>

                  <button
                    onClick={() => setDashboardView('wishlist')}
                    className={`text-left p-3.5 text-xs font-semibold font-sans flex items-center justify-between transition ${
                      dashboardView === 'wishlist' ? 'bg-[#15803d]/5 text-[#15803d] border-l-4 border-[#15803d]' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Heart className={`w-4 h-4 shrink-0 transition-colors ${dashboardView === 'wishlist' ? 'text-[#15803d]' : 'text-slate-400'}`} />
                      <span>My Wishlist</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </button>

                  <button
                    onClick={() => setDashboardView('addresses')}
                    className={`text-left p-3.5 text-xs font-semibold font-sans flex items-center justify-between transition ${
                      dashboardView === 'addresses' ? 'bg-[#15803d]/5 text-[#15803d] border-l-4 border-[#15803d]' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className={`w-4 h-4 shrink-0 transition-colors ${dashboardView === 'addresses' ? 'text-[#15803d]' : 'text-slate-400'}`} />
                      <span>Shipping Addresses</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </button>

                  <button
                    onClick={() => setDashboardView('password_reset')}
                    className={`text-left p-3.5 text-xs font-semibold font-sans flex items-center justify-between transition ${
                      dashboardView === 'password_reset' ? 'bg-[#15803d]/5 text-[#15803d] border-l-4 border-[#15803d]' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Lock className={`w-4 h-4 shrink-0 transition-colors ${dashboardView === 'password_reset' ? 'text-[#15803d]' : 'text-slate-400'}`} />
                      <span>Password Reset</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </button>

                  <button
                    onClick={handleLogout}
                    className="text-left p-3.5 text-[11px] font-extrabold text-red-650 hover:bg-red-50/50 transition flex items-center gap-3.5"
                  >
                    <LogOut className="w-4 h-4 text-red-500 shrink-0" />
                    <span>Logout Account</span>
                  </button>
                </aside>

                {/* --- Right Contents Panel --- */}
                <div className="md:col-span-3">

                  {/* 1. Dashboard Stats View (Representation of Image 24) */}
                  {dashboardView === 'stats' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-3 gap-3">
                        {/* Box 1: Orders count */}
                        <div
                          onClick={() => setDashboardView('orders')}
                          className="bg-[#eef5fc] border border-[#d6e5f7] hover:border-blue-400 hover:shadow-sm cursor-pointer active:scale-95 transition-all rounded-2xl p-4 flex flex-col justify-between h-28 text-left"
                          title="Click to view all orders"
                          id="btn-stat-orders"
                        >
                          <span className="p-2 bg-blue-100 text-blue-600 rounded-xl self-start">
                            <ShoppingCart className="w-4.5 h-4.5" />
                          </span>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">Total Orders</p>
                            <p className="text-lg font-black text-slate-800">
                              {orders.filter((o) => o.customerMobile === user.phone).length}
                            </p>
                          </div>
                        </div>

                        {/* Box 2: Wishlist count */}
                        <div
                          onClick={() => setDashboardView('wishlist')}
                          className="bg-[#eefbf6] border border-[#d4f3e6] hover:border-emerald-400 hover:shadow-sm cursor-pointer active:scale-95 transition-all rounded-2xl p-4 flex flex-col justify-between h-28 text-left"
                          title="Click to view wishlist"
                          id="btn-stat-wishlist"
                        >
                          <span className="p-2 bg-emerald-100 text-[#15803d] rounded-xl self-start">
                            <Heart className="w-4.5 h-4.5" />
                          </span>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">In Wishlist</p>
                            <p className="text-lg font-black text-slate-800">{wishlist.length}</p>
                          </div>
                        </div>

                        {/* Box 3: Total spent cash */}
                        <div
                          onClick={() => setDashboardView('orders')}
                          className="bg-[#fdf9e9] border border-[#f8ebbe] hover:border-amber-400 hover:shadow-sm cursor-pointer active:scale-95 transition-all rounded-2xl p-4 flex flex-col justify-between h-28 text-left"
                          title="Click to view spending history/orders"
                          id="btn-stat-spent"
                        >
                          <span className="p-2 bg-amber-100 text-[#c25927] rounded-xl self-start">
                            <FileText className="w-4.5 h-4.5" />
                          </span>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">Total Spent</p>
                            <p className="text-core font-extrabold text-[#c25927]">
                              {orders.filter((o) => o.customerMobile === user.phone).reduce((sum, o) => sum + o.total, 0).toLocaleString()} AED
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-2xl p-4 flex gap-3 text-xs items-start text-left">
                        <UserCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-slate-800">Need Furniture Assistance?</h4>
                          <p className="text-slate-500 text-[10px]">
                            Check out "My Chat / WhatsApp" tab to message RK Furniture team directly!
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. Account Details */}
                  {dashboardView === 'account' && (
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm text-left space-y-4">
                      <h3 className="font-extrabold text-slate-800 text-sm border-b border-slate-50 pb-2">
                        Profile Credentials Info
                      </h3>
                      {editProfileMessage && (
                        <div className="p-2.5 text-xs bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-100 font-medium">
                          {editProfileMessage}
                        </div>
                      )}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!editName || !editPhone) {
                            setEditProfileMessage('Full Name and Phone are required.');
                            return;
                          }
                          setUser({
                            ...user,
                            name: editName,
                            phone: editPhone,
                            email: editEmail
                          });
                          // Also store in registry
                          setRegisteredUsers(prev => ({
                            ...prev,
                            [editPhone]: { name: editName, email: editEmail }
                          }));
                          setEditProfileMessage('Profile credentials updated successfully!');
                          setTimeout(() => setEditProfileMessage(''), 3000);
                        }}
                        className="text-xs space-y-3.5"
                      >
                        <div>
                          <label className="font-bold text-slate-500 block mb-1">Full Name</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#15803d]"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-500 block mb-1">Contact Phone</label>
                          <input
                            type="text"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="w-full font-mono text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#15803d]"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-500 block mb-1">Email Address</label>
                          <input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            className="w-full text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#15803d]"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full bg-[#15803d] hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl transition shadow-sm cursor-pointer"
                        >
                          Save Profile Changes
                        </button>
                      </form>
                    </div>
                  )}

                  {/* 3. My Orders & Details Representation of Image 2 & 3 */}
                  {dashboardView === 'orders' && (
                    <div className="space-y-4">
                      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm text-left">
                        <h2 className="text-2xl font-black text-slate-900 mb-6 font-sans">
                          Orders
                        </h2>

                        {(() => {
                          const myOrdersList = orders.filter((o) => o.customerMobile === user.phone);
                          if (myOrdersList.length === 0) {
                            return (
                              <div className="text-center py-10 space-y-2">
                                <p className="text-xs text-slate-400 font-bold">No orders found matching your login phone.</p>
                              </div>
                            );
                          }
                          return (
                            <div className="space-y-4">
                              {myOrdersList.map((ord) => {
                                const totalQty = ord.products.reduce((sum, p) => sum + p.quantity, 0);
                                return (
                                  <div
                                    key={ord.id}
                                    onClick={() => {
                                      setSelectedOrderId(ord.id);
                                      setDashboardView('order_detail');
                                    }}
                                    className="bg-white rounded-xl border border-slate-100 p-4 shadow-[0_2px_8px_rgba(0,0,0,0.015)] hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex justify-between items-start text-xs relative"
                                  >
                                    <div className="space-y-3">
                                      {/* Order Number Row */}
                                      <div className="flex gap-4 items-start">
                                        <div className="text-slate-600 font-bold text-xs sm:text-sm flex flex-col leading-snug">
                                          <span>Order</span>
                                          <span>Number:</span>
                                        </div>
                                        <span className="font-mono font-bold text-slate-800 text-xs sm:text-sm tracking-tight leading-snug break-all max-w-[180px] sm:max-w-none">
                                          {ord.orderNumber}
                                        </span>
                                      </div>

                                      {/* Date */}
                                      <div className="text-slate-800 font-medium text-xs font-sans">
                                        {ord.date.split(' at ')[0] || ord.date}
                                      </div>

                                      {/* Price and Items */}
                                      <div className="flex items-center gap-4 text-xs font-bold font-sans">
                                        <div className="flex items-center gap-1 text-emerald-700">
                                          <span className="text-base select-none">💵</span>
                                          <span>{toBengaliNumber(ord.total)}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-slate-600">
                                          <span className="text-base select-none">🛍️</span>
                                          <span>{totalQty} {totalQty === 1 ? 'Item' : 'Items'}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Red pending / status badge */}
                                    <div className="shrink-0 pt-1">
                                      <span className="bg-[#ef4444] text-white px-2.5 py-1 rounded-md text-[10px] font-bold lowercase tracking-wide inline-block leading-none">
                                        {ord.status}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Order inspect details sub-view (Representation of Image 3) */}
                  {dashboardView === 'order_detail' && (
                    (() => {
                      const ord = orders.find((o) => o.id === selectedOrderId);
                      if (!ord) return <p className="text-center font-bold text-slate-500 py-6">Order detail registry missing.</p>;
                      if (ord.customerMobile !== user.phone) {
                        return (
                          <div className="text-center py-8 space-y-3">
                            <p className="font-extrabold text-red-650 text-sm">Access Denied</p>
                            <p className="text-xs text-slate-550">You do not have permission to view this order record.</p>
                            <button onClick={() => setDashboardView('orders')} className="text-xs font-bold text-[#15803d] underline">
                              Back to My Orders
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-4 text-left">
                          {/* Back Link */}
                          <button
                            onClick={() => {
                              setSelectedOrderId(null);
                              setDashboardView('orders');
                            }}
                            className="flex items-center gap-1 text-[11px] font-bold text-[#15803d]"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Back to Orders Registry</span>
                          </button>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Customer Information Card */}
                            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-2">
                              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider text-slate-400">
                                Customer Information
                              </h4>
                              <p className="text-xs font-bold text-slate-800">{ord.customerName}</p>
                              <p className="text-xs font-mono text-slate-500">Phone: {ord.customerMobile}</p>
                            </div>

                            {/* Order Technical Meta */}
                            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-2">
                              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider text-slate-400">
                                Order Meta Status
                              </h4>
                              <p className="text-xs">
                                <span className="font-bold text-slate-600">ID: </span>
                                <span className="font-mono font-bold text-slate-800">{ord.orderNumber}</span>
                              </p>
                              <p className="text-xs">
                                <span className="font-bold text-slate-600">Status: </span>
                                <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${
                                  ord.status === 'completed'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                    : 'bg-amber-50 text-[#c25927] border border-orange-100'
                                }`}>
                                  {ord.status}
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm text-xs space-y-3">
                            <h4 className="font-bold text-slate-800 border-b border-slate-50 pb-1.5 uppercase text-[10px] text-slate-400">
                              Order Delivery & Financial breakdown
                            </h4>
                            <div className="space-y-1.5">
                              <p className="text-slate-600">
                                <span className="font-bold text-slate-700">Delivery Address: </span>
                                {ord.deliveryAddress}
                              </p>
                              <p className="text-slate-600">
                                <span className="font-bold text-slate-700">Payment Method: </span>
                                {ord.paymentMethod}
                              </p>
                              <p className="text-slate-600">
                                <span className="font-bold text-slate-700">Shipping Zone: </span>
                                {ord.shippingArea} ({ord.shippingCharge} AED)
                              </p>
                            </div>

                            {/* Ordered Products breakdown (Representation of Image 2) */}
                            <div className="border-t border-slate-100 pt-3">
                              <h5 className="font-bold text-slate-700 mb-1.5 uppercase text-[9px]">Ordered Products list:</h5>
                              <div className="space-y-2">
                                {ord.products.map(({ product, quantity }) => (
                                  <div key={product.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      {product.image === 'placeholder_box' ? (
                                        <BoxWithRays className="w-8 h-8 text-slate-850" />
                                      ) : (
                                        <img src={product.image} className="w-8 h-8 rounded object-cover border border-slate-100" referrerPolicy="no-referrer" />
                                      )}
                                      <div>
                                        <p className="font-bold text-slate-800">{product.name}</p>
                                        <p className="text-[10px] text-slate-400 font-sans">Qty: {quantity} x {product.price} AED</p>
                                      </div>
                                    </div>
                                    <span className="font-black text-slate-700">{(product.price * quantity).toLocaleString()} AED</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="border-t border-slate-100 pt-3 flex justify-between font-extrabold text-[#c25927] text-sm">
                              <span>Grand Total (payable):</span>
                              <span>{ord.total.toLocaleString()} AED</span>
                            </div>

                            <div className="flex gap-2 pt-2">
                              <button
                                onClick={() => setViewReceiptOrder(ord)}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold p-2 rounded-lg text-center text-xs transition"
                              >
                                View/Download Invoice Receipt
                              </button>
                              <button
                                onClick={() => {
                                  setView('track_order');
                                  setScannedOrder(ord);
                                  setTrackQuery(ord.orderNumber);
                                }}
                                className="bg-[#15803d]/10 hover:bg-[#15803d]/20 text-[#15803d] font-bold p-2 px-4 rounded-lg text-xs"
                              >
                                Track Delivery
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  )}

                  {/* 4. My Wishlist (Representation of Image 1 & 21) */}
                  {dashboardView === 'wishlist' && (
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm text-left space-y-4">
                      <h3 className="font-extrabold text-slate-800 text-sm border-b border-slate-50 pb-2">
                        My Bookmarked Furniture Wishlist
                      </h3>

                      {wishlist.length === 0 ? (
                        <div className="text-center py-10 space-y-2">
                          <p className="text-xs text-slate-400 font-bold">No items in your wishlist.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {wishlist.map((id) => {
                            const prod = products.find((p) => p.id === id);
                            if (!prod) return null;

                            return (
                              <div key={prod.id} className="border border-slate-100 p-3 rounded-xl flex justify-between items-center">
                                <div className="flex items-center gap-2 text-xs">
                                  {prod.image === 'placeholder_box' ? (
                                    <div className="w-10 h-10 rounded bg-slate-50 flex items-center justify-center">
                                      <BoxWithRays className="w-8 h-8 text-slate-800" />
                                    </div>
                                  ) : (
                                    <img src={prod.image} className="w-10 h-10 rounded object-cover border" referrerPolicy="no-referrer" />
                                  )}
                                  <div>
                                    <p className="font-bold text-slate-800">{prod.name}</p>
                                    {(() => {
                                      const { currentPrice, oldPrice } = getProductPrices(prod);
                                      return (
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="text-[#c25927] font-semibold">
                                            {currentPrice.toLocaleString()} AED
                                          </span>
                                          {oldPrice && (
                                            <span className="text-slate-400 line-through text-[10px]/none font-normal">
                                              {oldPrice.toLocaleString()} AED
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>

                                <div className="flex gap-1">
                                  <button
                                    onClick={() => addToCart(prod.id, 1)}
                                    className="p-1.5 bg-[#15803d]/10 text-[#15803d] hover:bg-[#15803d]/20 rounded-lg transition"
                                    title="Add to cart"
                                  >
                                    <ShoppingCart className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => toggleWishlist(prod.id)}
                                    className="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition"
                                    title="Remove"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 5. My Chat (Representation of Image 25) */}
                  {dashboardView === 'chat' && (
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm text-left text-xs space-y-5">
                      <div className="text-center space-y-1">
                        <MessageSquare className="w-10 h-10 text-[#15803d] mx-auto opacity-75" />
                        <h3 className="font-extrabold text-slate-800 text-sm">
                          Chat with Store Helpdesk
                        </h3>
                        <p className="text-[10px] text-slate-400">
                          Direct links to converse with executive operators.
                        </p>
                      </div>

                      <div className="border border-slate-100 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-bold">Contact Number:</span>
                          <span className="font-bold text-slate-800">{storeContact.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-bold">Hours of Operation:</span>
                          <span className="text-slate-700 font-medium">{storeContact.hours}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <a
                          href={storeContact.whatsappUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-[#25D366] hover:bg-[#20ba59] text-white font-extrabold p-2.5 rounded-xl text-center flex items-center justify-center gap-1.5"
                        >
                          {/* Svg whatsapp icon */}
                          <svg className="w-4.5 h-4.5 fill-white" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.1 1.45 4.8 1.45 5.5 0 10-4.5 10-10C21.4 5.2 17 1 12 1 6.5 1 2 5.5 2 11c0 1.9.5 3.7 1.5 5.3l-.9 3.5 3.6-.9z" />
                          </svg>
                          <span>WhatsApp Chat</span>
                        </a>

                        <a
                          href={`tel:${storeContact.phone}`}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold p-2.5 rounded-xl text-center flex items-center justify-center gap-1"
                        >
                          <Phone className="w-4 h-4" />
                          <span>Call Shop Desk</span>
                        </a>
                      </div>
                    </div>
                  )}

                  {/* 6. Shipping Addresses (Representation of Image 20) */}
                  {dashboardView === 'addresses' && (
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm text-left space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                        <h3 className="font-extrabold text-slate-800 text-sm">
                          My Saved Shipping Locations
                        </h3>
                        <button
                          onClick={() => setShowAddAddressModal(true)}
                          className="bg-[#15803d]/10 hover:bg-[#15803d]/20 text-[#15803d] text-[10px] font-bold py-1 px-2.5 rounded-md"
                        >
                          ✙ Add Shipping Address
                        </button>
                      </div>

                      {addresses.length === 0 ? (
                        <div className="text-center py-10 space-y-2">
                          <p className="text-xs text-slate-400 font-bold">No shipping addresses found yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {addresses.map((addr) => (
                            <div key={addr.id} className="border border-slate-100 p-3.5 rounded-xl flex justify-between items-center text-xs relative">
                              <div className="space-y-0.5">
                                <p className="font-bold text-slate-800">{addr.name}</p>
                                <p className="text-slate-500 font-mono">Mobile: {addr.mobile}</p>
                                {addr.email && <p className="text-slate-500">Email: {addr.email}</p>}
                                <p className="text-slate-600 mt-1">{addr.address}</p>
                              </div>
                              <button
                                onClick={() => setAddresses((prev) => prev.filter((a) => a.id !== addr.id))}
                                className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors p-1"
                                title="Delete address"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 7. Password Reset View (Representation of Image 17) */}
                  {dashboardView === 'password_reset' && (
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm text-left max-w-sm mx-auto space-y-4">
                      <h3 className="font-extrabold text-slate-800 text-sm border-b border-slate-50 pb-2 flex items-center gap-1">
                        <Lock className="w-4 h-4 text-emerald-700" />
                        <span>Change Password Security</span>
                      </h3>

                      {passwordResetMessage.text && (
                        <div className={`p-2 rounded text-[10px] font-bold ${
                          passwordResetMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {passwordResetMessage.text}
                        </div>
                      )}

                      <form onSubmit={handlePasswordReset} className="space-y-3 text-xs">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600">Current Password *</label>
                          <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:outline-[#15803d]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-600">New Password *</label>
                          <input
                            type="password"
                            required
                            placeholder="Min 6 characters"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:outline-[#15803d]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-600">Confirm Password *</label>
                          <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:outline-[#15803d]"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-[#15803d] hover:bg-emerald-800 text-white font-bold py-2 rounded shadow text-xs"
                        >
                          Change Password
                        </button>
                      </form>
                    </div>
                  )}

                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* --- Footer Signature Segment (Anti-slop clean background) --- */}
      <footer className="max-w-4xl mx-auto w-full px-4 border-t border-slate-100 py-6 text-center text-xs text-slate-400 bg-[#fcfaf7]">
        <p className="font-sans">© 2026 RK Furniture. Powered by Jahedur Rahman Shuvo.</p>
      </footer>

      {/* --- FLOATING PORTABLE CART SLIDE-OUT DRAWER SEGMENT (Representation of Image 26) --- */}
      <AnimatePresence>
        {cartDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop black layer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartDrawerOpen(false)}
              className="absolute inset-0 bg-black"
            />

            {/* Slide-out block context */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="relative w-full max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5 font-sans">
                  <ShoppingCart className="w-4.5 h-4.5 text-[#15803d]" />
                  <span>Shopping Cart</span>
                </h3>
                <button
                  onClick={() => setCartDrawerOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items listing */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-50">
                {cart.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <p className="text-xs text-slate-400 font-bold">Your cart is empty</p>
                    <button
                      onClick={() => {
                        setCartDrawerOpen(false);
                        setView('home');
                      }}
                      className="text-[#15803d] text-xs font-bold underline"
                    >
                      Browse items
                    </button>
                  </div>
                ) : (
                  cart.map((item) => {
                    const prod = products.find((p) => p.id === item.productId);
                    if (!prod) return null;

                    return (
                      <div key={item.productId} className="flex gap-2.5 pt-3 first:pt-0">
                        {/* Avatar */}
                        {prod.image === 'placeholder_box' ? (
                          <div className="w-12 h-12 rounded bg-slate-50 flex items-center justify-center shrink-0">
                            <BoxWithRays className="w-9 h-9 text-slate-800" />
                          </div>
                        ) : (
                          <img
                            src={prod.image}
                            alt={prod.name}
                            className="w-12 h-12 rounded-lg object-cover shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        )}

                        <div className="flex-1 min-w-0 text-left text-xs space-y-1">
                          <div className="flex justify-between items-start gap-1">
                            <h4 className="font-bold text-slate-800 truncate font-sans">{prod.name}</h4>
                            <button
                              onClick={() => removeFromCart(item.productId)}
                              className="text-slate-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {(() => {
                            const { currentPrice, oldPrice } = getProductPrices(prod);
                            return (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[#c25927] font-semibold">
                                  {currentPrice.toLocaleString()} AED
                                </span>
                                {oldPrice && (
                                  <span className="text-slate-400 line-through text-[10px]/none font-normal">
                                    {oldPrice.toLocaleString()} AED
                                  </span>
                                )}
                              </div>
                            );
                          })()}

                          {/* Plus minus counter */}
                          <div className="flex items-center gap-2 pt-0.5">
                            <button
                              onClick={() => updateCartQty(item.productId, -1)}
                              className="p-1 rounded bg-slate-100 text-slate-500 hover:bg-slate-200"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-bold text-slate-700 text-[11px]">{item.quantity}</span>
                            <button
                              onClick={() => updateCartQty(item.productId, 1)}
                              className="p-1 rounded bg-slate-100 text-slate-500 hover:bg-slate-200"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Drawer Billing summary and CTA */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
                {(() => {
                  const { subtotal } = getCartTotals();
                  return (
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span>Subtotal:</span>
                      <span className="text-[#c25927]">{subtotal.toLocaleString()} AED</span>
                    </div>
                  );
                })()}

                <div className="space-y-1.5 text-xs">
                  <button
                    disabled={cart.length === 0}
                    onClick={() => {
                      setCartDrawerOpen(false);
                      setView('checkout');
                    }}
                    className="w-full bg-[#15803d] disabled:opacity-40 hover:bg-emerald-800 text-white font-extrabold py-2.5 rounded-xl text-center block"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- ADD TO CART SUCCESS POPUP (Floating visual card matching screenshot) --- */}
      <AnimatePresence>
        {addedProductPopup && (() => {
          const prod = products.find((p) => p.id === addedProductPopup.productId);
          if (!prod) return null;
          const { currentPrice } = getProductPrices(prod);
          const cartItem = cart.find((item) => item.productId === prod.id);
          const itemQty = cartItem ? cartItem.quantity : addedProductPopup.qty;
          const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

          return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              {/* Backdrop black layer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                onClick={() => setAddedProductPopup(null)}
                className="absolute inset-0 bg-black/50 backdrop-blur-xs"
              />

              {/* The Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 40 }}
                className="relative w-full max-w-[360px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] p-5 border border-slate-100 z-10 flex flex-col space-y-4 text-left font-sans text-slate-800"
              >
                {/* Header checkmark line */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500 shrink-0">
                      <div className="w-5.5 h-5.5 rounded-full border border-emerald-500 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </span>
                    <span className="font-bold text-slate-800 text-[13px] sm:text-sm">
                      Product added to cart successfully
                    </span>
                  </div>
                  <button
                    onClick={() => setAddedProductPopup(null)}
                    className="w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition focus:outline-none cursor-pointer"
                    title="Close"
                  >
                    <X className="w-4 h-4 text-slate-450" />
                  </button>
                </div>

                <hr className="border-slate-100 my-1" />

                {/* Product details inside card */}
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-slate-100 rounded-xl border border-slate-200/50 flex items-center justify-center overflow-hidden shrink-0">
                    {prod.image === 'placeholder_box' ? (
                      <BoxWithRays className="w-8 h-8 text-slate-400" />
                    ) : (
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="w-full h-full object-cover rounded-xl"
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </div>
                  <div className="text-left flex-1 space-y-0.5">
                    <h4 className="font-bold text-slate-900 uppercase text-[11px] sm:text-xs tracking-tight leading-snug line-clamp-2">
                      {prod.name}
                    </h4>
                    <p className="text-[10px] text-slate-450 font-bold">
                      Quantity: {itemQty}
                    </p>
                    <p className="font-black text-[#15803d] text-xs sm:text-sm">
                      {currentPrice.toLocaleString()} AED / {currentPrice.toLocaleString()} د.إ
                    </p>
                  </div>
                </div>

                {/* Vertical actions stack */}
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    onClick={() => {
                      setAddedProductPopup(null);
                      setCartDrawerOpen(true);
                    }}
                    className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs sm:text-sm py-2.5 rounded-lg transition text-center focus:outline-none cursor-pointer"
                  >
                    View Cart ({totalCartItems})
                  </button>

                  <button
                    onClick={() => {
                      setAddedProductPopup(null);
                      setView('checkout');
                    }}
                    className="w-full bg-[#15803d] hover:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm py-2.5 rounded-lg transition shadow-sm text-center focus:outline-none cursor-pointer"
                  >
                    Buy Now
                  </button>
                </div>

                {/* Continue button */}
                <button
                  onClick={() => setAddedProductPopup(null)}
                  className="text-slate-500 font-semibold text-xs hover:text-slate-800 underline block text-center cursor-pointer bg-transparent border-0 outline-none mt-1"
                >
                  Continue Shopping
                </button>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* --- FLOATING CATEGORIES SLIDE-OUT DRAWER SEGMENT (Matches user request screenshot) --- */}
      <AnimatePresence>
        {categoriesDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-start">
            {/* Backdrop black layer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setCategoriesDrawerOpen(false)}
              className="absolute inset-0 bg-black/60"
            />

            {/* Slide-out block context */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="relative w-full max-w-[320px] bg-white h-full shadow-2xl flex flex-col z-50 text-left font-sans"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-extrabold text-[#111827] text-base font-sans select-none">
                  Categories
                </h3>
                <button
                  onClick={() => setCategoriesDrawerOpen(false)}
                  className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-black hover:bg-slate-50 transition cursor-pointer focus:outline-none"
                  title="Close"
                >
                  <X className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              {/* Categories List Options */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat.name;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.name);
                        setView('home');
                        setSelectedProductId(null);
                        setCurrentTab('home');
                        setCategoriesDrawerOpen(false);
                      }}
                      className={`w-full text-left py-3 px-5 transition flex items-center gap-3.5 cursor-pointer hover:bg-slate-50/80 focus:outline-none ${
                        isSelected 
                          ? 'bg-amber-500/10 text-amber-600 font-extrabold' 
                          : 'bg-white text-slate-800'
                      }`}
                    >
                      {cat.image ? (
                        <img 
                          src={cat.image} 
                          alt={cat.name} 
                          className="w-12 h-12 object-contain shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <CabinetIcon />
                      )}
                      <span className="text-sm font-semibold tracking-wide text-slate-700">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- DASHBOARD MOBILE DRAWER MENU (Representation of Image 23) --- */}
      <AnimatePresence>
        {dashboardDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setDashboardDrawerOpen(false)}
              className="absolute inset-0 bg-black/60"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="relative w-64 bg-white h-full shadow-2xl flex flex-col justify-between py-6"
            >
              <div className="px-6 pb-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-800">Dashboard Menu</h3>
                <button onClick={() => setDashboardDrawerOpen(false)} className="text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 py-4 flex flex-col divide-y divide-slate-50 overflow-y-auto">
                <button
                  onClick={() => { setDashboardView('stats'); setDashboardDrawerOpen(false); }}
                  className={`flex items-center gap-3 px-6 py-3.5 text-xs font-semibold hover:bg-slate-50 transition text-left ${
                    dashboardView === 'stats' ? 'bg-emerald-50/50 text-[#15803d]' : 'text-slate-700'
                  }`}
                >
                  <LayoutGrid className={`w-4 h-4 shrink-0 transition-colors ${dashboardView === 'stats' ? 'text-[#15803d]' : 'text-slate-400'}`} />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={() => { setDashboardView('account'); setDashboardDrawerOpen(false); }}
                  className={`flex items-center gap-3 px-6 py-3.5 text-xs font-semibold hover:bg-slate-50 transition text-left ${
                    dashboardView === 'account' ? 'bg-emerald-50/50 text-[#15803d]' : 'text-slate-700'
                  }`}
                >
                  <IdCard className={`w-4 h-4 shrink-0 transition-colors ${dashboardView === 'account' ? 'text-[#15803d]' : 'text-slate-400'}`} />
                  <span>Account Details</span>
                </button>
                <button
                  onClick={() => { setCartDrawerOpen(true); setDashboardDrawerOpen(false); }}
                  className="flex items-center gap-3 px-6 py-3.5 text-xs font-semibold hover:bg-slate-50 text-slate-700 transition text-left"
                >
                  <ShoppingCart className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>My Cart</span>
                </button>
                <button
                  onClick={() => { setDashboardView('chat'); setDashboardDrawerOpen(false); }}
                  className={`flex items-center gap-3 px-6 py-3.5 text-xs font-semibold hover:bg-slate-50 transition text-left ${
                    dashboardView === 'chat' ? 'bg-emerald-50/50 text-[#15803d]' : 'text-slate-700'
                  }`}
                >
                  <MessageSquare className={`w-4 h-4 shrink-0 transition-colors ${dashboardView === 'chat' ? 'text-[#15803d]' : 'text-slate-400'}`} />
                  <span>My Chat</span>
                </button>
                <button
                  onClick={() => { setDashboardView('orders'); setDashboardDrawerOpen(false); }}
                  className={`flex items-center gap-3 px-6 py-3.5 text-xs font-semibold hover:bg-slate-50 transition text-left ${
                    dashboardView === 'orders' || dashboardView === 'order_detail' ? 'bg-emerald-50/50 text-[#15803d]' : 'text-slate-700'
                  }`}
                >
                  <ClipboardList className={`w-4 h-4 shrink-0 transition-colors ${dashboardView === 'orders' || dashboardView === 'order_detail' ? 'text-[#15803d]' : 'text-slate-400'}`} />
                  <span>My Orders</span>
                </button>
                <button
                  onClick={() => { setDashboardView('wishlist'); setDashboardDrawerOpen(false); }}
                  className={`flex items-center gap-3 px-6 py-3.5 text-xs font-semibold hover:bg-slate-50 transition text-left ${
                    dashboardView === 'wishlist' ? 'bg-emerald-50/50 text-[#15803d]' : 'text-slate-700'
                  }`}
                >
                  <Heart className={`w-4 h-4 shrink-0 transition-colors ${dashboardView === 'wishlist' ? 'text-[#15803d]' : 'text-slate-400'}`} />
                  <span>My Wishlist</span>
                </button>
                <button
                  onClick={() => { setDashboardView('addresses'); setDashboardDrawerOpen(false); }}
                  className={`flex items-center gap-3 px-6 py-3.5 text-xs font-semibold hover:bg-slate-50 transition text-left ${
                    dashboardView === 'addresses' ? 'bg-emerald-50/50 text-[#15803d]' : 'text-slate-700'
                  }`}
                >
                  <MapPin className={`w-4 h-4 shrink-0 transition-colors ${dashboardView === 'addresses' ? 'text-[#15803d]' : 'text-slate-400'}`} />
                  <span>My Addresses</span>
                </button>
                <button
                  onClick={() => { setDashboardView('password_reset'); setDashboardDrawerOpen(false); }}
                  className={`flex items-center gap-3 px-6 py-3.5 text-xs font-semibold hover:bg-slate-50 transition text-left ${
                    dashboardView === 'password_reset' ? 'bg-emerald-50/50 text-[#15803d]' : 'text-slate-700'
                  }`}
                >
                  <Lock className={`w-4 h-4 shrink-0 transition-colors ${dashboardView === 'password_reset' ? 'text-[#15803d]' : 'text-slate-400'}`} />
                  <span>Password Reset</span>
                </button>
              </div>

              <div className="px-6 pt-4 border-t border-slate-100">
                <button
                  onClick={() => { handleLogout(); setDashboardDrawerOpen(false); }}
                  className="w-full hover:bg-red-50 text-red-600 font-extrabold text-xs py-2.5 rounded-lg transition flex items-center justify-center gap-2 border border-red-200"
                >
                  <LogOut className="w-4 h-4 text-red-500 shrink-0" />
                  <span>Logout</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- OVERLAY MODAL: QUICK SEARCH / CATEGORIES TRIGGER --- */}
      <AnimatePresence>
        {searchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
              className="absolute inset-0 bg-slate-900"
            />

            <motion.div
              initial={{ y: -15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -15, opacity: 0 }}
              className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 text-left border border-slate-100"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-1 relative">
                <div className="w-5"></div> {/* spacer helper */}
                <h3 className="font-extrabold text-[#111827] text-lg sm:text-xl font-sans text-center flex-grow">
                  Search Products
                </h3>
                <button
                  onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                  className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-0.5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Input Group */}
              <div className="flex items-stretch border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <input
                  type="text"
                  autoFocus
                  placeholder="Search entire store here..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-grow px-4 py-3 text-sm focus:outline-none text-slate-800 font-sans"
                />
                <button
                  className="bg-[#15803d] hover:bg-emerald-800 px-5 flex items-center justify-center text-white transition-colors cursor-pointer"
                  id="btn-search-apply"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>

              {/* Results context / search matches */}
              {searchQuery && (
                (() => {
                  const filtered = products.filter((p) =>
                    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.category.toLowerCase().includes(searchQuery.toLowerCase())
                  );

                  return (
                    <div className="space-y-2">
                      <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Search Matches ({filtered.length})
                      </h4>
                      {filtered.length === 0 ? (
                        <p className="text-xs text-slate-400 py-4 text-center">No matching accessories or furniture found.</p>
                      ) : (
                        <div className="divide-y divide-slate-50 space-y-2 max-h-56 overflow-y-auto pr-1">
                          {filtered.map((prod) => (
                            <div
                              key={prod.id}
                              onClick={() => {
                                setSelectedProductId(prod.id);
                                setView('product_detail');
                                setSearchOpen(false);
                                setSearchQuery('');
                              }}
                              className="flex gap-2.5 items-center p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-xs"
                            >
                              {prod.image === 'placeholder_box' ? (
                                <div className="w-10 h-10 rounded bg-slate-50 flex items-center justify-center shrink-0 border">
                                  <BoxWithRays className="w-8 h-8 text-slate-800" />
                                </div>
                              ) : (
                                <img src={prod.image} className="w-10 h-10 rounded object-cover border shrink-0" referrerPolicy="no-referrer" />
                              )}
                              <div className="text-left flex-1">
                                <p className="font-bold text-slate-850">{prod.name}</p>
                                {(() => {
                                  const { currentPrice, oldPrice } = getProductPrices(prod);
                                  return (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-[#c25927] font-semibold">
                                        {currentPrice.toLocaleString()} AED
                                      </span>
                                      {oldPrice && (
                                        <span className="text-slate-405 line-through text-[10px] font-normal">
                                          {oldPrice.toLocaleString()} AED
                                        </span>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- ADD ADDRESS MODAL OVERLAY --- */}
      <AnimatePresence>
        {showAddAddressModal && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative border border-slate-100"
            >
              <h3 className="text-base font-extrabold text-slate-800 border-b border-slate-100 pb-2 mb-3 text-left">
                Add Shipping Destination
              </h3>

              <form onSubmit={handleAddAddress} className="space-y-3.5 text-xs text-left">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Recipient Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Recipient Name"
                    value={newAddressName}
                    onChange={(e) => setNewAddressName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:outline-[#15803d]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="Phone Number"
                    value={newAddressMobile}
                    onChange={(e) => setNewAddressMobile(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:outline-[#15803d]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-450 block">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="customer@rkfurniture.com"
                    value={newAddressEmail}
                    onChange={(e) => setNewAddressEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:outline-[#15803d]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Extended Address *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Full shipping directions..."
                    value={newAddressDetails}
                    onChange={(e) => setNewAddressDetails(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:outline-[#15803d] resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddAddressModal(false)}
                    className="bg-slate-150 text-slate-600 font-bold px-3 py-1.5 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#15803d] hover:bg-emerald-800 text-white font-bold px-4 py-1.5 rounded"
                  >
                    Save Destination
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- INVOICE PRINT RECEIPT OVERLAY MODAL --- */}
      {viewReceiptOrder && (
        <OrderReceipt order={viewReceiptOrder} onClose={() => setViewReceiptOrder(null)} />
      )}

      {/* --- FIXED NAVIGATION BAR (Bottom Tab) --- */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={handleTabChange}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
      />
    </div>
  );
}
