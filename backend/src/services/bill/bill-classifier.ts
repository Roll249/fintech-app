/**
 * Bill type classification based on content patterns
 */

export type BillType = 
  | 'receipt' 
  | 'invoice' 
  | 'utility' 
  | 'restaurant' 
  | 'supermarket' 
  | 'ecommerce' 
  | 'pharmacy'
  | 'fuel'
  | 'telecom'
  | 'unknown';

interface ClassificationPattern {
  type: BillType;
  patterns: RegExp[];
  keywords: string[];
  weight: number;
}

const classificationPatterns: ClassificationPattern[] = [
  // VAT Invoice
  {
    type: 'invoice',
    patterns: [
      /hóa\s*đơn\s*(gtgt|giá\s*trị\s*gia\s*tăng)/i,
      /vat\s*invoice/i,
      /invoice\s*no\.?/i,
      /mã\s*số\s*thuế/i,
      /tax\s*code/i,
      /hđ\s*gtgt/i,
    ],
    keywords: ['hóa đơn', 'invoice', 'mst', 'mã số thuế', 'ký hiệu', 'serial'],
    weight: 10,
  },
  
  // Utility bills (electricity, water, internet)
  {
    type: 'utility',
    patterns: [
      /điện\s*lực/i,
      /evn|pc[a-z]+/i,
      /tiền\s*điện/i,
      /nước\s*(sạch|sinh\s*hoạt)/i,
      /sawaco|cấp\s*nước/i,
      /tiền\s*nước/i,
      /fpt|viettel|vnpt|mobifone/i,
      /internet|wifi|băng\s*rộng/i,
      /broadband/i,
      /kwh|m3|mét\s*khối/i,
    ],
    keywords: ['điện', 'nước', 'internet', 'wifi', 'evn', 'vnpt', 'fpt', 'viettel'],
    weight: 8,
  },
  
  // Telecom (mobile, data plans)
  {
    type: 'telecom',
    patterns: [
      /vinaphone|mobifone|viettel|vietnamobile/i,
      /nạp\s*(tiền|thẻ)/i,
      /top[\s-]*up/i,
      /gói\s*cước/i,
      /data\s*package/i,
      /thuê\s*bao/i,
      /subscriber/i,
    ],
    keywords: ['nạp tiền', 'thuê bao', 'gói cước', 'di động', 'mobile'],
    weight: 7,
  },
  
  // Restaurant/Food & Beverage
  {
    type: 'restaurant',
    patterns: [
      /nhà\s*hàng/i,
      /restaurant/i,
      /quán\s*(ăn|cà\s*phê|coffee)/i,
      /cafe|coffee/i,
      /ẩm\s*thực/i,
      /bàn\s*số/i,
      /table\s*no/i,
      /phục\s*vụ/i,
      /service\s*charge/i,
      /tip|tiền\s*boa/i,
      /đồ\s*uống/i,
      /beverage/i,
      /món\s*ăn/i,
      /food\s*order/i,
    ],
    keywords: ['nhà hàng', 'quán', 'cafe', 'restaurant', 'food', 'bàn', 'phục vụ'],
    weight: 6,
  },
  
  // Supermarket/Grocery
  {
    type: 'supermarket',
    patterns: [
      /siêu\s*thị/i,
      /supermarket/i,
      /co\.?op\s*mart/i,
      /big\s*c/i,
      /vinmart|win\s*mart/i,
      /lotte\s*mart/i,
      /mega\s*market/i,
      /aeon/i,
      /bach\s*hoa\s*xanh/i,
      /tạp\s*hóa/i,
      /grocery/i,
      /minimart/i,
    ],
    keywords: ['siêu thị', 'mart', 'grocery', 'coop', 'vinmart', 'bigc'],
    weight: 6,
  },
  
  // E-commerce
  {
    type: 'ecommerce',
    patterns: [
      /shopee|lazada|tiki|sendo/i,
      /mã\s*đơn\s*hàng/i,
      /order\s*id/i,
      /giao\s*hàng/i,
      /delivery/i,
      /vận\s*chuyển/i,
      /shipping/i,
      /cod|thanh\s*toán\s*khi\s*nhận/i,
      /trả\s*hàng/i,
      /return/i,
    ],
    keywords: ['shopee', 'lazada', 'tiki', 'giao hàng', 'đơn hàng', 'shipping'],
    weight: 7,
  },
  
  // Pharmacy
  {
    type: 'pharmacy',
    patterns: [
      /nhà\s*thuốc/i,
      /pharmacy/i,
      /dược\s*phẩm/i,
      /thuốc/i,
      /pharmacity|long\s*chau|an\s*khang/i,
      /medicare/i,
    ],
    keywords: ['thuốc', 'dược', 'pharmacy', 'medicare'],
    weight: 6,
  },
  
  // Fuel/Gas station
  {
    type: 'fuel',
    patterns: [
      /xăng\s*dầu/i,
      /petrolimex|pv\s*oil/i,
      /gas\s*station/i,
      /cây\s*xăng/i,
      /lít|liters?/i,
      /ron\s*\d+/i,
      /diesel/i,
    ],
    keywords: ['xăng', 'dầu', 'petrol', 'gas', 'fuel'],
    weight: 7,
  },
  
  // Generic receipt (lowest priority)
  {
    type: 'receipt',
    patterns: [
      /biên\s*nhận/i,
      /receipt/i,
      /phiếu\s*(thu|chi|thanh\s*toán)/i,
      /payment\s*slip/i,
      /hóa\s*đơn\s*bán\s*hàng/i,
    ],
    keywords: ['biên nhận', 'receipt', 'phiếu'],
    weight: 3,
  },
];

// Known merchant categories
const merchantCategories: Record<string, BillType> = {
  // Supermarkets
  'coopmart': 'supermarket',
  'co.op mart': 'supermarket',
  'bigc': 'supermarket',
  'big c': 'supermarket',
  'vinmart': 'supermarket',
  'winmart': 'supermarket',
  'lotte mart': 'supermarket',
  'aeon': 'supermarket',
  'mega market': 'supermarket',
  'bach hoa xanh': 'supermarket',
  'mm mega market': 'supermarket',
  
  // E-commerce
  'shopee': 'ecommerce',
  'lazada': 'ecommerce',
  'tiki': 'ecommerce',
  'sendo': 'ecommerce',
  
  // Restaurants/Cafes
  'highlands coffee': 'restaurant',
  'starbucks': 'restaurant',
  'the coffee house': 'restaurant',
  'phuc long': 'restaurant',
  'kfc': 'restaurant',
  'mcdonalds': 'restaurant',
  "mcdonald's": 'restaurant',
  'lotteria': 'restaurant',
  'jollibee': 'restaurant',
  'pizza hut': 'restaurant',
  'dominos': 'restaurant',
  
  // Utilities
  'evn': 'utility',
  'pc1': 'utility',
  'sawaco': 'utility',
  'vnpt': 'utility',
  'fpt': 'utility',
  'viettel': 'telecom',
  'vinaphone': 'telecom',
  'mobifone': 'telecom',
  
  // Fuel
  'petrolimex': 'fuel',
  'pv oil': 'fuel',
  'shell': 'fuel',
  
  // Pharmacy
  'pharmacity': 'pharmacy',
  'long chau': 'pharmacy',
  'an khang': 'pharmacy',
};

/**
 * Classify a bill based on its text content and optionally merchant name
 */
export function classifyBill(text: string, merchantName?: string): BillType {
  const scores: Record<BillType, number> = {
    receipt: 0,
    invoice: 0,
    utility: 0,
    restaurant: 0,
    supermarket: 0,
    ecommerce: 0,
    pharmacy: 0,
    fuel: 0,
    telecom: 0,
    unknown: 0,
  };
  
  const lowerText = text.toLowerCase();
  const lowerMerchant = merchantName?.toLowerCase() || '';
  
  // Check merchant name against known categories
  if (merchantName) {
    for (const [merchant, billType] of Object.entries(merchantCategories)) {
      if (lowerMerchant.includes(merchant)) {
        scores[billType] += 15; // High weight for known merchants
      }
    }
  }
  
  // Check patterns and keywords
  for (const classification of classificationPatterns) {
    // Check regex patterns
    for (const pattern of classification.patterns) {
      if (pattern.test(text)) {
        scores[classification.type] += classification.weight;
      }
    }
    
    // Check keywords
    for (const keyword of classification.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        scores[classification.type] += classification.weight / 2;
      }
    }
  }
  
  // Find the highest scoring type
  let maxScore = 0;
  let result: BillType = 'unknown';
  
  for (const [billType, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      result = billType as BillType;
    }
  }
  
  // If score is too low, return unknown
  if (maxScore < 3) {
    return 'unknown';
  }
  
  return result;
}

/**
 * Get human-readable label for bill type
 */
export function getBillTypeLabel(type: BillType): string {
  const labels: Record<BillType, string> = {
    receipt: 'Biên nhận',
    invoice: 'Hóa đơn VAT',
    utility: 'Hóa đơn tiện ích',
    restaurant: 'Nhà hàng/Cafe',
    supermarket: 'Siêu thị',
    ecommerce: 'Mua sắm online',
    pharmacy: 'Nhà thuốc',
    fuel: 'Xăng dầu',
    telecom: 'Viễn thông',
    unknown: 'Chưa phân loại',
  };
  
  return labels[type];
}

/**
 * Get suggested category based on bill type
 */
export function getSuggestedCategory(type: BillType): string | null {
  const categoryMap: Record<BillType, string | null> = {
    receipt: null,
    invoice: null,
    utility: 'utilities',
    restaurant: 'food_dining',
    supermarket: 'groceries',
    ecommerce: 'shopping',
    pharmacy: 'health',
    fuel: 'transportation',
    telecom: 'utilities',
    unknown: null,
  };
  
  return categoryMap[type];
}
