import { db } from './db.ts';

export interface CalculatorInput {
  buildingAreaSqm: number;
  floors: number;
  constructionType: 'RESIDENTIAL' | 'COMMERCIAL' | 'VILLA' | 'WAREHOUSE';
  foundationType: 'STRIP' | 'SLAB' | 'PILE';
  wallMaterial: 'FIRED_BRICK' | 'FOAM_BLOCK' | 'MONOLITH_CONCRETE';
  roofType: 'METAL_TILE' | 'PROFNASTIL' | 'FLAT_MEMBRANE';
  finishingType: 'ECONOMY' | 'STANDARD' | 'PREMIUM';
  region: string;
}

export interface EstimateItemBreakdown {
  itemKey: string;
  name: string;
  quantity: number;
  unit: string;
  unitPriceUzs: number;
  subtotalUzs: number;
}

export interface EstimateCalculationResult {
  isEstimate: true;
  disclaimer: string;
  currency: 'UZS';
  regionMultiplier: number;
  items: EstimateItemBreakdown[];
  materialsTotalUzs: number;
  laborTotalUzs: number;
  otherTotalUzs: number;
  totalEstimatedUzs: number;
}

const REGION_MULTIPLIERS: Record<string, number> = {
  'Toshkent shahri': 1.08,
  'Toshkent viloyati': 1.02,
  'Samarqand': 1.0,
  'Buxoro': 0.99,
  "Farg'ona": 0.96,
  'Andijon': 0.95,
  'Namangan': 0.95,
  'Xorazm': 1.01,
  'Qashqadaryo': 0.97,
  'Surxondaryo': 0.98,
  'Navoiy': 1.0,
  'Jizzax': 0.96,
  'Sirdaryo': 0.96,
  "Qoraqalpog'iston": 1.03,
};

interface ConfigRow {
  key: string;
  label_uz: string;
  label_ru: string;
  label_en: string;
  unit: string;
  unit_price_uzs: number;
  coefficient: number;
}

export function calculateConstructionEstimate(
  input: CalculatorInput,
  lang: 'uz' | 'ru' | 'en' = 'uz'
): EstimateCalculationResult {
  const rows = db
    .prepare('SELECT key, label_uz, label_ru, label_en, unit, unit_price_uzs, coefficient FROM estimate_configs')
    .all() as unknown as ConfigRow[];

  const configMap = new Map<string, ConfigRow>();
  for (const r of rows) {
    configMap.set(r.key, r);
  }

  const getCfg = (key: string, fallbackLabel: string, fallbackUnit: string, fallbackPrice: number) => {
    const row = configMap.get(key);
    if (!row) {
      return {
        label: fallbackLabel,
        unit: fallbackUnit,
        unitPriceUzs: fallbackPrice,
        coefficient: 1.0,
      };
    }
    const label = lang === 'ru' ? row.label_ru : lang === 'en' ? row.label_en : row.label_uz;
    return {
      label,
      unit: row.unit,
      unitPriceUzs: row.unit_price_uzs,
      coefficient: row.coefficient,
    };
  };

  const totalArea = Math.max(20, input.buildingAreaSqm) * Math.max(1, input.floors);
  const footprintArea = Math.max(20, input.buildingAreaSqm);
  const regionMultiplier = REGION_MULTIPLIERS[input.region] ?? 1.0;

  const typeMult =
    input.constructionType === 'COMMERCIAL'
      ? 1.18
      : input.constructionType === 'VILLA'
      ? 1.14
      : input.constructionType === 'WAREHOUSE'
      ? 0.88
      : 1.0;

  const foundationMult =
    input.foundationType === 'PILE' ? 1.25 : input.foundationType === 'SLAB' ? 1.15 : 1.0;

  const wallBrickFactor =
    input.wallMaterial === 'FIRED_BRICK'
      ? 1.0
      : input.wallMaterial === 'FOAM_BLOCK'
      ? 0.42
      : 0.25;

  const roofMult =
    input.roofType === 'METAL_TILE' ? 1.15 : input.roofType === 'FLAT_MEMBRANE' ? 1.22 : 1.0;

  const finishMult =
    input.finishingType === 'PREMIUM' ? 1.45 : input.finishingType === 'STANDARD' ? 1.15 : 0.9;

  const cementCfg = getCfg('cement', 'Sement M400/M500', 'qop (50kg)', 46000);
  const bricksCfg = getCfg('bricks', "Pishiq g'isht", 'dona', 1450);
  const sandCfg = getCfg('sand', 'Qurilish qumi', 'm³', 120000);
  const gravelCfg = getCfg('gravel', 'Shag‘al (sheben)', 'm³', 145000);
  const rebarCfg = getCfg('rebar', 'Armatura A500C', 'tonna', 9600000);
  const roofingCfg = getCfg('roofing', 'Tom yopish materiali', 'm²', 115000);
  const laborCfg = getCfg('labor', 'Usta va ishchi kuchi', 'm²', 820000);
  const otherCfg = getCfg('other', 'Muhandislik va qo‘shimcha xarajatlar', 'm²', 340000);

  const rawItems = [
    {
      itemKey: 'cement',
      name: cementCfg.label,
      quantity: Math.ceil(totalArea * 1.45 * foundationMult * typeMult * cementCfg.coefficient),
      unit: cementCfg.unit,
      unitPriceUzs: Math.round(cementCfg.unitPriceUzs * regionMultiplier),
    },
    {
      itemKey: 'bricks',
      name: bricksCfg.label,
      quantity: Math.ceil(totalArea * 155 * wallBrickFactor * typeMult * bricksCfg.coefficient),
      unit: bricksCfg.unit,
      unitPriceUzs: Math.round(bricksCfg.unitPriceUzs * regionMultiplier),
    },
    {
      itemKey: 'sand',
      name: sandCfg.label,
      quantity: Number((totalArea * 0.34 * foundationMult * sandCfg.coefficient).toFixed(1)),
      unit: sandCfg.unit,
      unitPriceUzs: Math.round(sandCfg.unitPriceUzs * regionMultiplier),
    },
    {
      itemKey: 'gravel',
      name: gravelCfg.label,
      quantity: Number((totalArea * 0.28 * foundationMult * gravelCfg.coefficient).toFixed(1)),
      unit: gravelCfg.unit,
      unitPriceUzs: Math.round(gravelCfg.unitPriceUzs * regionMultiplier),
    },
    {
      itemKey: 'rebar',
      name: rebarCfg.label,
      quantity: Number((totalArea * 0.038 * foundationMult * typeMult * rebarCfg.coefficient).toFixed(2)),
      unit: rebarCfg.unit,
      unitPriceUzs: Math.round(rebarCfg.unitPriceUzs * regionMultiplier),
    },
    {
      itemKey: 'roofing',
      name: roofingCfg.label,
      quantity: Math.ceil(footprintArea * 1.24 * roofMult * roofingCfg.coefficient),
      unit: roofingCfg.unit,
      unitPriceUzs: Math.round(roofingCfg.unitPriceUzs * regionMultiplier),
    },
    {
      itemKey: 'labor',
      name: laborCfg.label,
      quantity: Math.ceil(totalArea),
      unit: laborCfg.unit,
      unitPriceUzs: Math.round(laborCfg.unitPriceUzs * finishMult * typeMult * regionMultiplier * laborCfg.coefficient),
    },
    {
      itemKey: 'other',
      name: otherCfg.label,
      quantity: Math.ceil(totalArea),
      unit: otherCfg.unit,
      unitPriceUzs: Math.round(otherCfg.unitPriceUzs * finishMult * regionMultiplier * otherCfg.coefficient),
    },
  ];

  const items: EstimateItemBreakdown[] = rawItems.map((it) => ({
    ...it,
    subtotalUzs: Math.round(it.quantity * it.unitPriceUzs),
  }));

  const materialsTotalUzs = items
    .filter((i) => !['labor', 'other'].includes(i.itemKey))
    .reduce((sum, i) => sum + i.subtotalUzs, 0);
  const laborTotalUzs = items.find((i) => i.itemKey === 'labor')?.subtotalUzs ?? 0;
  const otherTotalUzs = items.find((i) => i.itemKey === 'other')?.subtotalUzs ?? 0;
  const totalEstimatedUzs = materialsTotalUzs + laborTotalUzs + otherTotalUzs;

  const disclaimer =
    lang === 'ru'
      ? 'Предварительная смета: расчёты носят ориентировочный характер и не являются сертифицированным инженерным проектом.'
      : lang === 'en'
      ? 'Preliminary estimate only: values are approximate market projections and do not constitute a certified engineering calculation.'
      : "Taxminiy hisob-kitob: ushbu smeta bozor narxlariga asoslangan taxminiy hisob bo'lib, sertifikatlangan muhandislik loyihasi hisoblanmaydi.";

  return {
    isEstimate: true,
    disclaimer,
    currency: 'UZS',
    regionMultiplier,
    items,
    materialsTotalUzs,
    laborTotalUzs,
    otherTotalUzs,
    totalEstimatedUzs,
  };
}
