export type ProductCategory = "required" | "optional";

export type Product = {
  id: string;
  name: string;
  description?: string;
  category: ProductCategory;
  price: number;
  image: string;
  sizes: string[];
};

export const portalConfig = {
  schoolName: "Rivermere Academy",
  schoolTagline: "Learn · Grow · Belong",
  contactBrand: "Wagner Atelier",
  currency: "USD",
  locale: "en-US",
  showPrices: true,
  grades: [
    "Pre-K",
    "Kindergarten",
    "Grade 1",
    "Grade 2",
    "Grade 3",
    "Grade 4",
    "Grade 5",
    "Grade 6",
    "Grade 7",
    "Grade 8",
    "Grade 9",
    "Grade 10",
    "Grade 11",
    "Grade 12"
  ]
} as const;

export const products: Product[] = [
  {
    id: "blazer",
    name: "School Blazer",
    description: "Navy blazer with school crest.",
    category: "required",
    price: 165,
    image: "/products/blazer.svg",
    sizes: ["6", "8", "10", "12", "14", "16"]
  },
  {
    id: "polo-short",
    name: "Polo Shirt · Short Sleeve",
    description: "White cotton polo with embroidered crest.",
    category: "required",
    price: 35,
    image: "/products/polo.svg",
    sizes: ["6", "8", "10", "12", "14", "16"]
  },
  {
    id: "trousers",
    name: "School Trousers",
    description: "Tailored charcoal school trousers.",
    category: "required",
    price: 85,
    image: "/products/trousers.svg",
    sizes: ["6", "8", "10", "12", "14", "16"]
  },
  {
    id: "skirt",
    name: "School Skirt",
    description: "Pleated school skirt in academy tartan.",
    category: "required",
    price: 75,
    image: "/products/skirt.svg",
    sizes: ["6", "8", "10", "12", "14", "16"]
  },
  {
    id: "cardigan",
    name: "School Cardigan",
    description: "Navy knit cardigan with crest.",
    category: "optional",
    price: 60,
    image: "/products/cardigan.svg",
    sizes: ["6", "8", "10", "12", "14", "16"]
  },
  {
    id: "pe-shirt",
    name: "PE T-Shirt",
    description: "Lightweight navy training top.",
    category: "optional",
    price: 28,
    image: "/products/pe-shirt.svg",
    sizes: ["6", "8", "10", "12", "14", "16"]
  },
  {
    id: "pe-shorts",
    name: "PE Shorts",
    description: "Navy sports shorts with elastic waist.",
    category: "optional",
    price: 25,
    image: "/products/pe-shorts.svg",
    sizes: ["6", "8", "10", "12", "14", "16"]
  }
];

export function formatMoney(value: number) {
  return new Intl.NumberFormat(portalConfig.locale, {
    style: "currency",
    currency: portalConfig.currency,
    maximumFractionDigits: 2
  }).format(value);
}
