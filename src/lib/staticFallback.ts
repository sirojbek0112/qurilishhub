import type { Role } from '../types.ts';

const STORAGE_KEY = 'qh_static_db_v1';

const IMG_HERO = '/src/assets/images/hero_tashkent_construction_1794912446373.jpg';
const IMG_CEMENT = '/src/assets/images/material_cement_bricks_1794912446302.jpg';
const IMG_ROOF = '/src/assets/images/material_roofing_timber_1794912447587.jpg';
const IMG_TEAM = '/src/assets/images/service_construction_team_1794912447881.jpg';
const IMG_VILLA = '/src/assets/images/project_modern_villa_1794912448415.jpg';
const IMG_ARCHITECT = '/src/assets/images/architect_studio_portrait_1794912448885.jpg';

interface StaticUser {
  id: number;
  email: string;
  password: string;
  full_name: string;
  phone: string | null;
  role: Role;
  region: string;
  avatar_url: string | null;
  bio: string | null;
  verified: number;
  is_active: number;
  created_at: string;
}

interface StaticDb {
  users: StaticUser[];
  productCategories: Array<{ id: number; slug: string; name_uz: string; name_ru: string; name_en: string; icon: string }>;
  serviceCategories: Array<{ id: number; slug: string; name_uz: string; name_ru: string; name_en: string }>;
  products: Array<Record<string, unknown>>;
  services: Array<Record<string, unknown>>;
  companies: Array<Record<string, unknown>>;
  employees: Array<Record<string, unknown>>;
  architects: Array<Record<string, unknown>>;
  portfolios: Array<Record<string, unknown>>;
  projects: Array<Record<string, unknown>>;
  tasks: Array<Record<string, unknown>>;
  progress: Array<Record<string, unknown>>;
  expenses: Array<Record<string, unknown>>;
  members: Array<Record<string, unknown>>;
  documents: Array<Record<string, unknown>>;
  contracts: Array<Record<string, unknown>>;
  estimates: Array<Record<string, unknown>>;
  estimateConfigs: Array<{ key: string; label_uz: string; label_ru: string; label_en: string; unit: string; unit_price_uzs: number; coefficient: number }>;
  orders: Array<Record<string, unknown>>;
  payments: Array<Record<string, unknown>>;
  reviews: Array<Record<string, unknown>>;
  favorites: Array<{ id: number; user_id: number; target_type: string; target_id: number }>;
  conversations: Array<Record<string, unknown>>;
  messages: Array<Record<string, unknown>>;
  notifications: Array<Record<string, unknown>>;
  serviceBookings: Array<Record<string, unknown>>;
  complaints: Array<Record<string, unknown>>;
  blogs: Array<Record<string, unknown>>;
  auditLogs: Array<Record<string, unknown>>;
}

function createInitialDb(): StaticDb {
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  return {
    users: [
      { id: 1, email: 'customer@qurilishhub.uz', password: 'Password123!', full_name: 'Azizbek Karimov', phone: '+998 90 123 45 67', role: 'CUSTOMER', region: 'Toshkent shahri', avatar_url: null, bio: 'Xususiy uy-joy qurilishi buyurtmachisi.', verified: 1, is_active: 1, created_at: now },
      { id: 2, email: 'seller@qurilishhub.uz', password: 'Password123!', full_name: 'Bunyod Stroy Market', phone: '+998 93 455 11 22', role: 'SELLER', region: 'Toshkent shahri', avatar_url: null, bio: 'Rasmiy qurilish materiallari dileri.', verified: 1, is_active: 1, created_at: now },
      { id: 3, email: 'samarkand.stroy@qurilishhub.uz', password: 'Password123!', full_name: 'Registon Stroy Savdo', phone: '+998 91 555 88 99', role: 'SELLER', region: 'Samarqand', avatar_url: null, bio: 'Samarqand ulgurji ombori.', verified: 1, is_active: 1, created_at: now },
      { id: 4, email: 'contractor@qurilishhub.uz', password: 'Password123!', full_name: 'Dilshod Tursunov', phone: '+998 97 710 20 30', role: 'CONTRACTOR', region: 'Toshkent shahri', avatar_url: IMG_TEAM, bio: '12 yillik tajribali monolit va poydevor brigadasi.', verified: 1, is_active: 1, created_at: now },
      { id: 5, email: 'fergana.usta@qurilishhub.uz', password: 'Password123!', full_name: 'Sherzod Mirzayev', phone: '+998 90 302 44 55', role: 'CONTRACTOR', region: "Farg'ona", avatar_url: IMG_TEAM, bio: 'Fasad va ichki pardozlash ustalari.', verified: 1, is_active: 1, created_at: now },
      { id: 6, email: 'architect@qurilishhub.uz', password: 'Password123!', full_name: 'Sardorbek Alimov', phone: '+998 94 612 77 88', role: 'ARCHITECT', region: 'Toshkent shahri', avatar_url: IMG_ARCHITECT, bio: 'Zamonaviy villa va biznes markazlari arxitektori.', verified: 1, is_active: 1, created_at: now },
      { id: 7, email: 'madina.design@qurilishhub.uz', password: 'Password123!', full_name: 'Madina Rakhimova', phone: '+998 99 811 23 45', role: 'ARCHITECT', region: 'Samarqand', avatar_url: IMG_ARCHITECT, bio: 'Neo-klassik va sharqona minimalizm dizayneri.', verified: 1, is_active: 1, created_at: now },
      { id: 8, email: 'company@qurilishhub.uz', password: 'Password123!', full_name: 'Toshkent City Build Group', phone: '+998 71 200 45 00', role: 'COMPANY', region: 'Toshkent shahri', avatar_url: IMG_HERO, bio: 'Litsenziyalangan yirik qurilish kompaniyasi.', verified: 1, is_active: 1, created_at: now },
      { id: 9, email: 'bukhara.archbuild@qurilishhub.uz', password: 'Password123!', full_name: 'Buxoro TemirBeton Stroy', phone: '+998 65 224 19 00', role: 'COMPANY', region: 'Buxoro', avatar_url: IMG_HERO, bio: 'Temir-beton va mehmonxona qurilishi.', verified: 1, is_active: 1, created_at: now },
      { id: 10, email: 'admin@qurilishhub.uz', password: 'Password123!', full_name: 'Jasur Rustamov (Admin)', phone: '+998 71 200 00 01', role: 'ADMIN', region: 'Toshkent shahri', avatar_url: null, bio: 'QurilishHub bosh administratori.', verified: 1, is_active: 1, created_at: now },
    ],
    productCategories: [
      { id: 1, slug: 'cement-mixes', name_uz: 'Sement va qorishmalar', name_ru: 'Цемент и смеси', name_en: 'Cement & Mixes', icon: 'Layers' },
      { id: 2, slug: 'bricks-blocks', name_uz: "G'isht va bloklar", name_ru: 'Кирпич и блоки', name_en: 'Bricks & Blocks', icon: 'Grid' },
      { id: 3, slug: 'steel-rebar', name_uz: 'Armatura va metall', name_ru: 'Арматура и металл', name_en: 'Steel & Rebar', icon: 'Wrench' },
      { id: 4, slug: 'roofing-timber', name_uz: "Tom va yog'och", name_ru: 'Кровля и дерево', name_en: 'Roofing & Timber', icon: 'Home' },
      { id: 5, slug: 'insulation-facade', name_uz: 'Issiqlik va fasad', name_ru: 'Утепление и фасад', name_en: 'Insulation & Facade', icon: 'Shield' },
      { id: 6, slug: 'sand-gravel', name_uz: "Qum va shag'al", name_ru: 'Песок и щебень', name_en: 'Sand & Gravel', icon: 'Mountain' },
    ],
    serviceCategories: [
      { id: 1, slug: 'monolith-foundation', name_uz: 'Poydevor va Monolit', name_ru: 'Фундамент и монолит', name_en: 'Foundation & Monolith' },
      { id: 2, slug: 'masonry-walls', name_uz: "G'isht terish va devor", name_ru: 'Кладка и стены', name_en: 'Masonry & Walls' },
      { id: 3, slug: 'facade-finishing', name_uz: 'Fasad va pardozlash', name_ru: 'Фасад и отделка', name_en: 'Facade & Finishing' },
      { id: 4, slug: 'architecture-design', name_uz: 'Arxitektura va loyihalash', name_ru: 'Архитектура и проектирование', name_en: 'Architecture & Design' },
    ],
    products: [
      { id: 1, seller_id: 2, category_id: 1, category_slug: 'cement-mixes', category_uz: 'Sement va qorishmalar', category_ru: 'Цемент и смеси', category_en: 'Cement & Mixes', sku: 'QZS-M500-50', name_uz: 'Qizilqumsement M500 D0 (50 kg)', name_ru: 'Кызылкумцемент М500 Д0 (50 кг)', name_en: 'Qizilqumsement M500 D0 (50 kg)', description_uz: 'Yuqori mustahkamlikdagi asl M500 portlandsement.', description_ru: 'Высокопрочный портландцемент М500.', description_en: 'High-strength M500 Portland cement.', price_uzs: 47500, unit: 'qop (50kg)', region: 'Toshkent shahri', delivery_options: '24 soatda yetkazish / Olib ketish', is_available: 1, moderation_status: 'APPROVED', rating: 4.9, review_count: 34, seller_name: 'Bunyod Stroy Market', seller_verified: 1, stock_quantity: 1200, image_url: IMG_CEMENT },
      { id: 2, seller_id: 3, category_id: 1, category_slug: 'cement-mixes', category_uz: 'Sement va qorishmalar', category_ru: 'Цемент и смеси', category_en: 'Cement & Mixes', sku: 'OHG-M400-50', name_uz: 'Ohangaron Sement M400 D20 (50 kg)', name_ru: 'Ахангаран Цемент М400 Д20 (50 кг)', name_en: 'Ohangaron Cement M400 D20 (50 kg)', description_uz: "G'isht terish va suvoq uchun M400 sementi.", description_ru: 'Цемент М400 для кладки и штукатурки.', description_en: 'Reliable M400 masonry cement.', price_uzs: 44000, unit: 'qop (50kg)', region: 'Samarqand', delivery_options: 'Samarqand bo‘ylab yetkazish', is_available: 1, moderation_status: 'APPROVED', rating: 4.8, review_count: 19, seller_name: 'Registon Stroy Savdo', seller_verified: 1, stock_quantity: 850, image_url: IMG_CEMENT },
      { id: 3, seller_id: 2, category_id: 2, category_slug: 'bricks-blocks', category_uz: "G'isht va bloklar", category_ru: 'Кирпич и блоки', category_en: 'Bricks & Blocks', sku: 'BRK-M150-RED', name_uz: "Pishiq qizil g'isht M150 (250x120x65 mm)", name_ru: 'Кирпич красный жженый М150', name_en: 'Fired Red Clay Brick M150', description_uz: "O'choqda pishirilgan yuqori zichlikdagi g'isht.", description_ru: 'Обожженный кирпич высокой плотности М150.', description_en: 'Kiln-fired high-density M150 clay brick.', price_uzs: 1450, unit: 'dona', region: 'Toshkent shahri', delivery_options: 'Manipulyator bilan tushirish', is_available: 1, moderation_status: 'APPROVED', rating: 4.9, review_count: 52, seller_name: 'Bunyod Stroy Market', seller_verified: 1, stock_quantity: 45000, image_url: IMG_CEMENT },
      { id: 4, seller_id: 3, category_id: 2, category_slug: 'bricks-blocks', category_uz: "G'isht va bloklar", category_ru: 'Кирпич и блоки', category_en: 'Bricks & Blocks', sku: 'BRK-M150-SMK', name_uz: "Samarqand pishiq g'ishti M150", name_ru: 'Самаркандский жженый кирпич М150', name_en: 'Samarkand Fired Brick M150', description_uz: "Sifatli zavod g'ishti.", description_ru: 'Качественный заводской кирпич.', description_en: 'Precision factory-fired brick.', price_uzs: 1380, unit: 'dona', region: 'Samarqand', delivery_options: 'KamAZ yetkazish', is_available: 1, moderation_status: 'APPROVED', rating: 4.7, review_count: 27, seller_name: 'Registon Stroy Savdo', seller_verified: 1, stock_quantity: 60000, image_url: IMG_CEMENT },
      { id: 5, seller_id: 2, category_id: 3, category_slug: 'steel-rebar', category_uz: 'Armatura va metall', category_ru: 'Арматура и металл', category_en: 'Steel & Rebar', sku: 'ARM-A500-12', name_uz: 'Bekobod Armatura A500C d12 mm', name_ru: 'Бекабадская арматура А500С д12 мм', name_en: 'Bekabad Rebar A500C d12 mm', description_uz: "O'zmetkombinat mahsuloti — A500C sertifikatli po'lat armatura.", description_ru: 'Сертифицированная арматура А500С.', description_en: 'Certified Uzmetkombinat A500C steel rebar.', price_uzs: 9650000, unit: 'tonna', region: 'Toshkent shahri', delivery_options: 'Uzun o‘lchamli transport', is_available: 1, moderation_status: 'APPROVED', rating: 5.0, review_count: 41, seller_name: 'Bunyod Stroy Market', seller_verified: 1, stock_quantity: 48, image_url: IMG_CEMENT },
      { id: 6, seller_id: 2, category_id: 4, category_slug: 'roofing-timber', category_uz: "Tom va yog'och", category_ru: 'Кровля и дерево', category_en: 'Roofing & Timber', sku: 'ROOF-ANT-05', name_uz: 'Matoviy Profnastil Antratsit 0.5 mm', name_ru: 'Профнастил матовый антрацит 0.5 мм', name_en: 'Matte Anthracite Metal Roofing 0.5 mm', description_uz: 'Polimer qoplamali zanglamaydigan tom listi (RAL 7024).', description_ru: 'Кровельный лист с полимерным покрытием.', description_en: 'Polymer-coated architectural roofing sheet.', price_uzs: 118000, unit: 'm²', region: 'Toshkent shahri', delivery_options: "Buyurtma o'lchamida kesib berish", is_available: 1, moderation_status: 'APPROVED', rating: 4.9, review_count: 28, seller_name: 'Bunyod Stroy Market', seller_verified: 1, stock_quantity: 3200, image_url: IMG_ROOF },
      { id: 7, seller_id: 2, category_id: 4, category_slug: 'roofing-timber', category_uz: "Tom va yog'och", category_ru: 'Кровля и дерево', category_en: 'Roofing & Timber', sku: 'TIM-PINE-150', name_uz: "Quritilgan Qarag'ay Brus 150x150 mm (6m)", name_ru: 'Сухой сосновый брус 150x150 мм (6м)', name_en: 'Kiln-Dried Pine Timber 150x150 mm', description_uz: 'Tom stropilasi uchun 1-navli quritilgan brus.', description_ru: 'Сухой сосновый брус 1 сорта.', description_en: 'Grade-1 kiln-dried structural pine timber.', price_uzs: 420000, unit: 'dona (6m)', region: 'Toshkent viloyati', delivery_options: 'Toshkent va viloyatga yetkazish', is_available: 1, moderation_status: 'APPROVED', rating: 4.8, review_count: 22, seller_name: 'Bunyod Stroy Market', seller_verified: 1, stock_quantity: 410, image_url: IMG_ROOF },
      { id: 8, seller_id: 2, category_id: 5, category_slug: 'insulation-facade', category_uz: 'Issiqlik va fasad', category_ru: 'Утепление и фасад', category_en: 'Insulation & Facade', sku: 'INS-BAS-100', name_uz: 'Bazalt Mineral Vata 100 mm (A1 yonmas)', name_ru: 'Базальтовая минвата 100 мм', name_en: 'Basalt Mineral Wool 100 mm', description_uz: "Fasad va tom izolyatsiyasi uchun bazalt plita.", description_ru: 'Негорючая базальтовая плита.', description_en: 'Fire-rated A1 basalt thermal wool.', price_uzs: 78000, unit: 'm²', region: 'Toshkent shahri', delivery_options: 'Manzilga yetkazish', is_available: 1, moderation_status: 'APPROVED', rating: 4.8, review_count: 15, seller_name: 'Bunyod Stroy Market', seller_verified: 1, stock_quantity: 1900, image_url: IMG_ROOF },
    ],
    services: [
      { id: 1, provider_id: 4, category_id: 1, category_slug: 'monolith-foundation', category_uz: 'Poydevor va Monolit', category_ru: 'Фундамент и монолит', category_en: 'Foundation & Monolith', title_uz: 'Temir-beton poydevor va monolit karkas qurilishi', title_ru: 'Строительство железобетонного фундамента', title_en: 'Reinforced Concrete Foundation & Monolith Framing', description_uz: 'Loyiha chizmalari asosida qolip, armatura va beton quyish.', description_ru: 'Опалубка, вязка арматуры и заливка бетона.', description_en: 'Formwork, rebar tying, and concrete pouring.', price_from_uzs: 420000, price_unit: 'm³', region: 'Toshkent shahri', image_url: IMG_TEAM, moderation_status: 'APPROVED', rating: 4.9, review_count: 29, provider_name: 'Dilshod Tursunov', provider_role: 'CONTRACTOR', provider_verified: 1 },
      { id: 2, provider_id: 4, category_id: 2, category_slug: 'masonry-walls', category_uz: "G'isht terish va devor", category_ru: 'Кладка и стены', category_en: 'Masonry & Walls', title_uz: "Pishiq g'isht va gazoblok terish (brigada)", title_ru: 'Кладка жженого кирпича и газоблока', title_en: 'Brick & Foam-Block Structural Masonry', description_uz: 'Lazer nivelir nazorati ostida tekis devorlar terish.', description_ru: 'Ровная кладка под лазерный уровень.', description_en: 'Laser-leveled structural masonry.', price_from_uzs: 145000, price_unit: 'm²', region: 'Toshkent shahri', image_url: IMG_TEAM, moderation_status: 'APPROVED', rating: 4.8, review_count: 18, provider_name: 'Dilshod Tursunov', provider_role: 'CONTRACTOR', provider_verified: 1 },
      { id: 3, provider_id: 5, category_id: 3, category_slug: 'facade-finishing', category_uz: 'Fasad va pardozlash', category_ru: 'Фасад и отделка', category_en: 'Facade & Finishing', title_uz: "Travertin fasad va kalit topshirish ichki ta'mir", title_ru: 'Травертиновый фасад и ремонт под ключ', title_en: 'Travertine Facade & Turnkey Fit-Out', description_uz: 'Tabiiy travertin qoplama, elektr, santexnika va bo‘yoq ishlari.', description_ru: 'Облицовка травертином, электрика и отделка.', description_en: 'Travertine cladding, MEP, and interior finishing.', price_from_uzs: 360000, price_unit: 'm²', region: "Farg'ona", image_url: IMG_VILLA, moderation_status: 'APPROVED', rating: 4.9, review_count: 24, provider_name: 'Sherzod Mirzayev', provider_role: 'CONTRACTOR', provider_verified: 1 },
      { id: 4, provider_id: 6, category_id: 4, category_slug: 'architecture-design', category_uz: 'Arxitektura va loyihalash', category_ru: 'Архитектура и проектирование', category_en: 'Architecture & Design', title_uz: 'Individual uy arxitektura loyihasi (AR + KR)', title_ru: 'Архитектурный проект дома (АР + КР)', title_en: 'Architectural & Structural Blueprints (AR + KR)', description_uz: '3D vizualizatsiya, rejalashtirish va konstruktiv chizmalar.', description_ru: '3D-визуализация и рабочие чертежи.', description_en: '3D BIM visualization and structural sheets.', price_from_uzs: 190000, price_unit: 'm²', region: 'Toshkent shahri', image_url: IMG_ARCHITECT, moderation_status: 'APPROVED', rating: 5.0, review_count: 37, provider_name: 'Sardorbek Alimov', provider_role: 'ARCHITECT', provider_verified: 1 },
    ],
    companies: [
      { id: 1, owner_id: 8, name: 'Toshkent City Build Group', slug: 'toshkent-city-build-group', description_uz: "Toshkent shahrida turar-joy va biznes markazlarini kalit topshirish asosida quruvchi kompaniya.", description_ru: 'Ведущая строительная компания в Ташкенте.', description_en: 'Leading Tashkent turnkey construction group.', region: 'Toshkent shahri', address: "Shayxontohur tumani, Navoiy ko'chasi 42", phone: '+998 71 200 45 00', email: 'info@tcbg.uz', license_number: 'UZ-LIC-2019-00412', founded_year: 2012, completed_projects: 38, rating: 4.9, logo_url: IMG_HERO, cover_url: IMG_HERO, verified: 1 },
      { id: 2, owner_id: 9, name: 'Buxoro TemirBeton Stroy', slug: 'bukhara-temirbeton-stroy', description_uz: 'Buxoro va Navoiy viloyatlarida mustahkam temir-beton konstruksiyalar va mehmonxonalar qurilishi.', description_ru: 'Строительство железобетонных конструкций и гостиниц.', description_en: 'Reinforced concrete structures and hotels across Bukhara.', region: 'Buxoro', address: "Buxoro sh., I. Karimov ko'chasi 19", phone: '+998 65 224 19 00', email: 'contact@bts-bukhara.uz', license_number: 'UZ-LIC-2017-00891', founded_year: 2015, completed_projects: 24, rating: 4.8, logo_url: IMG_TEAM, cover_url: IMG_VILLA, verified: 1 },
    ],
    employees: [
      { id: 1, company_id: 1, full_name: 'Rustam Xolmatov', position: 'Bosh muhandis', specialty: 'Monolit konstruksiya', salary_uzs: 18000000 },
      { id: 2, company_id: 1, full_name: 'Nodira Saidova', position: 'Smeta muhandisi', specialty: 'Xarajat va smeta nazorati', salary_uzs: 14500000 },
      { id: 3, company_id: 1, full_name: 'Otabek Qodirov', position: 'Prorab', specialty: 'Obyekt boshqaruvi', salary_uzs: 15000000 },
    ],
    architects: [
      { id: 1, user_id: 6, full_name: 'Sardorbek Alimov', email: 'architect@qurilishhub.uz', phone: '+998 94 612 77 88', avatar_url: IMG_ARCHITECT, studio_name: 'Alimov Studio Architecture', specialty: 'Zamonaviy villa va jamoat binolari', experience_years: 11, region: 'Toshkent shahri', license_code: 'ARC-UZ-4410', price_per_sqm_uzs: 190000, verified: 1, rating: 4.9, completed_designs: 54, bio: 'Energiya tejamkor fasadlar va 3D BIM modellashtirish.' },
      { id: 2, user_id: 7, full_name: 'Madina Rakhimova', email: 'madina.design@qurilishhub.uz', phone: '+998 99 811 23 45', avatar_url: IMG_ARCHITECT, studio_name: 'Registon Spatial Lab', specialty: 'Milliy-modern kottej va interyer', experience_years: 7, region: 'Samarqand', license_code: 'ARC-UZ-5982', price_per_sqm_uzs: 155000, verified: 1, rating: 4.8, completed_designs: 29, bio: 'Samarqand an’analari va zamonaviy minimalizm uyg‘unligi.' },
    ],
    portfolios: [
      { id: 1, user_id: 6, title: 'Qibray Travertin Villasi', category: 'Villa', region: 'Toshkent viloyati', area_sqm: 420, completion_year: 2025, image_url: IMG_VILLA, description: '2 qavatli hovuzli zamonaviy travertin qarorgoh.' },
      { id: 2, user_id: 6, title: "Mirzo Ulug'bek Biznes Paviloni", category: 'Tijorat', region: 'Toshkent shahri', area_sqm: 1150, completion_year: 2024, image_url: IMG_HERO, description: 'Panoramali shisha fasadli ofis majmuasi.' },
    ],
    projects: [
      { id: 1, owner_id: 1, company_id: 1, owner_name: 'Azizbek Karimov', company_name: 'Toshkent City Build Group', name: 'Yunusobod 2-Qavatli Zamonaviy Villa', description: '320 m² maydonli travertin fasadli zamonaviy oilaviy turar-joy qurilishi.', address: 'Toshkent sh., Yunusobod tumani, 14-mavze, 28-uy', region: 'Toshkent shahri', construction_type: 'VILLA', building_area_sqm: 320, floors: 2, estimated_budget_uzs: 1450000000, spent_uzs: 685000000, status: 'IN_PROGRESS', progress_percent: 58, start_date: '2026-03-10', expected_end_date: '2026-12-20', image_url: IMG_VILLA },
      { id: 2, owner_id: 8, company_id: 1, owner_name: 'Toshkent City Build Group', company_name: 'Toshkent City Build Group', name: 'Chilonzor Business Park — B Korpus', description: '5 qavatli zamonaviy ofis va savdo markazi monolit karkas qurilishi.', address: "Toshkent sh., Chilonzor tumani, Bunyodkor ko'chasi 7", region: 'Toshkent shahri', construction_type: 'COMMERCIAL', building_area_sqm: 2400, floors: 5, estimated_budget_uzs: 12800000000, spent_uzs: 5400000000, status: 'IN_PROGRESS', progress_percent: 44, start_date: '2026-01-15', expected_end_date: '2027-06-30', image_url: IMG_HERO },
      { id: 3, owner_id: 9, company_id: 2, owner_name: 'Buxoro TemirBeton Stroy', company_name: 'Buxoro TemirBeton Stroy', name: 'Buxoro Silk Road Boutique Hotel', description: '3 qavatli mehmonxona kompleksi.', address: "Buxoro sh., Bahouddin Naqshband ko'chasi 112", region: 'Buxoro', construction_type: 'COMMERCIAL', building_area_sqm: 1150, floors: 3, estimated_budget_uzs: 5900000000, spent_uzs: 4950000000, status: 'IN_PROGRESS', progress_percent: 84, start_date: '2025-09-01', expected_end_date: '2026-12-10', image_url: IMG_VILLA },
    ],
    tasks: [
      { id: 1, project_id: 1, assignee_id: 4, assignee_name: 'Dilshod Tursunov', title: 'Poydevor va gidroizolyatsiya', status: 'COMPLETED', priority: 'HIGH', deadline: '2026-04-15' },
      { id: 2, project_id: 1, assignee_id: 4, assignee_name: 'Dilshod Tursunov', title: "2-qavat pishiq g'isht devorlari", status: 'IN_PROGRESS', priority: 'HIGH', deadline: '2026-11-28' },
      { id: 3, project_id: 1, assignee_id: 6, assignee_name: 'Sardorbek Alimov', title: 'Fasad travertin chizmasi tasdiqlash', status: 'REVIEW', priority: 'MEDIUM', deadline: '2026-11-22' },
    ],
    progress: [
      { id: 1, project_id: 1, author_id: 4, title: '2-qavat devorlari 75% terildi', notes: 'M150 g‘isht bilan sifatli terim davom etmoqda.', percent_complete: 58, photo_url: IMG_HERO, created_at: now },
    ],
    expenses: [
      { id: 1, project_id: 1, category: 'Materiallar', title: 'Bekobod Armatura A500C (14 tonna)', amount_uzs: 135100000, expense_date: '2026-04-02' },
      { id: 2, project_id: 1, category: 'Ish haqi', title: 'Monolit va g‘isht terish bosqich to‘lovi', amount_uzs: 240000000, expense_date: '2026-07-20' },
    ],
    members: [
      { id: 1, project_id: 1, user_id: 1, full_name: 'Azizbek Karimov', member_role: 'OWNER' },
      { id: 2, project_id: 1, user_id: 4, full_name: 'Dilshod Tursunov', member_role: 'LEAD_CONTRACTOR' },
    ],
    documents: [
      { id: 1, project_id: 1, title: 'AR-KR-Yunusobod-Villa-v3.pdf', doc_type: 'BLUEPRINT', file_size_kb: 4280, created_at: now },
    ],
    contracts: [
      { id: 1, contract_number: 'QH-CTR-2026-0108', project_id: 1, project_name: 'Yunusobod 2-Qavatli Zamonaviy Villa', client_id: 1, contractor_id: 4, contractor_name: 'Dilshod Tursunov', title: "Yunusobod Villa — Karkas va G'isht Terish Shartnomasi", amount_uzs: 420000000, status: 'ACTIVE' },
    ],
    estimates: [
      { id: 1, user_id: 1, title: 'Yunusobod Villa — Dastlabki Smeta', building_area_sqm: 160, floors: 2, region: 'Toshkent shahri', total_estimated_uzs: 984500000 },
    ],
    estimateConfigs: [
      { key: 'cement', label_uz: 'Sement M400/M500', label_ru: 'Цемент М400/М500', label_en: 'Portland Cement M400/M500', unit: 'qop (50kg)', unit_price_uzs: 46000, coefficient: 1.0 },
      { key: 'bricks', label_uz: "Pishiq g'isht M150", label_ru: 'Кирпич жженый М150', label_en: 'Fired Clay Bricks M150', unit: 'dona', unit_price_uzs: 1450, coefficient: 1.0 },
      { key: 'sand', label_uz: 'Qurilish qumi', label_ru: 'Песок строительный', label_en: 'Washed River Sand', unit: 'm³', unit_price_uzs: 120000, coefficient: 1.0 },
      { key: 'gravel', label_uz: "Shag'al (sheben)", label_ru: 'Щебень строительный', label_en: 'Crushed Gravel Aggregate', unit: 'm³', unit_price_uzs: 145000, coefficient: 1.0 },
      { key: 'rebar', label_uz: 'Armatura A500C', label_ru: 'Арматура А500С', label_en: 'Steel Rebar A500C', unit: 'tonna', unit_price_uzs: 9600000, coefficient: 1.0 },
      { key: 'roofing', label_uz: 'Tom yopish materiali', label_ru: 'Кровельные материалы', label_en: 'Roofing Sheets & Timber', unit: 'm²', unit_price_uzs: 118000, coefficient: 1.0 },
      { key: 'labor', label_uz: 'Usta va ishchi kuchi', label_ru: 'Строительно-монтажные работы', label_en: 'Construction Labor', unit: 'm²', unit_price_uzs: 820000, coefficient: 1.0 },
      { key: 'other', label_uz: "Muhandislik va qo'shimcha xarajatlar", label_ru: 'Инженерные и прочие расходы', label_en: 'Engineering & Contingency', unit: 'm²', unit_price_uzs: 340000, coefficient: 1.0 },
    ],
    orders: [
      { id: 1, order_number: 'QH-ORD-26011', customer_id: 1, seller_id: 2, customer_name: 'Azizbek Karimov', seller_name: 'Bunyod Stroy Market', status: 'SHIPPED', total_uzs: 23750000, created_at: now },
    ],
    payments: [
      { id: 1, payment_ref: 'PAY-SANDBOX-1001', user_id: 1, order_id: 1, provider: 'PAYME', amount_uzs: 23750000, status: 'COMPLETED', created_at: now },
    ],
    reviews: [
      { id: 1, author_name: 'Azizbek Karimov', target_type: 'PRODUCT', target_id: 1, rating: 5, comment: "Qizilqumsement sifati a'lo, o'z vaqtida yetkazildi.", created_at: now },
    ],
    favorites: [{ id: 1, user_id: 1, target_type: 'PRODUCT', target_id: 1 }],
    conversations: [
      { id: 1, participant_one: 1, participant_two: 2, subject: 'Qizilqumsement M500 yetkazib berish', last_message_at: now },
      { id: 2, participant_one: 1, participant_two: 4, subject: 'Yunusobod Villa — 2-qavat devor ishlari', last_message_at: now },
    ],
    messages: [
      { id: 1, conversation_id: 1, sender_id: 1, sender_name: 'Azizbek Karimov', body: 'Assalomu alaykum! 500 qop M500 sement Yunusobodga ertaga yetib boradimi?', is_read: 1, created_at: now },
      { id: 2, conversation_id: 1, sender_id: 2, sender_name: 'Bunyod Stroy Market', body: 'Va alaykum assalom! Ha, buyurtmangiz tasdiqlandi, ertaga soat 08:30 da mashina yo‘lga chiqadi.', is_read: 0, created_at: now },
      { id: 3, conversation_id: 2, sender_id: 4, sender_name: 'Dilshod Tursunov', body: 'Bugun 2-qavatning sharqiy devori yakunlandi, foto hisobotni yukladim.', is_read: 0, created_at: now },
    ],
    notifications: [
      { id: 1, user_id: 1, title: 'Buyurtma yo‘lga chiqdi', body: 'QH-ORD-26011 raqamli buyurtmangiz SHIPPED holatiga o‘tdi.', is_read: 0, created_at: now },
      { id: 2, user_id: 1, title: 'Yangi foto hisobot', body: 'Yunusobod Villa loyihasida progress 58% ga yetdi.', is_read: 0, created_at: now },
    ],
    serviceBookings: [],
    complaints: [],
    blogs: [
      { id: 1, slug: 'ozbekistonda-uy-qurish-smetasi-2026', author_name: 'Jasur Rustamov (Admin)', title_uz: "O'zbekistonda 2026-yilda xususiy uy qurish xarajatlari va smeta tuzish qoidalari", title_ru: 'Стоимость строительства частного дома в Узбекистане в 2026 году', title_en: '2026 Guide to Residential Construction Costs in Uzbekistan', excerpt_uz: "Poydevor, devor materiallari va hududiy logistika narxlarini to'g'ri hisoblash qo'llanmasi.", excerpt_ru: 'Практическое руководство по расчёту сметы.', excerpt_en: 'Practical guide to estimating materials and freight in UZS.', content_uz: "O'zbekiston bozorida qurilish xarajatlarining 55–62 foizini asosiy materiallar (sement, pishiq g'isht, A500C armatura va tom yopish qoplamalari) tashkil etadi. QurilishHub kalkulyatori orqali dastlabki taxminiy xarajatlarni bir necha soniyada ko'rishingiz mumkin.", content_ru: 'В структуре затрат на строительство 55–62% приходится на базовые материалы.', content_en: 'Core structural materials account for 55–62% of residential build budgets in Uzbekistan.', category: 'Smeta va Moliya', image_url: IMG_HERO, read_minutes: 6, created_at: now },
      { id: 2, slug: 'pishiq-gisht-yoki-gazoblok-tanlovi', author_name: 'Sardorbek Alimov', title_uz: "Pishiq g'isht yoki gazoblok: O'zbekiston iqlimi uchun qaysi biri ma'qul?", title_ru: 'Жженый кирпич или газоблок: что выбрать?', title_en: 'Fired Brick vs. Aerated Concrete Blocks', excerpt_uz: 'Issiqlik saqlash, seysmik chidamlilik va devor qalinligi bo‘yicha muhandislik taqqoslash.', excerpt_ru: 'Сравнение теплоизоляции и сейсмостойкости.', excerpt_en: 'Thermal and seismic comparison.', content_uz: "Yozgi +45°C issiq va qishki sovuqlarda devor materialining issiqlik inersiyasi katta ahamiyatga ega. Monolit karkasli uylarda gazoblok + bazalt vata kombinatsiyasi energiya sarfini 30% gacha tejaydi.", content_ru: 'Комбинация газоблока и базальтовой ваты снижает расходы на отопление и охлаждение.', content_en: 'Aerated blocks with basalt wool reduce HVAC loads.', category: 'Arxitektura', image_url: IMG_CEMENT, read_minutes: 5, created_at: now },
      { id: 3, slug: 'seysmik-poydevor-va-armatura-nazorati', author_name: 'Dilshod Tursunov', title_uz: 'Seysmik hududda poydevor quyish: A500C armatura va M350 beton standartlari', title_ru: 'Заливка фундамента в сейсмической зоне', title_en: 'Seismic Foundation Standards: A500C Rebar & M350 Concrete', excerpt_uz: 'Qurilish maydonida armatura to‘qish va himoya qatlami nazorati.', excerpt_ru: 'Контроль вязки арматуры и защитного слоя.', excerpt_en: 'Field checklist for rebar cover and curing.', content_uz: "A500C sinfidagi armaturani bog‘lash simi bilan to‘qish va kamida 40 mm himoya qatlami saqlash konstruksiyaning seysmik barqarorligini ta’minlaydi.", content_ru: 'Вязка арматуры проволокой сохраняет пластичность узлов.', content_en: 'Tying A500C rebar with a 40mm concrete cover preserves seismic ductility.', category: 'Texnologiya', image_url: IMG_TEAM, read_minutes: 4, created_at: now },
    ],
    auditLogs: [
      { id: 1, actor_name: 'SYSTEM', action: 'STATIC_FALLBACK_READY', entity_type: 'SYSTEM', created_at: now },
    ],
  };
}

function getDb(): StaticDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as StaticDb;
  } catch {
    // ignore
  }
  const init = createInitialDb();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
  return init;
}

function saveDb(db: StaticDb): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function getCurrentUser(db: StaticDb, authHeader: string | null): StaticUser | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  if (!token.startsWith('static-uid-')) return null;
  const uid = Number(token.replace('static-uid-', ''));
  return db.users.find((u) => u.id === uid && u.is_active === 1) ?? null;
}

const REGION_MULTIPLIERS: Record<string, number> = {
  'Toshkent shahri': 1.08,
  'Toshkent viloyati': 1.02,
  Samarqand: 1.0,
  Buxoro: 0.99,
  "Farg'ona": 0.96,
  Andijon: 0.95,
  Namangan: 0.95,
  Xorazm: 1.01,
  Qashqadaryo: 0.97,
  Surxondaryo: 0.98,
  Navoiy: 1.0,
  Jizzax: 0.96,
  Sirdaryo: 0.96,
  "Qoraqalpog'iston": 1.03,
};

function calcEstimate(db: StaticDb, body: Record<string, unknown>) {
  const area = Math.max(20, Number(body.buildingAreaSqm || 160));
  const floors = Math.max(1, Number(body.floors || 2));
  const region = String(body.region || 'Toshkent shahri');
  const lang = String(body.lang || 'uz');
  const totalArea = area * floors;
  const regionMult = REGION_MULTIPLIERS[region] ?? 1.0;

  const typeMult = body.constructionType === 'COMMERCIAL' ? 1.18 : body.constructionType === 'VILLA' ? 1.14 : body.constructionType === 'WAREHOUSE' ? 0.88 : 1.0;
  const foundMult = body.foundationType === 'PILE' ? 1.25 : body.foundationType === 'SLAB' ? 1.15 : 1.0;
  const wallFactor = body.wallMaterial === 'FIRED_BRICK' ? 1.0 : body.wallMaterial === 'FOAM_BLOCK' ? 0.42 : 0.25;
  const roofMult = body.roofType === 'METAL_TILE' ? 1.15 : body.roofType === 'FLAT_MEMBRANE' ? 1.22 : 1.0;
  const finishMult = body.finishingType === 'PREMIUM' ? 1.45 : body.finishingType === 'STANDARD' ? 1.15 : 0.9;

  const cfg = (key: string) => db.estimateConfigs.find((c) => c.key === key)!;
  const labelOf = (c: StaticDb['estimateConfigs'][0]) => (lang === 'ru' ? c.label_ru : lang === 'en' ? c.label_en : c.label_uz);

  const raw = [
    { itemKey: 'cement', c: cfg('cement'), qty: Math.ceil(totalArea * 1.45 * foundMult * typeMult * cfg('cement').coefficient), price: Math.round(cfg('cement').unit_price_uzs * regionMult) },
    { itemKey: 'bricks', c: cfg('bricks'), qty: Math.ceil(totalArea * 155 * wallFactor * typeMult * cfg('bricks').coefficient), price: Math.round(cfg('bricks').unit_price_uzs * regionMult) },
    { itemKey: 'sand', c: cfg('sand'), qty: Number((totalArea * 0.34 * foundMult * cfg('sand').coefficient).toFixed(1)), price: Math.round(cfg('sand').unit_price_uzs * regionMult) },
    { itemKey: 'gravel', c: cfg('gravel'), qty: Number((totalArea * 0.28 * foundMult * cfg('gravel').coefficient).toFixed(1)), price: Math.round(cfg('gravel').unit_price_uzs * regionMult) },
    { itemKey: 'rebar', c: cfg('rebar'), qty: Number((totalArea * 0.038 * foundMult * typeMult * cfg('rebar').coefficient).toFixed(2)), price: Math.round(cfg('rebar').unit_price_uzs * regionMult) },
    { itemKey: 'roofing', c: cfg('roofing'), qty: Math.ceil(area * 1.24 * roofMult * cfg('roofing').coefficient), price: Math.round(cfg('roofing').unit_price_uzs * regionMult) },
    { itemKey: 'labor', c: cfg('labor'), qty: Math.ceil(totalArea), price: Math.round(cfg('labor').unit_price_uzs * finishMult * typeMult * regionMult * cfg('labor').coefficient) },
    { itemKey: 'other', c: cfg('other'), qty: Math.ceil(totalArea), price: Math.round(cfg('other').unit_price_uzs * finishMult * regionMult * cfg('other').coefficient) },
  ];

  const items = raw.map((r) => ({
    itemKey: r.itemKey,
    name: labelOf(r.c),
    quantity: r.qty,
    unit: r.c.unit,
    unitPriceUzs: r.price,
    subtotalUzs: Math.round(r.qty * r.price),
  }));

  const materialsTotalUzs = items.filter((i) => i.itemKey !== 'labor' && i.itemKey !== 'other').reduce((s, i) => s + i.subtotalUzs, 0);
  const laborTotalUzs = items.find((i) => i.itemKey === 'labor')?.subtotalUzs ?? 0;
  const otherTotalUzs = items.find((i) => i.itemKey === 'other')?.subtotalUzs ?? 0;

  return {
    isEstimate: true,
    disclaimer:
      lang === 'ru'
        ? 'Предварительная смета: расчёты носят ориентировочный характер и не являются сертифицированным инженерным проектом.'
        : lang === 'en'
        ? 'Preliminary estimate only: values are approximate market projections and do not constitute a certified engineering calculation.'
        : "Taxminiy hisob-kitob: ushbu smeta bozor narxlariga asoslangan taxminiy hisob bo'lib, sertifikatlangan muhandislik loyihasi hisoblanmaydi.",
    currency: 'UZS',
    regionMultiplier: regionMult,
    items,
    materialsTotalUzs,
    laborTotalUzs,
    otherTotalUzs,
    totalEstimatedUzs: materialsTotalUzs + laborTotalUzs + otherTotalUzs,
  };
}

export async function handleStaticFallbackRequest(
  url: string,
  options: RequestInit,
  authHeader: string | null
): Promise<unknown> {
  const db = getDb();
  const method = (options.method || 'GET').toUpperCase();
  const [pathname, searchStr] = url.split('?');
  const params = new URLSearchParams(searchStr || '');
  const body = options.body && typeof options.body === 'string' ? (JSON.parse(options.body) as Record<string, unknown>) : {};
  const user = getCurrentUser(db, authHeader);
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  // Auth
  if (pathname === '/api/auth/login' && method === 'POST') {
    const email = String(body.email || '').toLowerCase();
    const password = String(body.password || '');
    const found = db.users.find((u) => u.email === email && u.password === password && u.is_active === 1);
    if (!found) throw new Error('Invalid email or password');
    const token = `static-uid-${found.id}`;
    return {
      accessToken: token,
      refreshToken: token,
      user: {
        id: found.id,
        email: found.email,
        fullName: found.full_name,
        phone: found.phone,
        role: found.role,
        region: found.region,
        avatarUrl: found.avatar_url,
        verified: found.verified,
      },
    };
  }

  if (pathname === '/api/auth/register' && method === 'POST') {
    const email = String(body.email || '').toLowerCase();
    if (db.users.some((u) => u.email === email)) throw new Error('Email already registered');
    const id = Math.max(0, ...db.users.map((u) => u.id)) + 1;
    const role = (body.role as Role) || 'CUSTOMER';
    const newUser: StaticUser = {
      id,
      email,
      password: String(body.password || 'Password123!'),
      full_name: String(body.fullName || 'Foydalanuvchi'),
      phone: body.phone ? String(body.phone) : null,
      role,
      region: String(body.region || 'Toshkent shahri'),
      avatar_url: null,
      bio: null,
      verified: role === 'CUSTOMER' ? 1 : 0,
      is_active: 1,
      created_at: now,
    };
    db.users.push(newUser);
    saveDb(db);
    const token = `static-uid-${id}`;
    return {
      accessToken: token,
      refreshToken: token,
      user: { id, email, fullName: newUser.full_name, phone: newUser.phone, role, region: newUser.region, avatarUrl: null, verified: newUser.verified },
    };
  }

  if (pathname === '/api/auth/me') {
    if (!user) throw new Error('Authentication required');
    return { user };
  }

  if (pathname === '/api/auth/profile' && method === 'PATCH') {
    if (!user) throw new Error('Authentication required');
    if (body.fullName) user.full_name = String(body.fullName);
    if (body.phone !== undefined) user.phone = String(body.phone);
    if (body.region) user.region = String(body.region);
    saveDb(db);
    return { success: true };
  }

  if (pathname === '/api/auth/logout') return { success: true };
  if (pathname === '/api/auth/forgot-password') {
    return { success: true, message: 'Agar ushbu email tizimda mavjud bo‘lsa, tiklash yo‘riqnomasi yuborildi.' };
  }

  // Public Catalogs
  if (pathname === '/api/categories') {
    return { productCategories: db.productCategories, serviceCategories: db.serviceCategories };
  }

  if (pathname === '/api/stats/public') {
    return {
      products: db.products.length,
      companies: db.companies.filter((c) => c.verified === 1).length,
      projects: db.projects.length,
      professionals: db.architects.length + 2,
    };
  }

  if (pathname === '/api/products' && method === 'GET') {
    let items = [...db.products];
    const q = (params.get('q') || '').toLowerCase();
    const cat = params.get('category') || '';
    const reg = params.get('region') || '';
    const sellerId = params.get('sellerId');
    const sort = params.get('sort') || 'newest';
    if (q) items = items.filter((p) => String(p.name_uz).toLowerCase().includes(q) || String(p.name_ru).toLowerCase().includes(q) || String(p.name_en).toLowerCase().includes(q));
    if (cat) items = items.filter((p) => p.category_slug === cat || String(p.category_id) === cat);
    if (reg) items = items.filter((p) => p.region === reg);
    if (sellerId) items = items.filter((p) => Number(p.seller_id) === Number(sellerId));
    if (sort === 'price_asc') items.sort((a, b) => Number(a.price_uzs) - Number(b.price_uzs));
    else if (sort === 'price_desc') items.sort((a, b) => Number(b.price_uzs) - Number(a.price_uzs));
    return { items, total: items.length };
  }

  if (pathname === '/api/products' && method === 'POST') {
    if (!user) throw new Error('Authentication required');
    const id = Math.max(0, ...db.products.map((p) => Number(p.id))) + 1;
    const cat = db.productCategories.find((c) => c.id === Number(body.categoryId || 1)) || db.productCategories[0];
    db.products.unshift({
      id,
      seller_id: user.id,
      category_id: cat.id,
      category_slug: cat.slug,
      category_uz: cat.name_uz,
      category_ru: cat.name_ru,
      category_en: cat.name_en,
      sku: `QH-${id}`,
      name_uz: body.nameUz,
      name_ru: body.nameUz,
      name_en: body.nameUz,
      description_uz: body.descriptionUz || body.nameUz,
      description_ru: body.descriptionUz || body.nameUz,
      description_en: body.descriptionUz || body.nameUz,
      price_uzs: Number(body.priceUzs),
      unit: body.unit || 'dona',
      region: body.region || user.region,
      delivery_options: body.deliveryOptions || 'Yetkazib berish',
      is_available: 1,
      moderation_status: 'APPROVED',
      rating: 4.8,
      review_count: 0,
      seller_name: user.full_name,
      seller_verified: 1,
      stock_quantity: Number(body.stockQuantity || 50),
      image_url: IMG_CEMENT,
    });
    saveDb(db);
    return { id };
  }

  if (pathname.startsWith('/api/products/') && method === 'DELETE') {
    const id = Number(pathname.split('/')[3]);
    db.products = db.products.filter((p) => Number(p.id) !== id);
    saveDb(db);
    return { success: true };
  }

  if (pathname.startsWith('/api/products/') && method === 'GET') {
    const id = Number(pathname.split('/')[3]);
    const product = db.products.find((p) => Number(p.id) === id);
    if (!product) throw new Error('Product not found');
    const reviews = db.reviews.filter((r) => r.target_type === 'PRODUCT' && Number(r.target_id) === id);
    return { product, images: [], reviews };
  }

  if (pathname === '/api/price-comparison') {
    const cat = params.get('category') || '';
    const items = db.products
      .filter((p) => !cat || p.category_slug === cat)
      .sort((a, b) => Number(a.price_uzs) - Number(b.price_uzs));
    return { items };
  }

  if (pathname === '/api/services' && method === 'GET') {
    const q = (params.get('q') || '').toLowerCase();
    const reg = params.get('region') || '';
    let items = [...db.services];
    if (q) items = items.filter((s) => String(s.title_uz).toLowerCase().includes(q));
    if (reg) items = items.filter((s) => s.region === reg);
    return { items };
  }

  if (pathname === '/api/services' && method === 'POST') {
    if (!user) throw new Error('Authentication required');
    const id = Math.max(0, ...db.services.map((s) => Number(s.id))) + 1;
    db.services.unshift({
      id,
      provider_id: user.id,
      category_id: 1,
      category_uz: 'Qurilish xizmatlari',
      category_ru: 'Строительные услуги',
      category_en: 'Construction Services',
      title_uz: body.titleUz,
      title_ru: body.titleUz,
      title_en: body.titleUz,
      description_uz: body.descriptionUz || body.titleUz,
      description_ru: body.descriptionUz || body.titleUz,
      description_en: body.descriptionUz || body.titleUz,
      price_from_uzs: Number(body.priceFromUzs || 150000),
      price_unit: body.priceUnit || 'm²',
      region: body.region || user.region,
      image_url: IMG_TEAM,
      rating: 4.8,
      review_count: 0,
      provider_name: user.full_name,
      provider_role: user.role,
      provider_verified: 1,
    });
    saveDb(db);
    return { id };
  }

  if (pathname.startsWith('/api/services/') && method === 'GET') {
    const id = Number(pathname.split('/')[3]);
    const service = db.services.find((s) => Number(s.id) === id);
    if (!service) throw new Error('Service not found');
    const portfolios = db.portfolios.filter((pf) => Number(pf.user_id) === Number(service.provider_id));
    return { service, portfolios, reviews: [] };
  }

  if (pathname === '/api/service-bookings') {
    if (!user) throw new Error('Authentication required');
    if (method === 'GET') {
      return { items: db.serviceBookings.filter((b) => Number(b.customer_id) === user.id || Number(b.provider_id) === user.id) };
    }
    const svc = db.services.find((s) => Number(s.id) === Number(body.serviceId));
    const id = db.serviceBookings.length + 1;
    db.serviceBookings.unshift({
      id,
      service_id: body.serviceId,
      service_title: svc?.title_uz || 'Xizmat',
      customer_id: user.id,
      customer_name: user.full_name,
      provider_id: svc?.provider_id || 4,
      provider_name: svc?.provider_name || 'Pudratchi',
      preferred_date: body.preferredDate,
      budget_uzs: Number(body.budgetUzs || 0),
      notes: body.notes,
      status: 'PENDING',
    });
    saveDb(db);
    return { id };
  }

  if (pathname.startsWith('/api/service-bookings/') && method === 'PATCH') {
    const id = Number(pathname.split('/')[3]);
    const b = db.serviceBookings.find((x) => Number(x.id) === id);
    if (b) b.status = body.status;
    saveDb(db);
    return { success: true };
  }

  // Companies & Architects
  if (pathname === '/api/companies' && method === 'GET') {
    const reg = params.get('region') || '';
    return { items: db.companies.filter((c) => !reg || c.region === reg) };
  }
  if (pathname === '/api/companies/employees' && method === 'POST') {
    if (!user) throw new Error('Authentication required');
    const comp = db.companies.find((c) => Number(c.owner_id) === user.id) || db.companies[0];
    const id = db.employees.length + 1;
    db.employees.push({ id, company_id: comp.id, full_name: body.fullName, position: body.position, specialty: body.specialty, salary_uzs: Number(body.salaryUzs || 12000000) });
    saveDb(db);
    return { id };
  }
  if (pathname.startsWith('/api/companies/') && method === 'GET') {
    const id = Number(pathname.split('/')[3]);
    const company = db.companies.find((c) => Number(c.id) === id);
    return {
      company,
      employees: db.employees.filter((e) => Number(e.company_id) === id),
      projects: db.projects.filter((p) => Number(p.company_id) === id),
      reviews: [],
    };
  }

  if (pathname === '/api/architects') return { items: db.architects };
  if (pathname.startsWith('/api/architects/')) {
    const id = Number(pathname.split('/')[3]);
    const architect = db.architects.find((a) => Number(a.id) === id || Number(a.user_id) === id);
    return { architect, portfolios: db.portfolios.filter((pf) => Number(pf.user_id) === Number(architect?.user_id)), services: [] };
  }

  // Projects
  if (pathname === '/api/projects' && method === 'GET') {
    const reg = params.get('region') || '';
    const mine = params.get('mine') === 'true';
    let items = db.projects.filter((p) => !reg || p.region === reg);
    if (mine && user && user.role !== 'ADMIN') {
      items = items.filter(
        (p) =>
          Number(p.owner_id) === user.id ||
          db.members.some((m) => Number(m.project_id) === Number(p.id) && Number(m.user_id) === user.id) ||
          db.companies.some((c) => Number(c.id) === Number(p.company_id) && Number(c.owner_id) === user.id)
      );
    }
    return { items };
  }
  if (pathname === '/api/projects' && method === 'POST') {
    if (!user) throw new Error('Authentication required');
    const id = Math.max(0, ...db.projects.map((p) => Number(p.id))) + 1;
    db.projects.unshift({
      id,
      owner_id: user.id,
      company_id: null,
      owner_name: user.full_name,
      company_name: null,
      name: body.name,
      description: body.description,
      address: body.address,
      region: body.region,
      construction_type: body.constructionType,
      building_area_sqm: Number(body.buildingAreaSqm),
      floors: Number(body.floors),
      estimated_budget_uzs: Number(body.estimatedBudgetUzs),
      spent_uzs: 0,
      status: 'IN_PROGRESS',
      progress_percent: 0,
      start_date: body.startDate,
      expected_end_date: body.expectedEndDate,
      image_url: IMG_VILLA,
    });
    db.members.push({ id: db.members.length + 1, project_id: id, user_id: user.id, full_name: user.full_name, member_role: 'OWNER' });
    saveDb(db);
    return { id };
  }

  const projMatch = pathname.match(/^\/api\/projects\/(\d+)(?:\/(tasks|expenses|progress|members|documents))?$/);
  if (projMatch) {
    const pid = Number(projMatch[1]);
    const sub = projMatch[2];
    if (!sub && method === 'GET') {
      const project = db.projects.find((p) => Number(p.id) === pid);
      if (!project) throw new Error('Project not found');
      return {
        project,
        members: db.members.filter((m) => Number(m.project_id) === pid),
        tasks: db.tasks.filter((t) => Number(t.project_id) === pid),
        progress: db.progress.filter((pr) => Number(pr.project_id) === pid),
        expenses: db.expenses.filter((ex) => Number(ex.project_id) === pid),
        contracts: db.contracts.filter((ct) => Number(ct.project_id) === pid),
        documents: db.documents.filter((d) => Number(d.project_id) === pid),
      };
    }
    if (sub === 'tasks' && method === 'POST') {
      const id = db.tasks.length + 1;
      db.tasks.unshift({ id, project_id: pid, assignee_id: user?.id, assignee_name: user?.full_name || 'Ijrochi', title: body.title, status: 'TODO', priority: body.priority || 'MEDIUM', deadline: '2026-12-15' });
      saveDb(db);
      return { id };
    }
    if (sub === 'expenses' && method === 'POST') {
      const id = db.expenses.length + 1;
      const amt = Number(body.amountUzs || 0);
      db.expenses.unshift({ id, project_id: pid, category: body.category, title: body.title, amount_uzs: amt, expense_date: body.expenseDate });
      const proj = db.projects.find((p) => Number(p.id) === pid);
      if (proj) proj.spent_uzs = Number(proj.spent_uzs || 0) + amt;
      saveDb(db);
      return { id };
    }
    if (sub === 'progress' && method === 'POST') {
      const id = db.progress.length + 1;
      const pct = Number(body.percentComplete || 0);
      db.progress.unshift({ id, project_id: pid, author_id: user?.id, title: body.title, notes: body.notes, percent_complete: pct, photo_url: IMG_TEAM, created_at: now });
      const proj = db.projects.find((p) => Number(p.id) === pid);
      if (proj) proj.progress_percent = pct;
      saveDb(db);
      return { success: true };
    }
    if (sub === 'members' && method === 'POST') {
      const target = db.users.find((u) => u.email === String(body.email || '').toLowerCase());
      if (!target) throw new Error('User not found');
      db.members.push({ id: db.members.length + 1, project_id: pid, user_id: target.id, full_name: target.full_name, member_role: body.memberRole || 'CONTRACTOR' });
      saveDb(db);
      return { success: true };
    }
    if (sub === 'documents' && method === 'POST') {
      const id = db.documents.length + 1;
      db.documents.unshift({ id, project_id: pid, title: body.title, doc_type: body.docType || 'BLUEPRINT', file_size_kb: 512, created_at: now });
      saveDb(db);
      return { id };
    }
  }

  if (pathname.startsWith('/api/tasks/') && method === 'PATCH') {
    const tid = Number(pathname.split('/')[3]);
    const t = db.tasks.find((x) => Number(x.id) === tid);
    if (t) t.status = body.status;
    saveDb(db);
    return { success: true };
  }

  if (pathname === '/api/contracts') return { items: db.contracts };

  // Estimates
  if (pathname === '/api/estimates/calculate' && method === 'POST') return calcEstimate(db, body);
  if (pathname === '/api/estimates/configs') return { items: db.estimateConfigs };
  if (pathname.startsWith('/api/estimates/configs/') && method === 'PATCH') {
    const key = pathname.split('/')[4];
    const cfg = db.estimateConfigs.find((c) => c.key === key);
    if (cfg) {
      cfg.unit_price_uzs = Number(body.unitPriceUzs);
      cfg.coefficient = Number(body.coefficient);
    }
    saveDb(db);
    return { success: true };
  }
  if (pathname === '/api/estimates' && method === 'GET') return { items: db.estimates };
  if (pathname === '/api/estimates' && method === 'POST') {
    const calc = calcEstimate(db, body);
    const id = db.estimates.length + 1;
    db.estimates.unshift({
      id,
      user_id: user?.id || 1,
      title: body.title,
      building_area_sqm: body.buildingAreaSqm,
      floors: body.floors,
      region: body.region,
      total_estimated_uzs: calc.totalEstimatedUzs,
    });
    saveDb(db);
    return { id, ...calc };
  }

  // Orders & Payments
  if (pathname === '/api/orders' && method === 'GET') {
    if (!user) return { items: [] };
    if (user.role === 'ADMIN') return { items: db.orders };
    const scope = params.get('scope') || 'customer';
    const items = db.orders.filter((o) =>
      scope === 'seller' ? Number(o.seller_id) === user.id : Number(o.customer_id) === user.id
    );
    return { items };
  }
  if (pathname === '/api/orders' && method === 'POST') {
    if (!user) throw new Error('Authentication required');
    const items = (body.items as Array<{ productId: number; quantity: number }>) || [];
    const bySeller = new Map<number, { sellerName: string; total: number }>();
    items.forEach((it) => {
      const p = db.products.find((pr) => Number(pr.id) === Number(it.productId));
      if (!p) return;
      const sid = Number(p.seller_id || 2);
      const entry = bySeller.get(sid) || { sellerName: String(p.seller_name || 'Bunyod Stroy Market'), total: 0 };
      entry.total += Number(p.price_uzs) * Number(it.quantity || 1);
      bySeller.set(sid, entry);
    });
    const createdOrders: Array<{ id: number; orderNumber: string; totalUzs: number }> = [];
    for (const [sellerId, info] of bySeller.entries()) {
      const id = db.orders.length + 1;
      const orderNumber = `QH-ORD-${Date.now().toString().slice(-5)}-${id}`;
      db.orders.unshift({
        id,
        order_number: orderNumber,
        customer_id: user.id,
        seller_id: sellerId,
        customer_name: user.full_name,
        seller_name: info.sellerName,
        status: 'PENDING',
        total_uzs: info.total,
        created_at: now,
      });
      createdOrders.push({ id, orderNumber, totalUzs: info.total });
    }
    saveDb(db);
    return { orders: createdOrders };
  }
  if (pathname.startsWith('/api/orders/') && pathname.endsWith('/status') && method === 'PATCH') {
    const id = Number(pathname.split('/')[3]);
    const ord = db.orders.find((o) => Number(o.id) === id);
    if (ord) ord.status = body.status;
    saveDb(db);
    return { success: true };
  }
  if (pathname === '/api/payments') return { items: db.payments, sandboxMode: true };
  if (pathname === '/api/payments/initiate' && method === 'POST') {
    const id = db.payments.length + 1;
    const amount = body.subscriptionPlan ? (body.subscriptionPlan === 'ENTERPRISE_COMPANY' ? 1490000 : 490000) : Number(db.orders.find((o) => Number(o.id) === Number(body.orderId))?.total_uzs || 0);
    const ref = `PAY-SBX-${Date.now().toString().slice(-5)}`;
    db.payments.unshift({ id, payment_ref: ref, user_id: user?.id || 1, order_id: body.orderId || null, provider: body.provider || 'PAYME', amount_uzs: amount, status: 'INITIATED', created_at: now });
    saveDb(db);
    return { id, paymentRef: ref, status: 'INITIATED' };
  }
  if (pathname.includes('/confirm-sandbox') && method === 'POST') {
    const id = Number(pathname.split('/')[3]);
    const pay = db.payments.find((p) => Number(p.id) === id);
    if (pay) {
      pay.status = 'COMPLETED';
      if (pay.order_id) {
        const ord = db.orders.find((o) => Number(o.id) === Number(pay.order_id));
        if (ord) ord.status = 'CONFIRMED';
      }
    }
    saveDb(db);
    return { success: true, status: 'COMPLETED' };
  }

  // Favorites & Reviews
  if (pathname === '/api/favorites') {
    const favs = db.favorites.filter((f) => f.user_id === (user?.id || 1));
    const products = db.products.filter((p) => favs.some((f) => f.target_type === 'PRODUCT' && f.target_id === Number(p.id)));
    return { favorites: favs, products };
  }
  if (pathname === '/api/favorites/toggle' && method === 'POST') {
    const uid = user?.id || 1;
    const idx = db.favorites.findIndex((f) => f.user_id === uid && f.target_type === body.targetType && f.target_id === Number(body.targetId));
    if (idx >= 0) {
      db.favorites.splice(idx, 1);
      saveDb(db);
      return { favorited: false };
    }
    db.favorites.push({ id: db.favorites.length + 1, user_id: uid, target_type: String(body.targetType), target_id: Number(body.targetId) });
    saveDb(db);
    return { favorited: true };
  }
  if (pathname === '/api/reviews' && method === 'POST') {
    db.reviews.unshift({ id: db.reviews.length + 1, author_name: user?.full_name || 'Mijoz', target_type: body.targetType, target_id: Number(body.targetId), rating: Number(body.rating), comment: body.comment, created_at: now });
    saveDb(db);
    return { id: db.reviews.length };
  }

  // Chat & Notifications
  if (pathname === '/api/conversations' && method === 'GET') {
    const uid = user?.id || 1;
    const items = db.conversations
      .filter((c) => Number(c.participant_one) === uid || Number(c.participant_two) === uid)
      .map((c) => {
        const peerId = Number(c.participant_one) === uid ? Number(c.participant_two) : Number(c.participant_one);
        const peer = db.users.find((u) => u.id === peerId);
        const convMsgs = db.messages.filter((m) => Number(m.conversation_id) === Number(c.id));
        const last = convMsgs[convMsgs.length - 1];
        return {
          ...c,
          peer_id: peerId,
          peer_name: peer?.full_name || 'Foydalanuvchi',
          peer_role: peer?.role || 'USER',
          last_message: last?.body || c.subject,
          unread_count: convMsgs.filter((m) => Number(m.sender_id) !== uid && Number(m.is_read) === 0).length,
          peer_online: true,
        };
      });
    return { items };
  }
  if (pathname === '/api/conversations' && method === 'POST') {
    const uid = user?.id || 1;
    const peerId = Number(body.peerId);
    const p1 = Math.min(uid, peerId);
    const p2 = Math.max(uid, peerId);
    const existing = db.conversations.find((c) => Number(c.participant_one) === p1 && Number(c.participant_two) === p2);
    if (existing) return { id: existing.id };
    const id = db.conversations.length + 1;
    db.conversations.unshift({ id, participant_one: p1, participant_two: p2, subject: body.subject || 'Muloqot', last_message_at: now });
    saveDb(db);
    return { id };
  }
  if (pathname.match(/^\/api\/conversations\/\d+\/messages$/) && method === 'GET') {
    const cid = Number(pathname.split('/')[3]);
    return { items: db.messages.filter((m) => Number(m.conversation_id) === cid) };
  }
  if (pathname.match(/^\/api\/conversations\/\d+\/messages$/) && method === 'POST') {
    const cid = Number(pathname.split('/')[3]);
    const msg = { id: db.messages.length + 1, conversation_id: cid, sender_id: user?.id || 1, sender_name: user?.full_name || 'Siz', body: body.body, attachment_url: body.attachmentUrl || null, is_read: 1, created_at: now };
    db.messages.push(msg);
    saveDb(db);
    return msg;
  }

  if (pathname === '/api/notifications') return { items: db.notifications };
  if (pathname === '/api/notifications/read-all') {
    db.notifications.forEach((n) => (n.is_read = 1));
    saveDb(db);
    return { success: true };
  }

  // Blog & Contact
  if (pathname === '/api/blog') return { items: db.blogs };
  if (pathname.startsWith('/api/blog/')) {
    const key = pathname.split('/')[3];
    return { post: db.blogs.find((b) => String(b.id) === key || b.slug === key) };
  }
  if (pathname === '/api/contact' && method === 'POST') return { id: 1 };

  // Admin
  if (pathname === '/api/admin/overview') {
    return {
      metrics: {
        usersTotal: db.users.length,
        productsTotal: db.products.length,
        servicesTotal: db.services.length,
        projectsTotal: db.projects.length,
        ordersTotal: db.orders.length,
        revenueUzs: db.orders.reduce((s, o) => s + Number(o.total_uzs || 0), 0),
        openComplaints: db.complaints.filter((c) => c.status === 'OPEN').length,
        pendingVerifications: db.companies.filter((c) => c.verified === 0).length,
      },
    };
  }
  if (pathname === '/api/admin/users' && method === 'GET') return { items: db.users };
  if (pathname.startsWith('/api/admin/users/') && method === 'PATCH') {
    const uid = Number(pathname.split('/')[4]);
    const target = db.users.find((u) => u.id === uid);
    if (target && body.isActive !== undefined) target.is_active = Number(body.isActive);
    saveDb(db);
    return { success: true };
  }
  if (pathname === '/api/admin/companies') return { items: db.companies };
  if (pathname.match(/^\/api\/admin\/companies\/(\d+)(?:\/verify)?$/) && method === 'PATCH') {
    const cid = Number(pathname.split('/')[4]);
    const c = db.companies.find((x) => Number(x.id) === cid);
    if (c) c.verified = body.verified ? 1 : 0;
    saveDb(db);
    return { success: true };
  }
  if (pathname === '/api/admin/moderation/products') return { items: db.products };
  if (pathname.startsWith('/api/admin/moderation/products/') && method === 'PATCH') {
    const pid = Number(pathname.split('/')[5]);
    const p = db.products.find((x) => Number(x.id) === pid);
    if (p) p.moderation_status = body.status;
    saveDb(db);
    return { success: true };
  }
  if (pathname === '/api/admin/complaints' && method === 'GET') return { items: db.complaints };
  if (pathname.startsWith('/api/admin/complaints/') && method === 'PATCH') {
    const cid = Number(pathname.split('/')[4]);
    const comp = db.complaints.find((x) => Number(x.id) === cid);
    if (comp) comp.status = body.status || 'RESOLVED';
    saveDb(db);
    return { success: true };
  }
  if (pathname === '/api/complaints' && method === 'POST') {
    if (!user) throw new Error('Authentication required');
    const id = db.complaints.length + 1;
    db.complaints.unshift({
      id,
      reason: body.reason || 'Shikoyat',
      details: body.details || '',
      status: 'OPEN',
      reporter_name: user.full_name,
    });
    saveDb(db);
    return { id };
  }
  if (pathname === '/api/admin/audit-logs') return { items: db.auditLogs };

  return {};
}
