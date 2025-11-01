export interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: string
  vendorId: string
  vendorName: string
  rating: number
  reviews: number
  stock: number
  featured?: boolean
}

export const mockProducts: Product[] = [
  {
    id: "1",
    name: "Handwoven Basket",
    description: "Beautiful traditional Malawian basket, handwoven by local artisans using sustainable materials.",
    price: 2500,
    image: "/african-woven-basket.jpg",
    category: "Crafts",
    vendorId: "v1",
    vendorName: "Lilongwe Crafts",
    rating: 4.8,
    reviews: 24,
    stock: 15,
    featured: true,
  },
  {
    id: "2",
    name: "Organic Coffee Beans",
    description: "Premium Arabica coffee beans grown in the highlands of Malawi. Rich, smooth flavor.",
    price: 3500,
    image: "/burlap-coffee-beans.png",
    category: "Food",
    vendorId: "v2",
    vendorName: "Mzuzu Coffee Co.",
    rating: 4.9,
    reviews: 56,
    stock: 42,
    featured: true,
  },
  {
    id: "3",
    name: "Chitenje Fabric",
    description: "Colorful traditional Malawian fabric, perfect for clothing or home decoration.",
    price: 1800,
    image: "/african-colorful-fabric.jpg",
    category: "Textiles",
    vendorId: "v3",
    vendorName: "Blantyre Textiles",
    rating: 4.7,
    reviews: 38,
    stock: 28,
    featured: true,
  },
  {
    id: "4",
    name: "Wooden Sculpture",
    description: "Hand-carved wooden sculpture depicting traditional Malawian wildlife.",
    price: 4200,
    image: "/african-wood-sculpture.jpg",
    category: "Art",
    vendorId: "v1",
    vendorName: "Lilongwe Crafts",
    rating: 4.9,
    reviews: 19,
    stock: 8,
  },
  {
    id: "5",
    name: "Honey Jar",
    description: "Pure, raw honey harvested from local beekeepers in rural Malawi.",
    price: 1500,
    image: "/golden-honey-jar.png",
    category: "Food",
    vendorId: "v4",
    vendorName: "Sweet Malawi",
    rating: 4.6,
    reviews: 67,
    stock: 55,
  },
  {
    id: "6",
    name: "Beaded Jewelry Set",
    description: "Elegant beaded necklace and earring set, handmade with traditional patterns.",
    price: 2200,
    image: "/african-beaded-jewelry.jpg",
    category: "Jewelry",
    vendorId: "v5",
    vendorName: "Jewels of Malawi",
    rating: 4.8,
    reviews: 43,
    stock: 22,
  },
  {
    id: "7",
    name: "Macadamia Nuts",
    description: "Premium roasted macadamia nuts, grown and processed in Malawi.",
    price: 2800,
    image: "/macadamia-nuts.jpg",
    category: "Food",
    vendorId: "v2",
    vendorName: "Mzuzu Coffee Co.",
    rating: 4.7,
    reviews: 31,
    stock: 38,
  },
  {
    id: "8",
    name: "Pottery Bowl",
    description: "Traditional clay pottery bowl, perfect for serving or decoration.",
    price: 1900,
    image: "/african-pottery-bowl.jpg",
    category: "Crafts",
    vendorId: "v1",
    vendorName: "Lilongwe Crafts",
    rating: 4.5,
    reviews: 28,
    stock: 18,
  },
]

export interface Order {
  id: string
  customerId: string
  customerName: string
  items: Array<{
    productId: string
    productName: string
    quantity: number
    price: number
  }>
  total: number
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  createdAt: string
  vendorId?: string
}

export const mockOrders: Order[] = [
  {
    id: "ORD-001",
    customerId: "c1",
    customerName: "John Banda",
    items: [
      { productId: "1", productName: "Handwoven Basket", quantity: 2, price: 2500 },
      { productId: "3", productName: "Chitenje Fabric", quantity: 1, price: 1800 },
    ],
    total: 6800,
    status: "delivered",
    createdAt: "2025-01-15T10:30:00Z",
    vendorId: "v1",
  },
  {
    id: "ORD-002",
    customerId: "c2",
    customerName: "Grace Phiri",
    items: [{ productId: "2", productName: "Organic Coffee Beans", quantity: 3, price: 3500 }],
    total: 10500,
    status: "shipped",
    createdAt: "2025-01-20T14:15:00Z",
    vendorId: "v2",
  },
  {
    id: "ORD-003",
    customerId: "c3",
    customerName: "Peter Mwale",
    items: [
      { productId: "4", productName: "Wooden Sculpture", quantity: 1, price: 4200 },
      { productId: "6", productName: "Beaded Jewelry Set", quantity: 2, price: 2200 },
    ],
    total: 8600,
    status: "processing",
    createdAt: "2025-01-25T09:45:00Z",
    vendorId: "v1",
  },
]

export interface Vendor {
  id: string
  name: string
  email: string
  description: string
  status: "pending" | "approved" | "rejected"
  joinedDate: string
  totalProducts: number
  totalSales: number
  location?: string
  rating?: number
}

export const mockVendors: Vendor[] = [
  {
    id: "v1",
    name: "Lilongwe Crafts",
    email: "info@lilongwecrafts.mw",
    description: "Traditional Malawian crafts and artwork",
    status: "approved",
    joinedDate: "2024-06-15",
    totalProducts: 24,
    totalSales: 145000,
  },
  {
    id: "v2",
    name: "Mzuzu Coffee Co.",
    email: "sales@mzuzucoffee.mw",
    description: "Premium coffee and agricultural products",
    status: "approved",
    joinedDate: "2024-08-20",
    totalProducts: 12,
    totalSales: 98000,
  },
  {
    id: "v3",
    name: "Blantyre Textiles",
    email: "contact@blantyretextiles.mw",
    description: "Traditional fabrics and textiles",
    status: "approved",
    joinedDate: "2024-09-10",
    totalProducts: 18,
    totalSales: 67000,
  },
  {
    id: "v4",
    name: "Sweet Malawi",
    email: "hello@sweetmalawi.mw",
    description: "Natural honey and bee products",
    status: "pending",
    joinedDate: "2025-01-05",
    totalProducts: 6,
    totalSales: 0,
  },
  {
    id: "v5",
    name: "Jewels of Malawi",
    email: "info@jewelsmalawi.mw",
    description: "Handmade jewelry and accessories",
    status: "approved",
    joinedDate: "2024-11-12",
    totalProducts: 32,
    totalSales: 54000,
  },
]
