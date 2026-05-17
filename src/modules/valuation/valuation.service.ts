import { listProducts } from '../catalog/catalog.service.js';
import { prisma } from '../../lib/prisma.js';

import type { ValuationBody } from './valuation.validators.js';

export type ValuationConfidence = 'low' | 'medium' | 'high';
export type ValuationSellSpeed = 'fast' | 'moderate' | 'slow';
export type ValuationDemand = 'low' | 'medium' | 'high';

export type ValuationResult = {
  productName: string;
  recommended: number;
  min: number;
  max: number;
  confidence: ValuationConfidence;
  sellSpeed: ValuationSellSpeed;
  demand: ValuationDemand;
  similarCount: number;
  insight: string;
  currency: 'TRY';
};

type ProductRow = Awaited<ReturnType<typeof listProducts>>['items'][number];

function conditionMultiplier(condition: string) {
  switch (condition) {
    case 'new':
      return 1;
    case 'like_new':
      return 0.92;
    case 'good':
      return 0.85;
    case 'fair':
      return 0.72;
    case 'used':
      return 0.62;
    default:
      return 0.85;
  }
}

function median(nums: number[]) {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

function roundTry(n: number) {
  return Math.round(n / 50) * 50;
}

function productPrice(row: ProductRow) {
  const v = row.variants?.[0];
  if (!v?.price) return 0;
  return Number(v.price);
}

function productTitle(row: ProductRow, locale: string) {
  if (locale === 'ar') return row.name_ar || row.name_en;
  return row.name_en || row.name_ar;
}

function buildSearchQuery(body: ValuationBody) {
  const parts = [
    body.title?.trim(),
    body.brand?.trim(),
    body.description?.trim().slice(0, 80),
  ].filter(Boolean) as string[];
  if (parts.length) return parts.join(' ');
  const hint = body.imageHint?.trim();
  if (hint) {
    const base = hint.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').trim();
    if (base.length > 2) return base;
  }
  return '';
}

const INSIGHT = {
  en: {
    withData: (count: number, category: string) =>
      `Based on ${count} similar listings in ${category}. Prices reflect current Turkish marketplace trends and your selected condition.`,
    noData:
      'Limited comparable listings found. This estimate uses general Turkish market benchmarks — add more details for a tighter range.',
    defaultName: 'Your Product',
    generalMarket: 'the marketplace',
  },
  ar: {
    withData: (count: number, category: string) =>
      `بناءً على ${count} إعلاناً مشابهاً في ${category}. الأسعار تعكس السوق التركي الحالي وحالة المنتج.`,
    noData:
      'إعلانات مشابهة محدودة. التقدير يعتمد على معايير السوق التركي العامة.',
    defaultName: 'منتجك',
    generalMarket: 'السوق',
  },
  tr: {
    withData: (count: number, category: string) =>
      `${category} içinde ${count} benzer ilana göre. Fiyatlar güncel Türk pazarı ve seçtiğiniz durumu yansıtır.`,
    noData:
      'Benzer ilan az. Tahmin genel Türk piyasa ölçütlerine dayanır — daha fazla detay daha dar aralık verir.',
    defaultName: 'Ürününüz',
    generalMarket: 'pazarda',
  },
} as const;

async function resolveCategoryLabel(slug: string | undefined, locale: string) {
  if (!slug?.trim()) return null;
  const cat = await prisma.category.findFirst({
    where: { slug, deleted_at: null, is_active: true },
    select: { name_en: true, name_ar: true },
  });
  if (!cat) return slug;
  return locale === 'ar' ? cat.name_ar || cat.name_en : cat.name_en || cat.name_ar;
}

export async function runValuation(body: ValuationBody): Promise<ValuationResult> {
  const locale = body.locale;
  const copy = INSIGHT[locale] ?? INSIGHT.en;
  const mult = conditionMultiplier(body.condition);

  const search = buildSearchQuery(body);
  const categorySlug = body.categorySlug?.trim() || undefined;

  let items: ProductRow[] = [];
  if (search.length >= 2 || categorySlug) {
    const listed = await listProducts({
      page: 1,
      limit: 24,
      search: search.length >= 2 ? search : undefined,
      category: categorySlug,
    });
    items = listed.items;
  }

  const prices = items.map(productPrice).filter((p) => p > 0);

  let recommended: number;
  let min: number;
  let max: number;
  let similarCount: number;

  if (prices.length >= 2) {
    const med = median(prices) * mult;
    recommended = roundTry(med);
    min = roundTry(Math.min(...prices) * mult * 0.85);
    max = roundTry(Math.max(...prices) * mult * 1.15);
    similarCount = prices.length;
  } else if (prices.length === 1) {
    recommended = roundTry(prices[0]! * mult);
    min = roundTry(recommended * 0.7);
    max = roundTry(recommended * 1.4);
    similarCount = 1;
  } else {
    recommended = 1500;
    min = 800;
    max = 3000;
    similarCount = 0;
  }

  if (min >= recommended) min = Math.round(recommended * 0.6);
  if (max <= recommended) max = Math.round(recommended * 1.5);

  const categoryLabel =
    (await resolveCategoryLabel(categorySlug, locale)) ?? copy.generalMarket;

  const productName =
    body.title?.trim() ||
    (items[0] ? productTitle(items[0], locale) : copy.defaultName);

  const spread = (recommended - min) / (max - min || 1);
  const confidence: ValuationConfidence =
    similarCount >= 8 ? 'high' : similarCount >= 3 ? 'medium' : 'low';
  const demand: ValuationDemand =
    similarCount >= 10 ? 'high' : similarCount >= 4 ? 'medium' : 'low';
  const sellSpeed: ValuationSellSpeed =
    spread < 0.35 ? 'fast' : spread < 0.55 ? 'moderate' : 'slow';

  const insight =
    similarCount > 0
      ? copy.withData(similarCount, categoryLabel)
      : copy.noData;

  return {
    productName,
    recommended,
    min,
    max,
    confidence,
    sellSpeed,
    demand,
    similarCount,
    insight,
    currency: 'TRY',
  };
}
