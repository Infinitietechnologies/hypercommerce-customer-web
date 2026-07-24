// Static fixtures for the redesign sandbox. Ported verbatim from the
// `<script type="text/x-dc">` block of
// `ecommerce-website-design/HyperCommerce App.dc.html`, so every screen renders
// the same content the design does. Nothing here talks to the API.

export function money(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export type RawProduct = {
  id: number;
  brand: string;
  name: string;
  price: number;
  mrp: number;
  rating: string;
  reviews: string;
  description: string;
};

export type Product = RawProduct & {
  slug: string;
  priceFmt: string;
  mrpFmt: string;
  offPct: number;
};

const RAW_PRODUCTS: RawProduct[] = [
  { id: 1, brand: "Noise", name: "ColorFit Pro 5 Smartwatch", price: 2499, mrp: 4999, rating: "4.2", reviews: "2.3k", description: "A vibrant AMOLED smartwatch with 7-day battery life, built-in GPS, and 100+ sport modes for everyday fitness tracking." },
  { id: 2, brand: "boAt", name: "Rockerz 450 Wireless Headphones", price: 1499, mrp: 2990, rating: "4.4", reviews: "12.4k", description: "Over-ear wireless headphones with 15-hour playback, padded ear cushions, and deep bass drivers tuned for daily listening." },
  { id: 3, brand: "Nike", name: "Revolution 6 Running Shoes", price: 3495, mrp: 4995, rating: "4.5", reviews: "876", description: "Lightweight everyday trainers with soft foam cushioning and a breathable mesh upper for long, comfortable runs." },
  { id: 4, brand: "Titan", name: "Neo Analog Watch", price: 4291, mrp: 4768, rating: "3.9", reviews: "145", description: "A minimalist stainless-steel analog watch with scratch-resistant glass and a 2-year manufacturer warranty." },
  { id: 5, brand: "Prestige", name: "Non-stick Cookware Set (5pc)", price: 2199, mrp: 3499, rating: "4.1", reviews: "532", description: "A 5-piece non-stick cookware set built for even heat distribution and easy cleanup, dishwasher safe." },
  { id: 6, brand: "Levi's", name: "511 Slim Fit Denim Jacket", price: 3299, mrp: 5499, rating: "4.6", reviews: "98", description: "Classic slim-fit denim jacket in washed indigo, built from durable cotton twill with a timeless silhouette." },
  { id: 7, brand: "Lakmé", name: "9to5 Skincare Kit", price: 899, mrp: 1499, rating: "4.0", reviews: "410", description: "A daily skincare kit with cleanser, toner and moisturizer formulated for all-day hydration." },
  { id: 8, brand: "Xiaomi", name: "Smart Security Camera 2K", price: 2860, mrp: 3814, rating: "4.3", reviews: "267", description: "2K indoor security camera with night vision, motion alerts, and two-way audio via the companion app." },
  { id: 9, brand: "Mi", name: "Power Bank 20000mAh", price: 1299, mrp: 1999, rating: "4.3", reviews: "3.4k", description: "High-capacity 20000mAh power bank with dual USB output and 18W fast charging support." },
  { id: 10, brand: "Puma", name: "Everyday Leather Loafers", price: 3899, mrp: 5499, rating: "4.2", reviews: "210", description: "Genuine leather loafers with a cushioned footbed, built for all-day comfort at the office or outdoors." },
  { id: 11, brand: "Philips", name: "Air Fryer HD9200", price: 6999, mrp: 8999, rating: "4.5", reviews: "654", description: "A 4.1L rapid-air fryer that uses up to 90% less oil, with a dishwasher-safe non-stick basket." },
  { id: 12, brand: "Samsung", name: "Galaxy Buds FE", price: 4999, mrp: 6999, rating: "4.3", reviews: "1.5k", description: "True wireless earbuds with active noise cancellation and up to 30 hours of combined battery life." },
];

function enrich(p: RawProduct): Product {
  return {
    ...p,
    slug: slugify(p.brand + "-" + p.name),
    priceFmt: money(p.price),
    mrpFmt: money(p.mrp),
    offPct: Math.round((1 - p.price / p.mrp) * 100),
  };
}

export const PRODUCTS: Product[] = RAW_PRODUCTS.map(enrich);

export function findProduct(slug?: string): Product {
  return PRODUCTS.find((p) => p.slug === slug) ?? PRODUCTS[0];
}

export type Category = { id: number; title: string; slug: string };

export const CATEGORIES: Category[] = [
  "Electronics", "Fashion", "Home & Kitchen", "Beauty",
  "Grocery", "Footwear", "Sports & Fitness", "Toys & Baby",
].map((title, i) => ({ id: i + 1, title, slug: slugify(title) }));

export type Brand = { id: number; name: string; slug: string };

export const BRANDS: Brand[] = ["Nike", "Titan", "boAt", "Levi's", "Puma", "Samsung"].map(
  (name, i) => ({ id: i + 1, name, slug: slugify(name) }),
);

export type Store = {
  id: number;
  name: string;
  address: string;
  distance: string;
  hours: string;
  slug: string;
};

export const STORES: Store[] = [
  { id: 1, name: "HyperCommerce Indiranagar", address: "100 Ft Road, Indiranagar, Bengaluru", distance: "1.2 km", hours: "10 AM – 9 PM" },
  { id: 2, name: "HyperCommerce Koramangala", address: "5th Block, Koramangala, Bengaluru", distance: "3.4 km", hours: "10 AM – 9 PM" },
  { id: 3, name: "HyperCommerce Whitefield", address: "ITPL Main Road, Whitefield, Bengaluru", distance: "9.8 km", hours: "10 AM – 10 PM" },
].map((s) => ({ ...s, slug: slugify(s.name) }));

export type Banner = { id: number; title: string };

/** Home-screen banners (short titles — the App file uses these). */
export const BANNERS: Banner[] = [
  { id: 1, title: "Sale" },
  { id: 2, title: "Fashion" },
  { id: 3, title: "Kitchen" },
];

/** Kit-gallery banners carry the long marketing titles. */
export const KIT_BANNERS: Banner[] = [
  { id: 1, title: "Big Billion Days — up to 70% off electronics" },
  { id: 2, title: "New season fashion drop" },
  { id: 3, title: "Kitchen & home essentials" },
];

export type OrderStatus = "Delivered" | "Shipped" | "Cancelled";

export type Order = {
  id: string;
  date: string;
  itemsCount: number;
  total: number;
  status: OrderStatus;
  itemName: string;
};

export const ORDERS: Order[] = [
  { id: "84213", date: "12 Jul 2026", itemsCount: 2, total: 5498, status: "Delivered", itemName: "Rockerz 450 Wireless Headphones" },
  { id: "83990", date: "02 Jul 2026", itemsCount: 1, total: 4291, status: "Shipped", itemName: "Neo Analog Watch" },
  { id: "82744", date: "18 Jun 2026", itemsCount: 3, total: 8697, status: "Cancelled", itemName: "Everyday Leather Loafers" },
];

export type Address = {
  id: number;
  label: string;
  name: string;
  line: string;
  city: string;
  phone: string;
};

export const ADDRESSES: Address[] = [
  { id: 1, label: "Home", name: "Aditi Sharma", line: "221 Palm Meadows, 100 Ft Road", city: "Bengaluru 560038", phone: "+91 98450 12345" },
  { id: 2, label: "Work", name: "Aditi Sharma", line: "Tower B, WeWork Galaxy, Residency Road", city: "Bengaluru 560025", phone: "+91 98450 12345" },
];

export type WalletTxn = {
  id: number;
  desc: string;
  date: string;
  type: "Credit" | "Debit";
  amount: number;
};

export const WALLET_TXNS: WalletTxn[] = [
  { id: 1, desc: "Cashback — Order #84213", date: "12 Jul 2026", type: "Credit", amount: 150 },
  { id: 2, desc: "Refund — Order #82744", date: "20 Jun 2026", type: "Credit", amount: 899 },
  { id: 3, desc: "Used on Order #83990", date: "02 Jul 2026", type: "Debit", amount: -200 },
];

export const WALLET_BALANCE = 450;

export type Notification = {
  id: number;
  icon: string;
  title: string;
  body: string;
  time: string;
};

export const NOTIFICATIONS: Notification[] = [
  { id: 1, icon: "solar:box-linear", title: "Order shipped", body: "Your order #83990 has shipped and is on its way.", time: "2h ago" },
  { id: 2, icon: "solar:tag-price-linear", title: "Price drop", body: "ColorFit Pro 5 Smartwatch just dropped 15%.", time: "1d ago" },
  { id: 3, icon: "solar:wallet-linear", title: "Wallet credited", body: "₹150 cashback added to your wallet.", time: "3d ago" },
];

export const STATIC_PAGES: Record<string, string> = {
  about: "About HyperCommerce",
  faqs: "FAQs",
  privacy: "Privacy Policy",
  terms: "Terms & Conditions",
  shipping: "Shipping Policy",
  returns: "Return & Refund Policy",
  seller: "Sell on HyperCommerce",
};

/** Home category tabs. */
export const HOME_TABS = [
  { key: "All", icon: "solar:widget-2-linear" },
  { key: "Electronics", icon: "solar:smartphone-linear" },
  { key: "Fashion", icon: "solar:t-shirt-linear" },
  { key: "Home & Kitchen", icon: "solar:armchair-2-linear" },
  { key: "Beauty", icon: "solar:magic-stick-3-linear" },
  { key: "Grocery", icon: "solar:box-minimalistic-linear" },
  { key: "Footwear", icon: "solar:square-academic-cap-linear" },
  { key: "Sports & Fitness", icon: "solar:dumbbell-large-linear" },
];

export const FILTER_CHIPS = ["Price", "Brand", "Rating", "Discount", "Availability"];

export const PAYMENT_METHODS = [
  { key: "upi", label: "UPI", icon: "solar:qr-code-linear" },
  { key: "card", label: "Credit / Debit Card", icon: "solar:card-linear" },
  { key: "netbanking", label: "Net Banking", icon: "solar:library-linear" },
  { key: "cod", label: "Cash on Delivery", icon: "solar:money-bag-linear" },
];

export const ACCOUNT_NAV = [
  { key: "overview", label: "Overview", icon: "solar:user-circle-linear" },
  { key: "orders", label: "My Orders", icon: "solar:box-linear" },
  { key: "addresses", label: "Addresses", icon: "solar:map-point-linear" },
  { key: "wishlists", label: "Wishlists", icon: "solar:heart-linear" },
  { key: "wallet", label: "Wallet", icon: "solar:wallet-linear" },
  { key: "transactions", label: "Transactions", icon: "solar:bill-list-linear" },
  { key: "notifications", label: "Notifications", icon: "solar:bell-linear" },
  { key: "refer", label: "Refer & Earn", icon: "solar:gift-linear" },
];

export const ACCOUNT_QUICK_LINKS = [
  { key: "orders", label: "My Orders", icon: "solar:box-linear" },
  { key: "addresses", label: "Addresses", icon: "solar:map-point-linear" },
  { key: "wallet", label: "Wallet", icon: "solar:wallet-linear" },
  { key: "wishlists", label: "Wishlist", icon: "solar:heart-linear" },
  { key: "shoppingList", label: "Shopping List", icon: "solar:checklist-linear" },
  { key: "refer", label: "Refer & Earn", icon: "solar:gift-linear" },
];

export const ORDER_TIMELINE = ["Placed", "Shipped", "Out for delivery", "Delivered"];

/** Demo cart — product #1 ×1, product #2 ×2, as the design ships it. */
export const INITIAL_CART = [
  { id: 1, qty: 1 },
  { id: 2, qty: 2 },
];

export const ACCOUNT_USER = {
  name: "Aditi Sharma",
  email: "aditi.sharma@email.com",
  referralCode: "ADITI250",
};
