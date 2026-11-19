export type Role =
  | 'CUSTOMER'
  | 'SELLER'
  | 'CONTRACTOR'
  | 'ARCHITECT'
  | 'COMPANY'
  | 'ADMIN';

export type Language = 'uz' | 'ru' | 'en';

export type TaskStatus =
  | 'TODO'
  | 'IN_PROGRESS'
  | 'REVIEW'
  | 'COMPLETED'
  | 'CANCELLED';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface User {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  role: Role;
  region: string;
  avatarUrl: string | null;
  verified: number;
}

export interface Product {
  id: number;
  seller_id: number;
  category_id: number;
  category_slug: string;
  category_uz: string;
  category_ru: string;
  category_en: string;
  sku: string;
  name_uz: string;
  name_ru: string;
  name_en: string;
  description_uz: string;
  description_ru: string;
  description_en: string;
  price_uzs: number;
  unit: string;
  region: string;
  delivery_options: string;
  is_available: number;
  moderation_status: string;
  rating: number;
  review_count: number;
  seller_name: string;
  seller_verified: number;
  seller_phone?: string;
  stock_quantity: number;
  image_url: string;
}

export interface Service {
  id: number;
  provider_id: number;
  category_id: number;
  category_slug?: string;
  category_uz: string;
  category_ru: string;
  category_en: string;
  title_uz: string;
  title_ru: string;
  title_en: string;
  description_uz: string;
  description_ru: string;
  description_en: string;
  price_from_uzs: number;
  price_unit: string;
  region: string;
  image_url: string;
  rating: number;
  review_count: number;
  provider_name: string;
  provider_role: Role;
  provider_verified: number;
  provider_phone?: string;
}

export interface Company {
  id: number;
  owner_id: number;
  name: string;
  slug: string;
  description_uz: string;
  description_ru: string;
  description_en: string;
  region: string;
  address: string;
  phone: string;
  email: string;
  license_number: string;
  founded_year: number;
  completed_projects: number;
  rating: number;
  logo_url: string;
  cover_url: string;
  verified: number;
}

export interface Architect {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  phone: string;
  avatar_url: string | null;
  studio_name: string;
  specialty: string;
  experience_years: number;
  region: string;
  license_code: string;
  price_per_sqm_uzs: number;
  verified: number;
  rating: number;
  completed_designs: number;
  bio: string;
}

export interface Project {
  id: number;
  owner_id: number;
  company_id: number | null;
  owner_name: string;
  company_name: string | null;
  name: string;
  description: string;
  address: string;
  region: string;
  construction_type: string;
  building_area_sqm: number;
  floors: number;
  estimated_budget_uzs: number;
  spent_uzs: number;
  status: string;
  progress_percent: number;
  start_date: string;
  expected_end_date: string;
  image_url: string;
}

export interface BlogPost {
  id: number;
  slug: string;
  author_name: string;
  title_uz: string;
  title_ru: string;
  title_en: string;
  excerpt_uz: string;
  excerpt_ru: string;
  excerpt_en: string;
  content_uz: string;
  content_ru: string;
  content_en: string;
  category: string;
  image_url: string;
  read_minutes: number;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
