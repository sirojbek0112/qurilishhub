export type Role =
  | 'CUSTOMER'
  | 'SELLER'
  | 'CONTRACTOR'
  | 'ARCHITECT'
  | 'COMPANY'
  | 'ADMIN';

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

export type PaymentProvider = 'CLICK' | 'PAYME' | 'UZUM';

export type PaymentStatus =
  | 'INITIATED'
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REFUNDED';

export type ModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type Language = 'uz' | 'ru' | 'en';

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  role: Role;
  region: string;
  avatarUrl: string | null;
  verified: number;
  isActive: number;
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: Role;
  type: 'access' | 'refresh';
}

export const UZBEKISTAN_REGIONS = [
  'Toshkent shahri',
  'Toshkent viloyati',
  'Samarqand',
  'Buxoro',
  "Farg'ona",
  'Andijon',
  'Namangan',
  'Xorazm',
  'Qashqadaryo',
  'Surxondaryo',
  'Navoiy',
  'Jizzax',
  'Sirdaryo',
  "Qoraqalpog'iston",
] as const;

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  CUSTOMER: [
    'project:create',
    'project:manage_own',
    'order:create',
    'order:view_own',
    'estimate:create',
    'review:create',
    'chat:participate',
    'payment:initiate',
  ],
  SELLER: [
    'product:create',
    'product:manage_own',
    'inventory:manage_own',
    'order:manage_seller',
    'analytics:view_seller',
    'chat:participate',
  ],
  CONTRACTOR: [
    'service:create',
    'service:manage_own',
    'portfolio:manage_own',
    'project:execute_assigned',
    'task:update_assigned',
    'chat:participate',
  ],
  ARCHITECT: [
    'architect_profile:manage_own',
    'portfolio:manage_own',
    'service:create',
    'estimate:create',
    'chat:participate',
  ],
  COMPANY: [
    'company:manage_own',
    'employee:manage_own',
    'project:create',
    'project:manage_own',
    'estimate:create',
    'contract:manage_own',
    'procurement:create',
    'analytics:view_company',
    'chat:participate',
  ],
  ADMIN: [
    'admin:full_access',
    'user:manage',
    'role:manage',
    'company:verify',
    'contractor:verify',
    'product:moderate',
    'service:moderate',
    'category:manage',
    'order:manage_all',
    'payment:manage_all',
    'complaint:resolve',
    'blog:manage',
    'banner:manage',
    'settings:manage',
    'estimate_config:edit',
    'audit:view',
  ],
};
