import { db } from './db.ts';
import { hashPassword } from './auth.ts';
import { ROLE_PERMISSIONS, type Role } from './types.ts';

const IMG_HERO = '/src/assets/images/hero_tashkent_construction_1794912446373.jpg';
const IMG_CEMENT = '/src/assets/images/material_cement_bricks_1794912446302.jpg';
const IMG_ROOF = '/src/assets/images/material_roofing_timber_1794912447587.jpg';
const IMG_TEAM = '/src/assets/images/service_construction_team_1794912447881.jpg';
const IMG_VILLA = '/src/assets/images/project_modern_villa_1794912448415.jpg';
const IMG_ARCHITECT = '/src/assets/images/architect_studio_portrait_1794912448885.jpg';

export function seedDatabaseIfEmpty(): void {
  const userCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c;
  if (userCount > 0) {
    return;
  }

  // 1. Seed Roles & Permissions
  const insertRole = db.prepare('INSERT INTO roles (name, description) VALUES (?, ?)');
  const insertPerm = db.prepare('INSERT OR IGNORE INTO permissions (code, description) VALUES (?, ?)');
  const insertRolePerm = db.prepare('INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)');

  const roleDescriptions: Record<Role, string> = {
    CUSTOMER: 'Buyurtmachi — loyiha yaratish, buyurtma berish va pudratchi yollash',
    SELLER: 'Yetkazib beruvchi — qurilish materiallari sotuvchisi va ombor boshqaruvi',
    CONTRACTOR: 'Pudratchi / Usta — qurilish xizmatlari va vazifalar bajaruvchisi',
    ARCHITECT: 'Arxitektor / Dizayner — loyihalar va arxitektura yechimlari',
    COMPANY: 'Qurilish kompaniyasi — xodimlar, smetalar va yirik obyektlar boshqaruvi',
    ADMIN: 'Platforma administratori — moderatsiya, verifikatsiya va audit',
  };

  (Object.keys(ROLE_PERMISSIONS) as Role[]).forEach((roleName) => {
    const res = insertRole.run(roleName, roleDescriptions[roleName]);
    const roleId = Number(res.lastInsertRowid);
    for (const permCode of ROLE_PERMISSIONS[roleName]) {
      insertPerm.run(permCode, `Permission ${permCode}`);
      const permRow = db.prepare('SELECT id FROM permissions WHERE code = ?').get(permCode) as { id: number };
      insertRolePerm.run(roleId, permRow.id);
    }
  });

  // 2. Seed Users across all 6 roles (password: Password123!)
  const defaultHash = hashPassword('Password123!');
  const insertUser = db.prepare(`
    INSERT INTO users (email, password_hash, full_name, phone, role, region, avatar_url, bio, preferred_lang, verified)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const customerId = Number(
    insertUser.run(
      'customer@qurilishhub.uz',
      defaultHash,
      'Azizbek Karimov',
      '+998 90 123 45 67',
      'CUSTOMER',
      'Toshkent shahri',
      null,
      'Chilonzor va Yunusobodda xususiy uy-joy qurilishi buyurtmachisi.',
      'uz',
      1
    ).lastInsertRowid
  );

  const seller1Id = Number(
    insertUser.run(
      'seller@qurilishhub.uz',
      defaultHash,
      'Bunyod Stroy Market',
      '+998 93 455 11 22',
      'SELLER',
      'Toshkent shahri',
      null,
      'Qizilqumsement, Bekobod armatura va pishiq g‘isht rasmiy dileri.',
      'uz',
      1
    ).lastInsertRowid
  );

  const seller2Id = Number(
    insertUser.run(
      'samarkand.stroy@qurilishhub.uz',
      defaultHash,
      'Registon Stroy Savdo',
      '+998 91 555 88 99',
      'SELLER',
      'Samarqand',
      null,
      'Samarqand va Navoiy viloyatlariga ulgurji qurilish materiallari yetkazib beruvchi.',
      'uz',
      1
    ).lastInsertRowid
  );

  const contractor1Id = Number(
    insertUser.run(
      'contractor@qurilishhub.uz',
      defaultHash,
      'Dilshod Tursunov',
      '+998 97 710 20 30',
      'CONTRACTOR',
      'Toshkent shahri',
      IMG_TEAM,
      '12 yillik tajribaga ega monolit, poydevor va tom yopish brigadasi rahbari.',
      'uz',
      1
    ).lastInsertRowid
  );

  const contractor2Id = Number(
    insertUser.run(
      'fergana.usta@qurilishhub.uz',
      defaultHash,
      'Sherzod Mirzayev',
      '+998 90 302 44 55',
      'CONTRACTOR',
      "Farg'ona",
      IMG_TEAM,
      "Farg'ona vodiysi bo'ylab fasad va ichki pardozlash ustalari jamoasi.",
      'uz',
      1
    ).lastInsertRowid
  );

  const architect1Id = Number(
    insertUser.run(
      'architect@qurilishhub.uz',
      defaultHash,
      'Sardorbek Alimov',
      '+998 94 612 77 88',
      'ARCHITECT',
      'Toshkent shahri',
      IMG_ARCHITECT,
      'Zamonaviy O‘zbekiston iqlimiga mos energotejamkor villa va tijorat binolari arxitektori.',
      'uz',
      1
    ).lastInsertRowid
  );

  const architect2Id = Number(
    insertUser.run(
      'madina.design@qurilishhub.uz',
      defaultHash,
      'Madina Rakhimova',
      '+998 99 811 23 45',
      'ARCHITECT',
      'Samarqand',
      IMG_ARCHITECT,
      'Neo-klassik va sharqona minimalizm yo‘nalishida interyer va eksteryer loyihalovchi.',
      'uz',
      1
    ).lastInsertRowid
  );

  const companyUserId = Number(
    insertUser.run(
      'company@qurilishhub.uz',
      defaultHash,
      'Toshkent City Build Group',
      '+998 71 200 45 00',
      'COMPANY',
      'Toshkent shahri',
      IMG_HERO,
      'Ko‘p qavatli turar-joy va biznes markazlari quruvchi litsenziyalangan kompaniya.',
      'uz',
      1
    ).lastInsertRowid
  );

  const company2UserId = Number(
    insertUser.run(
      'bukhara.archbuild@qurilishhub.uz',
      defaultHash,
      'Buxoro TemirBeton Stroy',
      '+998 65 224 19 00',
      'COMPANY',
      'Buxoro',
      IMG_HERO,
      'Sanoat va turar-joy obyektlari uchun kalit topshirish asosida qurilish.',
      'uz',
      1
    ).lastInsertRowid
  );

  const adminId = Number(
    insertUser.run(
      'admin@qurilishhub.uz',
      defaultHash,
      'Jasur Rustamov (Admin)',
      '+998 71 200 00 01',
      'ADMIN',
      'Toshkent shahri',
      null,
      'QurilishHub platformasi bosh administratori.',
      'uz',
      1
    ).lastInsertRowid
  );

  // User Profiles
  const insertUserProfile = db.prepare(`
    INSERT INTO user_profiles (user_id, company_name, tax_id, address, website, experience_years)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertUserProfile.run(seller1Id, 'Bunyod Stroy Market MChJ', '305412890', "Toshkent sh., Sergeli tumani, O'zgarish 14", 'https://bunyodstroy.uz', 9);
  insertUserProfile.run(seller2Id, 'Registon Stroy Savdo XK', '307891234', 'Samarqand sh., Spitamen shoh ko‘chasi 88', 'https://registonstroy.uz', 7);
  insertUserProfile.run(companyUserId, 'Toshkent City Build Group AJ', '301122334', 'Toshkent sh., Shayxontohur tumani, Navoiy 42', 'https://tcbg.uz', 14);

  // 3. Companies & Employees
  const insertCompany = db.prepare(`
    INSERT INTO companies (owner_id, name, slug, description_uz, description_ru, description_en, region, address, phone, email, license_number, founded_year, completed_projects, rating, logo_url, cover_url, verified)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const comp1Id = Number(
    insertCompany.run(
      companyUserId,
      'Toshkent City Build Group',
      'toshkent-city-build-group',
      "Toshkent shahri va viloyatida zamonaviy turar-joy majmualari, biznes markazlari va kottejlarni kalit topshirish asosida quruvchi yetakchi kompaniya.",
      'Ведущая строительная компания в Ташкенте, реализующая жилые комплексы, бизнес-центры и коттеджи под ключ.',
      'Leading Tashkent construction group delivering turnkey residential complexes, commercial hubs, and villas.',
      'Toshkent shahri',
      'Shayxontohur tumani, Navoiy ko‘chasi 42',
      '+998 71 200 45 00',
      'info@tcbg.uz',
      'UZ-LIC-2019-00412',
      2012,
      38,
      4.9,
      IMG_HERO,
      IMG_HERO,
      1
    ).lastInsertRowid
  );

  const comp2Id = Number(
    insertCompany.run(
      company2UserId,
      'Buxoro TemirBeton Stroy',
      'bukhara-temirbeton-stroy',
      "Buxoro va Navoiy viloyatlarida mustahkam temir-beton konstruksiyalar, omborxonalar va mehmonxonalar qurilishi.",
      'Строительство железобетонных конструкций, складов и гостиниц в Бухарской и Навоийской областях.',
      'Reinforced concrete structures, warehouses, and hospitality builds across Bukhara and Navoi.',
      'Buxoro',
      'Buxoro sh., I. Karimov ko‘chasi 19',
      '+998 65 224 19 00',
      'contact@bts-bukhara.uz',
      'UZ-LIC-2017-00891',
      2015,
      24,
      4.8,
      IMG_TEAM,
      IMG_VILLA,
      1
    ).lastInsertRowid
  );

  const insertEmployee = db.prepare(`
    INSERT INTO company_employees (company_id, full_name, position, phone, email, specialty, salary_uzs)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertEmployee.run(comp1Id, 'Rustam Xolmatov', 'Bosh muhandis', '+998 90 444 12 01', 'r.xolmatov@tcbg.uz', 'Monolit konstruksiya', 18000000);
  insertEmployee.run(comp1Id, 'Nodira Saidova', 'Smeta muhandisi', '+998 90 444 12 02', 'n.saidova@tcbg.uz', 'Xarajat va smeta nazorati', 14500000);
  insertEmployee.run(comp1Id, 'Otabek Qodirov', 'Prorab (Obyekt boshlig‘i)', '+998 90 444 12 03', 'o.qodirov@tcbg.uz', 'Qurilish maydoni boshqaruvi', 15000000);
  insertEmployee.run(comp2Id, 'Farruh Jumayev', 'Texnik direktor', '+998 91 510 33 11', 'f.jumayev@bts-bukhara.uz', 'Temir-beton karkas', 16500000);

  // 4. Contractor & Architect Profiles + Portfolios
  db.prepare(`
    INSERT INTO contractor_profiles (user_id, headline, specialty, experience_years, team_size, region, hourly_rate_uzs, verified, rating, completed_jobs, bio)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    contractor1Id,
    'Monolit, poydevor va karkas qurilish brigadasi',
    'Monolit va poydevor',
    12,
    14,
    'Toshkent shahri',
    180000,
    1,
    4.9,
    46,
    '12 yillik tajriba, o‘z qolip va kran texnikamiz bilan Toshkent bo‘ylab sifatli poydevor va monolit ishlari.'
  );

  db.prepare(`
    INSERT INTO contractor_profiles (user_id, headline, specialty, experience_years, team_size, region, hourly_rate_uzs, verified, rating, completed_jobs, bio)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    contractor2Id,
    'Travertin fasad va premium ichki pardozlash',
    'Fasad va pardozlash',
    8,
    9,
    "Farg'ona",
    145000,
    1,
    4.8,
    31,
    'Travertin, gipsokarton, elektr va santexnika ishlarini kafolatli shartnoma asosida bajaramiz.'
  );

  db.prepare(`
    INSERT INTO architect_profiles (user_id, studio_name, specialty, experience_years, region, license_code, price_per_sqm_uzs, verified, rating, completed_designs, bio)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    architect1Id,
    'Alimov Studio Architecture',
    'Zamonaviy villa va jamoat binolari',
    11,
    'Toshkent shahri',
    'ARC-UZ-4410',
    190000,
    1,
    4.9,
    54,
    'Energiya tejamkor fasadlar, 3D BIM modellashtirish va to‘liq ishchi chizmalar paketi.'
  );

  db.prepare(`
    INSERT INTO architect_profiles (user_id, studio_name, specialty, experience_years, region, license_code, price_per_sqm_uzs, verified, rating, completed_designs, bio)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    architect2Id,
    'Registon Spatial Lab',
    'Milliy-modern kottej va interyer',
    7,
    'Samarqand',
    'ARC-UZ-5982',
    155000,
    1,
    4.8,
    29,
    'Samarqand tosh va yog‘och an’analarini zamonaviy shisha va beton bilan uyg‘unlashtirgan loyihalar.'
  );

  const insertPortfolio = db.prepare(`
    INSERT INTO portfolios (user_id, title, category, region, area_sqm, completion_year, image_url, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertPortfolio.run(architect1Id, 'Qibray Travertin Villasi', 'Turar-joy villasi', 'Toshkent viloyati', 420, 2025, IMG_VILLA, '2 qavatli hovuzli va ichki hovlili zamonaviy travertin qarorgoh.');
  insertPortfolio.run(architect1Id, 'Mirzo Ulug‘bek Biznes Paviloni', 'Tijorat binosi', 'Toshkent shahri', 1150, 2024, IMG_HERO, 'Panoramali shisha fasadli ofis va shou-rum majmuasi.');
  insertPortfolio.run(architect2Id, 'Samarqand Hovli Kotteji', 'Kottej', 'Samarqand', 290, 2025, IMG_VILLA, 'Issiq iqlimga mos soyabon ayvonli zamonaviy oilaviy uy.');
  insertPortfolio.run(contractor1Id, 'Yunusobod Monolit Karkas', 'Monolit', 'Toshkent shahri', 680, 2025, IMG_TEAM, '3 qavatli bino uchun M350 beton va A500C armaturali to‘liq karkas.');

  // 5. Product Categories & Products
  const insertProdCat = db.prepare(`
    INSERT INTO product_categories (slug, name_uz, name_ru, name_en, icon)
    VALUES (?, ?, ?, ?, ?)
  `);
  const catCement = Number(insertProdCat.run('cement-mixes', 'Sement va qorishmalar', 'Цемент и смеси', 'Cement & Mixes', 'Layers').lastInsertRowid);
  const catBricks = Number(insertProdCat.run('bricks-blocks', "G'isht va bloklar", 'Кирпич и блоки', 'Bricks & Blocks', 'Grid').lastInsertRowid);
  const catSteel = Number(insertProdCat.run('steel-rebar', 'Armatura va metall', 'Арматура и металл', 'Steel & Rebar', 'Wrench').lastInsertRowid);
  const catRoofing = Number(insertProdCat.run('roofing-timber', 'Tom va yog‘och', 'Кровля и дерево', 'Roofing & Timber', 'Home').lastInsertRowid);
  const catInsulation = Number(insertProdCat.run('insulation-facade', 'Issiqlik va fasad', 'Утепление и фасад', 'Insulation & Facade', 'Shield').lastInsertRowid);
  const catAggregate = Number(insertProdCat.run('sand-gravel', 'Qum va shag‘al', 'Песок и щебень', 'Sand & Gravel', 'Mountain').lastInsertRowid);

  const insertProduct = db.prepare(`
    INSERT INTO products (seller_id, category_id, sku, name_uz, name_ru, name_en, description_uz, description_ru, description_en, price_uzs, unit, region, delivery_options, is_available, moderation_status, rating, review_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'APPROVED', ?, ?)
  `);
  const insertProdImg = db.prepare(`
    INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES (?, ?, 1, 0)
  `);
  const insertInventory = db.prepare(`
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (?, ?, 0, ?)
  `);

  const seedProducts = [
    {
      sellerId: seller1Id,
      catId: catCement,
      sku: 'QZS-M500-50',
      nameUz: 'Qizilqumsement M500 D0 (50 kg)',
      nameRu: 'Кызылкумцемент М500 Д0 (50 кг)',
      nameEn: 'Qizilqumsement M500 D0 (50 kg)',
      descUz: 'Yuqori mustahkamlikdagi asl M500 portlandsement. Monolit poydevor va yuk ko‘taruvchi konstruksiyalar uchun.',
      descRu: 'Высокопрочный портландцемент М500 для монолитного фундамента и несущих конструкций.',
      descEn: 'High-strength M500 Portland cement ideal for structural foundations and monolithic concrete.',
      price: 47500,
      unit: 'qop (50kg)',
      region: 'Toshkent shahri',
      delivery: 'Toshkent bo‘ylab 24 soatda yetkazib berish / Olib ketish',
      img: IMG_CEMENT,
      qty: 1200,
      rating: 4.9,
      reviews: 34,
    },
    {
      sellerId: seller2Id,
      catId: catCement,
      sku: 'OHG-M400-50',
      nameUz: 'Ohangaron Sement M400 D20 (50 kg)',
      nameRu: 'Ахангаран Цемент М400 Д20 (50 кг)',
      nameEn: 'Ohangaron Cement M400 D20 (50 kg)',
      descUz: 'G‘isht terish, suvoq va umumiy qurilish ishlari uchun sinovdan o‘tgan M400 sementi.',
      descRu: 'Проверенный цемент М400 для кладки, штукатурки и общестроительных работ.',
      descEn: 'Reliable M400 cement for masonry, plastering, and general structural work.',
      price: 44000,
      unit: 'qop (50kg)',
      region: 'Samarqand',
      delivery: 'Samarqand va Jizzax bo‘ylab yetkazish',
      img: IMG_CEMENT,
      qty: 850,
      rating: 4.8,
      reviews: 19,
    },
    {
      sellerId: seller1Id,
      catId: catBricks,
      sku: 'BRK-M150-RED',
      nameUz: "Pishiq qizil g'isht M150 (250x120x65 mm)",
      nameRu: 'Кирпич красный жженый М150 (250x120x65 мм)',
      nameEn: 'Fired Red Clay Brick M150 (250x120x65 mm)',
      descUz: 'O‘choqda pishirilgan yuqori zichlikdagi M150 g‘isht. Issiqlik va namlikka chidamli.',
      descRu: 'Обожженный кирпич высокой плотности М150, устойчивый к влаге и перепадам температур.',
      descEn: 'Kiln-fired high-density M150 clay brick with high thermal and moisture resistance.',
      price: 1450,
      unit: 'dona',
      region: 'Toshkent shahri',
      delivery: 'Manipulyator bilan tushirib berish',
      img: IMG_CEMENT,
      qty: 45000,
      rating: 4.9,
      reviews: 52,
    },
    {
      sellerId: seller2Id,
      catId: catBricks,
      sku: 'BRK-M150-SMK',
      nameUz: "Samarqand pishiq g'ishti M150",
      nameRu: 'Самаркандский жженый кирпич М150',
      nameEn: 'Samarkand Fired Brick M150',
      descUz: 'Sifatli zavod g‘ishti, bir xil o‘lcham va yuqori bosim bardoshliligi.',
      descRu: 'Качественный заводской кирпич точной геометрии и высокой прочности.',
      descEn: 'Precision factory-fired brick with uniform geometry and high compressive strength.',
      price: 1380,
      unit: 'dona',
      region: 'Samarqand',
      delivery: 'KamAZ / Fura yetkazib berish',
      img: IMG_CEMENT,
      qty: 60000,
      rating: 4.7,
      reviews: 27,
    },
    {
      sellerId: seller1Id,
      catId: catSteel,
      sku: 'ARM-A500-12',
      nameUz: 'Bekobod Armatura A500C d12 mm',
      nameRu: 'Бекабадская арматура А500С д12 мм',
      nameEn: 'Bekabad Rebar A500C d12 mm',
      descUz: 'O‘zmetkombinat mahsuloti — A500C GOST sertifikatli po‘lat armatura (11.7 m tayoqlar).',
      descRu: 'Сертифицированная стальная арматура А500С производства Узметкомбинат (11.7 м).',
      descEn: 'Certified Uzmetkombinat A500C ribbed steel rebar in 11.7m structural bars.',
      price: 9650000,
      unit: 'tonna',
      region: 'Toshkent shahri',
      delivery: 'Maxsus uzun o‘lchamli transportda yetkazish',
      img: IMG_CEMENT,
      qty: 48,
      rating: 5.0,
      reviews: 41,
    },
    {
      sellerId: seller2Id,
      catId: catSteel,
      sku: 'ARM-A500-14',
      nameUz: 'Armatura A500C d14 mm (ulgurji)',
      nameRu: 'Арматура А500С д14 мм (оптом)',
      nameEn: 'Rebar A500C d14 mm (Wholesale)',
      descUz: 'Ko‘p qavatli binolar karkasi va poydevorlari uchun d14 mm armatura.',
      descRu: 'Арматура д14 мм для каркасов многоэтажных зданий и фундаментов.',
      descEn: 'Structural 14mm deformed rebar for multi-story concrete frames and footings.',
      price: 9480000,
      unit: 'tonna',
      region: 'Samarqand',
      delivery: 'Hududiy ombordan olib ketish / Yetkazib berish',
      img: IMG_CEMENT,
      qty: 35,
      rating: 4.8,
      reviews: 16,
    },
    {
      sellerId: seller1Id,
      catId: catRoofing,
      sku: 'ROOF-ANT-05',
      nameUz: 'Matoviy Profnastil Antratsit 0.5 mm',
      nameRu: 'Профнастил матовый антрацит 0.5 мм',
      nameEn: 'Matte Anthracite Metal Roofing 0.5 mm',
      descUz: 'Polimer qoplamali zanglamaydigan tom listi, quyosh va yomg‘irga chidamli (RAL 7024).',
      descRu: 'Кровельный лист с матовым полимерным покрытием RAL 7024, устойчивый к коррозии.',
      descEn: 'Polymer-coated RAL 7024 architectural roofing sheet with anti-corrosion guarantee.',
      price: 118000,
      unit: 'm²',
      region: 'Toshkent shahri',
      delivery: 'Buyurtma o‘lchamida kesib berish va yetkazish',
      img: IMG_ROOF,
      qty: 3200,
      rating: 4.9,
      reviews: 28,
    },
    {
      sellerId: seller1Id,
      catId: catRoofing,
      sku: 'TIM-PINE-150',
      nameUz: 'Quritilgan Qarag‘ay Brus 150x150 mm (6m)',
      nameRu: 'Сухой сосновый брус 150x150 мм (6м)',
      nameEn: 'Kiln-Dried Pine Timber Beam 150x150 mm (6m)',
      descUz: 'Tom stropilasi va karkas konstruksiyalari uchun 1-navli quritilgan Rossiya qarag‘ay brusi.',
      descRu: 'Сухой сосновый брус 1 сорта для стропильных систем и перекрытий.',
      descEn: 'Grade-1 kiln-dried structural pine timber ideal for roof trusses and framing.',
      price: 420000,
      unit: 'dona (6m)',
      region: 'Toshkent viloyati',
      delivery: 'Toshkent va viloyatga yetkazish',
      img: IMG_ROOF,
      qty: 410,
      rating: 4.8,
      reviews: 22,
    },
    {
      sellerId: seller1Id,
      catId: catInsulation,
      sku: 'INS-BAS-100',
      nameUz: 'Bazalt Mineral Vata 100 mm (A1 yonmas)',
      nameRu: 'Базальтовая минвата 100 мм (НГ)',
      nameEn: 'Basalt Mineral Wool Insulation 100 mm',
      descUz: 'Fasad va cherdak izolyatsiyasi uchun ekologik toza, yong‘inga chidamli bazalt plita.',
      descRu: 'Экологичная негорючая базальтовая плита для утепления фасадов и кровли.',
      descEn: 'Fire-rated A1 acoustic & thermal basalt wool panels for facades and roofs.',
      price: 78000,
      unit: 'm²',
      region: 'Toshkent shahri',
      delivery: 'Ombor va manzilga yetkazib berish',
      img: IMG_ROOF,
      qty: 1900,
      rating: 4.8,
      reviews: 15,
    },
    {
      sellerId: seller2Id,
      catId: catAggregate,
      sku: 'AGG-SAND-CH',
      nameUz: 'Yuvilgan Chirchiq Qurilish Qumi',
      nameRu: 'Мытый строительный песок Чирчик',
      nameEn: 'Washed Construction River Sand',
      descUz: 'Beton va suvoq qorishmalari uchun toza yuvilgan daryo qumi.',
      descRu: 'Чистый мытый речной песок для бетона и штукатурных работ.',
      descEn: 'Clean washed river sand graded for structural concrete and plaster.',
      price: 122000,
      unit: 'm³',
      region: 'Toshkent viloyati',
      delivery: 'HOWO samosvalda (15-20 m³) yetkazish',
      img: IMG_CEMENT,
      qty: 900,
      rating: 4.7,
      reviews: 11,
    },
  ];

  seedProducts.forEach((p) => {
    const pid = Number(
      insertProduct.run(
        p.sellerId,
        p.catId,
        p.sku,
        p.nameUz,
        p.nameRu,
        p.nameEn,
        p.descUz,
        p.descRu,
        p.descEn,
        p.price,
        p.unit,
        p.region,
        p.delivery,
        p.rating,
        p.reviews
      ).lastInsertRowid
    );
    insertProdImg.run(pid, p.img);
    insertInventory.run(pid, p.qty, 25);
  });

  // 6. Service Categories & Services
  const insertSvcCat = db.prepare('INSERT INTO service_categories (slug, name_uz, name_ru, name_en) VALUES (?, ?, ?, ?)');
  const svcMonolith = Number(insertSvcCat.run('monolith-foundation', 'Poydevor va Monolit', 'Фундамент и монолит', 'Foundation & Monolith').lastInsertRowid);
  const svcMasonry = Number(insertSvcCat.run('masonry-walls', "G'isht terish va devor", 'Кладка и стены', 'Masonry & Walls').lastInsertRowid);
  const svcFinishing = Number(insertSvcCat.run('facade-finishing', 'Fasad va pardozlash', 'Фасад и отделка', 'Facade & Finishing').lastInsertRowid);
  const svcDesign = Number(insertSvcCat.run('architecture-design', 'Arxitektura va loyihalash', 'Архитектура и проектирование', 'Architecture & Design').lastInsertRowid);

  const insertService = db.prepare(`
    INSERT INTO services (provider_id, category_id, title_uz, title_ru, title_en, description_uz, description_ru, description_en, price_from_uzs, price_unit, region, image_url, moderation_status, rating, review_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED', ?, ?)
  `);

  insertService.run(
    contractor1Id,
    svcMonolith,
    'Temir-beton poydevor va monolit karkas qurilishi',
    'Строительство железобетонного фундамента и каркаса',
    'Reinforced Concrete Foundation & Monolith Framing',
    'Loyiha chizmalari asosida qolip o‘rnatish, armatura to‘qish va vibratsiyali beton quyish xizmati.',
    'Установка опалубки, вязка арматуры и заливка бетона с виброуплотнением строго по чертежам.',
    'Full-cycle formwork, rebar tying, and vibrated concrete pouring engineered to structural blueprints.',
    420000,
    'm³',
    'Toshkent shahri',
    IMG_TEAM,
    4.9,
    29
  );

  insertService.run(
    contractor1Id,
    svcMasonry,
    "Pishiq g'isht va gazoblok terish (brigada)",
    'Кладка жженого кирпича и газоблока',
    'Brick & Foam-Block Structural Masonry',
    'Lazer nivelir nazorati ostida tekis va mustahkam tashqi hamda ichki devorlar terish.',
    'Ровная кладка несущих и перегородочных стен под лазерный уровень.',
    'Laser-leveled load-bearing brick and aerated block masonry by certified crews.',
    145000,
    'm²',
    'Toshkent shahri',
    IMG_TEAM,
    4.8,
    18
  );

  insertService.run(
    contractor2Id,
    svcFinishing,
    'Travertin fasad va kalit topshirish ichki ta’mir',
    'Травертиновый фасад и ремонт под ключ',
    'Travertine Facade Cladding & Turnkey Interior Fit-Out',
    'Issiqlik izolyatsiyasi bilan tabiiy travertin qoplama, elektr, santexnika va bo‘yoq ishlari.',
    'Облицовка натуральным травертином с утеплением, электрика, сантехника и чистовая отделка.',
    'Insulated natural travertine cladding, MEP installation, and architectural interior finishing.',
    360000,
    'm²',
    "Farg'ona",
    IMG_VILLA,
    4.9,
    24
  );

  insertService.run(
    architect1Id,
    svcDesign,
    'Individual uy va tijorat binosi arxitektura loyihasi (AR + KR)',
    'Архитектурный и конструктивный проект дома (АР + КР)',
    'Complete Architectural & Structural Blueprint Package (AR + KR)',
    '3D vizualizatsiya, rejalashtirish yechimlari, konstruktiv hisob-kitob va mualliflik nazorati.',
    '3D-визуализация, планировочные решения, конструктивные расчёты и авторский надзор.',
    '3D BIM visualization, floor plans, structural engineering sheets, and site supervision.',
    190000,
    'm²',
    'Toshkent shahri',
    IMG_ARCHITECT,
    5.0,
    37
  );

  // 7. Construction Projects, Members, Tasks, Progress, Expenses, Contracts, Documents
  const insertProject = db.prepare(`
    INSERT INTO projects (owner_id, company_id, name, description, address, region, construction_type, building_area_sqm, floors, estimated_budget_uzs, spent_uzs, status, progress_percent, start_date, expected_end_date, image_url, is_public)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  const proj1Id = Number(
    insertProject.run(
      customerId,
      comp1Id,
      'Yunusobod 2-Qavatli Zamonaviy Villa',
      '320 m² maydonli, travertin fasadli va yerto‘lali zamonaviy oilaviy turar-joy qurilishi.',
      'Toshkent sh., Yunusobod tumani, 14-mavze, 28-uy',
      'Toshkent shahri',
      'VILLA',
      320,
      2,
      1450000000,
      685000000,
      'IN_PROGRESS',
      58,
      '2026-03-10',
      '2026-12-20',
      IMG_VILLA
    ).lastInsertRowid
  );

  const proj2Id = Number(
    insertProject.run(
      companyUserId,
      comp1Id,
      'Chilonzor Business Park — B Korpus',
      '5 qavatli zamonaviy ofis va savdo markazi monolit karkas hamda shisha fasad qurilishi.',
      'Toshkent sh., Chilonzor tumani, Bunyodkor shoh ko‘chasi 7',
      'Toshkent shahri',
      'COMMERCIAL',
      2400,
      5,
      12800000000,
      5400000000,
      'IN_PROGRESS',
      44,
      '2026-01-15',
      '2027-06-30',
      IMG_HERO
    ).lastInsertRowid
  );

  const proj3Id = Number(
    insertProject.run(
      company2UserId,
      comp2Id,
      'Buxoro Silk Road Boutique Hotel',
      'Milliy me’morchilik unsurlari bilan jihozlangan 3 qavatli mehmonxona kompleksi.',
      'Buxoro sh., Bahouddin Naqshband ko‘chasi 112',
      'Buxoro',
      'COMMERCIAL',
      1150,
      3,
      5900000000,
      4950000000,
      'IN_PROGRESS',
      84,
      '2025-09-01',
      '2026-12-10',
      IMG_VILLA
    ).lastInsertRowid
  );

  const insertMember = db.prepare('INSERT INTO project_members (project_id, user_id, member_role) VALUES (?, ?, ?)');
  insertMember.run(proj1Id, customerId, 'OWNER');
  insertMember.run(proj1Id, contractor1Id, 'LEAD_CONTRACTOR');
  insertMember.run(proj1Id, architect1Id, 'LEAD_ARCHITECT');
  insertMember.run(proj2Id, companyUserId, 'OWNER');
  insertMember.run(proj2Id, contractor1Id, 'CONTRACTOR');

  const insertTask = db.prepare(`
    INSERT INTO project_tasks (project_id, assignee_id, title, description, status, priority, deadline)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertTask.run(proj1Id, contractor1Id, 'Poydevor va gidroizolyatsiya', 'Bitum praymer va 2 qavatli izolyatsiya qoplamasi.', 'COMPLETED', 'HIGH', '2026-04-15');
  insertTask.run(proj1Id, contractor1Id, '1-qavat monolit plitasi', 'M350 beton quyish va 14 kunlik parvarishlash.', 'COMPLETED', 'HIGH', '2026-06-01');
  insertTask.run(proj1Id, contractor1Id, '2-qavat pishiq g‘isht devorlari', 'Tashqi 38 sm va ichki 12 sm devorlar terish.', 'IN_PROGRESS', 'HIGH', '2026-11-28');
  insertTask.run(proj1Id, architect1Id, 'Fasad travertin chizmasi tasdiqlash', 'Deraza atrofi bezak tugunlari va yoritish sxemasi.', 'REVIEW', 'MEDIUM', '2026-11-22');
  insertTask.run(proj1Id, contractor1Id, 'Tom stropila va profnastil montaji', 'Qarag‘ay brus va RAL 7024 matoviy profnastil.', 'TODO', 'MEDIUM', '2026-12-08');
  insertTask.run(proj2Id, contractor1Id, '3-qavat kolonna va rigel quyish', 'A500C armatura nazorati va beton quyish.', 'IN_PROGRESS', 'HIGH', '2026-11-30');

  const insertProgress = db.prepare(`
    INSERT INTO project_progress (project_id, author_id, title, notes, percent_complete, photo_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertProgress.run(proj1Id, contractor1Id, 'Poydevor va 1-qavat yopmasi yakunlandi', 'Beton mustahkamligi laboratoriya tekshiruvidan muvaffaqiyatli o‘tdi.', 40, IMG_TEAM);
  insertProgress.run(proj1Id, contractor1Id, '2-qavat devorlari 75% terildi', 'M150 g‘isht va M400 sement qorishmasi bilan sifatli terim davom etmoqda.', 58, IMG_HERO);

  const insertExpense = db.prepare(`
    INSERT INTO project_expenses (project_id, recorded_by, category, title, amount_uzs, expense_date, vendor_name)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertExpense.run(proj1Id, customerId, 'Materiallar', 'Bekobod Armatura A500C (14 tonna)', 135100000, '2026-04-02', 'Bunyod Stroy Market');
  insertExpense.run(proj1Id, customerId, 'Materiallar', 'Qizilqumsement M500 (600 qop) + G‘isht M150', 112000000, '2026-05-14', 'Bunyod Stroy Market');
  insertExpense.run(proj1Id, customerId, 'Ish haqi', 'Monolit va g‘isht terish bosqich to‘lovi', 240000000, '2026-07-20', 'Dilshod Tursunov brigadasi');
  insertExpense.run(proj1Id, customerId, 'Arxitektura', 'AR + KR to‘liq ishchi loyiha', 60800000, '2026-03-05', 'Alimov Studio Architecture');

  db.prepare(`
    INSERT INTO contracts (contract_number, project_id, client_id, contractor_id, title, amount_uzs, status, terms)
    VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
  `).run(
    'QH-CTR-2026-0108',
    proj1Id,
    customerId,
    contractor1Id,
    'Yunusobod Villa — Karkas va G‘isht Terish Shartnomasi',
    420000000,
    'To‘lov bosqichma-bosqich bajarilgan ish dalolatnomasi (KS-2) asosida amalga oshiriladi. Kafolat muddati: 36 oy.'
  );

  db.prepare(`
    INSERT INTO documents (project_id, uploaded_by, title, doc_type, file_url, file_size_kb)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(proj1Id, architect1Id, 'AR-KR-Yunusobod-Villa-v3.pdf', 'BLUEPRINT', '#blueprint-ar-kr', 4280);
  db.prepare(`
    INSERT INTO documents (project_id, uploaded_by, title, doc_type, file_url, file_size_kb)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(proj1Id, customerId, 'Kadastr-va-Qurilish-Ruxsatnomasi.pdf', 'PERMIT', '#permit-doc', 1150);

  // 8. Estimate Configs (editable by ADMIN) & Sample Saved Estimate
  const insertCfg = db.prepare(`
    INSERT INTO estimate_configs (key, label_uz, label_ru, label_en, unit, unit_price_uzs, coefficient)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertCfg.run('cement', 'Sement M400/M500', 'Цемент М400/М500', 'Portland Cement M400/M500', 'qop (50kg)', 46000, 1.0);
  insertCfg.run('bricks', "Pishiq g'isht M150", 'Кирпич жженый М150', 'Fired Clay Bricks M150', 'dona', 1450, 1.0);
  insertCfg.run('sand', 'Qurilish qumi', 'Песок строительный', 'Washed River Sand', 'm³', 120000, 1.0);
  insertCfg.run('gravel', 'Shag‘al (sheben)', 'Щебень строительный', 'Crushed Gravel Aggregate', 'm³', 145000, 1.0);
  insertCfg.run('rebar', 'Armatura A500C', 'Арматура А500С', 'Steel Rebar A500C', 'tonna', 9600000, 1.0);
  insertCfg.run('roofing', 'Tom yopish materiali', 'Кровельные материалы', 'Roofing Sheets & Timber', 'm²', 118000, 1.0);
  insertCfg.run('labor', 'Usta va ishchi kuchi', 'Строительно-монтажные работы', 'Construction Labor', 'm²', 820000, 1.0);
  insertCfg.run('other', 'Muhandislik va qo‘shimcha xarajatlar', 'Инженерные и прочие расходы', 'Engineering & Contingency', 'm²', 340000, 1.0);

  const estId = Number(
    db
      .prepare(
        `INSERT INTO estimates (user_id, project_id, title, building_area_sqm, floors, construction_type, foundation_type, wall_material, roof_type, finishing_type, region, total_estimated_uzs)
         VALUES (?, ?, ?, 160, 2, 'VILLA', 'STRIP', 'FIRED_BRICK', 'METAL_TILE', 'STANDARD', 'Toshkent shahri', 984500000)`
      )
      .run(customerId, proj1Id, 'Yunusobod Villa — Dastlabki Smeta').lastInsertRowid
  );
  db.prepare(
    `INSERT INTO estimate_items (estimate_id, item_key, name, quantity, unit, unit_price_uzs, subtotal_uzs)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(estId, 'cement', 'Sement M400/M500', 528, 'qop (50kg)', 49680, 26231040);

  // 9. Orders, Payments & Transactions
  const order1Id = Number(
    db
      .prepare(
        `INSERT INTO orders (order_number, customer_id, seller_id, project_id, status, total_uzs, delivery_address, region, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        'QH-ORD-26011',
        customerId,
        seller1Id,
        proj1Id,
        'SHIPPED',
        23750000,
        'Toshkent sh., Yunusobod 14-mavze, 28',
        'Toshkent shahri',
        'Ertalab soat 09:00 gacha manipulyator bilan yetkazilsin.'
      ).lastInsertRowid
  );
  db.prepare(
    `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price_uzs, subtotal_uzs)
     VALUES (?, 1, 'Qizilqumsement M500 D0 (50 kg)', 500, 47500, 23750000)`
  ).run(order1Id);

  const pay1Id = Number(
    db
      .prepare(
        `INSERT INTO payments (payment_ref, user_id, order_id, provider, amount_uzs, status, sandbox_mode, external_tx_id)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?)`
      )
      .run('PAY-SANDBOX-1001', customerId, order1Id, 'PAYME', 23750000, 'COMPLETED', 'PAYME-SBX-882910').lastInsertRowid
  );
  db.prepare(
    `INSERT INTO transactions (payment_id, event_type, amount_uzs, status, signature_verified, metadata_json)
     VALUES (?, 'PAYME_PERFORM', 23750000, 'COMPLETED', 1, '{"mode":"sandbox","provider":"PAYME"}')`
  ).run(pay1Id);

  // 10. Reviews, Favorites, Conversations, Messages, Notifications
  const insertReview = db.prepare(
    'INSERT INTO reviews (author_id, target_type, target_id, rating, comment) VALUES (?, ?, ?, ?, ?)'
  );
  insertReview.run(customerId, 'PRODUCT', 1, 5, 'Qizilqumsement sifati a’lo, qoplar yangi va to‘liq vaznda yetkazildi.');
  insertReview.run(customerId, 'SERVICE', 1, 5, 'Dilshod aka jamoasi poydevorni chizma bo‘yicha juda aniq quydi.');
  insertReview.run(customerId, 'COMPANY', comp1Id, 5, 'Shaffof hisobot va muddatga qat’iy rioya qiladigan kompaniya.');

  db.prepare('INSERT INTO favorites (user_id, target_type, target_id) VALUES (?, ?, ?)').run(customerId, 'PRODUCT', 1);
  db.prepare('INSERT INTO favorites (user_id, target_type, target_id) VALUES (?, ?, ?)').run(customerId, 'PRODUCT', 5);

  const conv1Id = Number(
    db
      .prepare('INSERT INTO conversations (participant_one, participant_two, subject) VALUES (?, ?, ?)')
      .run(customerId, seller1Id, 'Qizilqumsement M500 yetkazib berish')
      .lastInsertRowid
  );
  const conv2Id = Number(
    db
      .prepare('INSERT INTO conversations (participant_one, participant_two, subject) VALUES (?, ?, ?)')
      .run(customerId, contractor1Id, 'Yunusobod Villa — 2-qavat devor ishlari')
      .lastInsertRowid
  );

  const insertMsg = db.prepare('INSERT INTO messages (conversation_id, sender_id, body, is_read) VALUES (?, ?, ?, ?)');
  insertMsg.run(conv1Id, customerId, 'Assalomu alaykum! 500 qop M500 sement Yunusobodga ertaga yetib boradimi?', 1);
  insertMsg.run(conv1Id, seller1Id, 'Va alaykum assalom! Ha, buyurtmangiz tasdiqlandi, ertaga soat 08:30 da mashina yo‘lga chiqadi.', 0);
  insertMsg.run(conv2Id, contractor1Id, 'Bugun 2-qavatning sharqiy devori yakunlandi, foto hisobotni loyiha bo‘limiga yukladim.', 0);

  const insertNotif = db.prepare('INSERT INTO notifications (user_id, title, body, type, link_path) VALUES (?, ?, ?, ?, ?)');
  insertNotif.run(customerId, 'Buyurtma yo‘lga chiqdi', 'QH-ORD-26011 raqamli buyurtmangiz SHIPPED holatiga o‘tdi.', 'ORDER', '/dashboard');
  insertNotif.run(customerId, 'Yangi foto hisobot', 'Yunusobod Villa loyihasida progress 58% ga yetdi.', 'PROJECT', '/projects/1');
  insertNotif.run(seller1Id, 'Yangi buyurtma tushdi', 'Azizbek Karimovdan 23,750,000 UZS miqdorida buyurtma.', 'ORDER', '/dashboard');

  // 11. Subscriptions, Blog, Banners, Settings, Audit Logs
  db.prepare(
    `INSERT INTO subscriptions (user_id, plan_code, price_uzs, status, ends_at) VALUES (?, 'PRO_SELLER', 490000, 'ACTIVE', datetime('now', '+30 days'))`
  ).run(seller1Id);

  const insertBlog = db.prepare(`
    INSERT INTO blog_posts (slug, author_id, title_uz, title_ru, title_en, excerpt_uz, excerpt_ru, excerpt_en, content_uz, content_ru, content_en, category, image_url, read_minutes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertBlog.run(
    'ozbekistonda-uy-qurish-smetasi-2026',
    adminId,
    "O'zbekistonda 2026-yilda xususiy uy qurish xarajatlari va smeta tuzish qoidalari",
    'Стоимость строительства частного дома в Узбекистане в 2026 году',
    '2026 Guide to Residential Construction Costs & Estimating in Uzbekistan',
    "Poydevor, devor materiallari va hududiy logistika narxlarini to'g'ri hisoblash bo'yicha amaliy qo'llanma.",
    'Практическое руководство по расчёту фундамента, стеновых материалов и логистики по регионам.',
    'A practical guide to estimating foundation, masonry, rebar, and regional logistics in UZS.',
    "O'zbekiston bozorida qurilish xarajatlarining 55–62 foizini asosiy materiallar (sement, pishiq g‘isht, A500C armatura va tom yopish qoplamalari) tashkil etadi. Smeta tuzishda avvalo grunt turi, seysmik hudud talablari (8–9 ball) va hududiy yetkazib berish masofasini hisobga olish zarur. QurilishHub kalkulyatori orqali dastlabki taxminiy xarajatlarni bir necha soniyada ko‘rishingiz, so‘ngra sertifikatlangan konstruktor bilan yakuniy ishchi loyihani tasdiqlashingiz mumkin.",
    'В структуре затрат на строительство в Узбекистане 55–62% приходится на базовые материалы: цемент, жженый кирпич, арматуру А500С и кровлю. При составлении сметы важно учитывать сейсмичность региона (8–9 баллов) и транспортное плечо.',
    'Core structural materials—Portland cement, fired clay bricks, A500C rebar, and roofing—account for 55–62% of build budgets in Uzbekistan. Factoring seismic zone standards and regional freight rates early prevents mid-project overruns.',
    'Smeta va Moliya',
    IMG_HERO,
    6
  );
  insertBlog.run(
    'pishiq-gisht-yoki-gazoblok-tanlovi',
    architect1Id,
    "Pishiq g'isht yoki gazoblok: O'zbekiston iqlimi uchun qaysi biri ma'qul?",
    'Жженый кирпич или газоблок: что выбрать для климата Узбекистана?',
    'Fired Brick vs. Aerated Concrete Blocks in Uzbekistan Climate',
    'Issiqlik saqlash, seysmik chidamlilik va devor qalinligi bo‘yicha muhandislik taqqoslash.',
    'Инженерное сравнение теплоизоляции, сейсмостойкости и стоимости кладки.',
    'Engineering comparison of thermal insulation, seismic resilience, and wall assembly cost.',
    "Yozgi +45°C issiq va qishki sovuqlarda devor materialining issiqlik inersiyasi katta ahamiyatga ega. Pishiq g‘isht yuqori mustahkamlik va uzoq xizmat muddati bilan ajralib tursa, gazoblok yengil vazni va tez terilishi bilan poydevor yukini kamaytiradi. Monolit karkasli uylarda gazoblok + bazalt vata kombinatsiyasi energiya sarfini 30% gacha tejaydi.",
    'В условиях жаркого лета (+45°C) и зимних холодов тепловая инерция стен критически важна. Жженый кирпич обеспечивает долговечность, а газоблок снижает нагрузку на фундамент.',
    'With summer highs reaching +45°C, thermal inertia matters. Fired brick offers unmatched longevity, while aerated blocks paired with basalt wool reduce foundation loads and HVAC demand.',
    'Arxitektura',
    IMG_CEMENT,
    5
  );
  insertBlog.run(
    'seysmik-poydevor-va-armatura-nazorati',
    contractor1Id,
    'Seysmik hududda poydevor quyish: A500C armatura va M350 beton standartlari',
    'Заливка фундамента в сейсмической зоне: стандарты арматуры А500С и бетона М350',
    'Seismic Foundation Standards: A500C Rebar & M350 Concrete Quality Control',
    'Qurilish maydonida armatura to‘qish, himoya qatlami va beton parvarishida yo‘l qo‘yiladigan xatolar.',
    'Типичные ошибки при вязке арматуры, устройстве защитного слоя и уходе за бетоном.',
    'Field checklist for rebar overlap, concrete cover spacers, and curing in seismic zones.',
    "Ko‘plab xususiy qurilishlarda armaturani payvandlash yoki himoya qatlamisiz yerga qo‘yish kabi xatolar uchraydi. A500C sinfidagi armaturani bog‘lash simi bilan to‘qish va kamida 40 mm himoya qatlami saqlash konstruksiyaning seysmik barqarorligini ta’minlaydi.",
    'Сварка арматуры вместо вязки вязальной проволокой и отсутствие защитного слоя снижают сейсмостойкость узлов. Соблюдение защитного слоя от 40 мм обязательно.',
    'Tying A500C rebar rather than spot-welding and maintaining a 40mm concrete cover prevents corrosion and preserves seismic ductility.',
    'Texnologiya',
    IMG_TEAM,
    4
  );

  db.prepare(
    `INSERT INTO banners (title_uz, title_ru, title_en, subtitle_uz, link_path, image_url, is_active)
     VALUES (?, ?, ?, ?, ?, ?, 1)`
  ).run(
    'Barcha hududlarga to‘g‘ridan-to‘g‘ri zavod narxlarida yetkazib berish',
    'Прямые поставки стройматериалов по всему Узбекистану',
    'Direct Factory Material Delivery Across Uzbekistan',
    'Click, Payme va Uzum Bank orqali xavfsiz to‘lovlar va smeta nazorati.',
    '/materials',
    IMG_HERO
  );

  db.prepare("INSERT INTO platform_settings (key, value) VALUES ('platform_commission_percent', '3.5')").run();
  db.prepare("INSERT INTO platform_settings (key, value) VALUES ('payment_mode', 'sandbox')").run();
  db.prepare("INSERT INTO platform_settings (key, value) VALUES ('support_phone', '+998 71 200 90 90')").run();

  db.prepare(
    `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, details)
     VALUES (?, 'SEED_INITIALIZED', 'SYSTEM', '1', 'Initial Uzbekistan construction ecosystem seed completed')`
  ).run(adminId);
}
