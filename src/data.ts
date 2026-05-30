import { Product } from './types';

export const INITIAL_PRODUCTS: Product[] = [];

export const SHIPPING_RATES = {
  inside: {
    label: 'Inside Dubai / UAE',
    charge: 15,
    estimate: 'Estimated Delivery Time May Vary'
  },
  outside: {
    label: 'Other Emirates / Gulf',
    charge: 35,
    estimate: 'Estimated Delivery Time May Vary'
  },
  global: {
    label: 'Global Delivery',
    charge: 150,
    estimate: 'Worldwide standard air parcel'
  }
};

export const STORE_CONTACT = {
  phone: '01715838191',
  whatsappUrl: 'https://wa.me/8801715838191',
  hours: 'Available 24/7 for support'
};
