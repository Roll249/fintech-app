import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import { config } from '../../config/index.js';
import { VisionOcrService, getVisionService, VisionOcrResult } from './vision.service.js';
import { parseVietnameseAmount, extractAmounts } from './number-parser.js';
import { classifyBill, BillType, getSuggestedCategory } from './bill-classifier.js';

export type OcrProvider = 'vision' | 'tesseract';

export interface OcrResult {
  text: string;
  confidence: number;
  provider: OcrProvider;
  attempts: number;
  languageCode?: string | null;
}

export interface ParsedBillData {
  merchantName: string | null;
  totalAmount: number | null;
  date: string | null;
  items: BillItem[];
  taxAmount: number | null;
  subtotal: number | null;
  billType: BillType;
  suggestedCategory: string | null;
  matchedMerchantId: string | null;
}

export interface BillItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface MerchantMatch {
  id: string;
  name: string;
  score: number;
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function getBackoffDelay(attempt: number, baseDelay: number = 1000): number {
  return Math.min(baseDelay * Math.pow(2, attempt), 30000); // Max 30 seconds
}

/**
 * Simple fuzzy matching score (0-1) using Levenshtein distance
 */
function fuzzyMatchScore(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.9;
  }
  
  // Levenshtein distance
  const matrix: number[][] = [];
  
  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  const maxLen = Math.max(s1.length, s2.length);
  return 1 - matrix[s1.length][s2.length] / maxLen;
}

export class OcrService {
  private worker: Tesseract.Worker | null = null;
  private visionService: VisionOcrService;

  constructor() {
    this.visionService = getVisionService();
  }

  async initialize() {
    // Initialize Tesseract worker
    if (!this.worker) {
      this.worker = await Tesseract.createWorker(config.ocr.lang);
    }
    
    // Try to initialize Vision API if enabled
    if (config.vision.enabled) {
      try {
        await this.visionService.initialize();
      } catch (error) {
        console.warn('Vision API initialization failed, will use Tesseract as fallback:', error);
      }
    }
  }

  /**
   * Process image with Vision API fallback to Tesseract
   * Includes retry logic with exponential backoff
   */
  async processImage(imageBuffer: Buffer): Promise<OcrResult> {
    console.log('Starting OCR processing...');
    
    // Preprocess image for better OCR results
    const processedImage = await this.preprocessImage(imageBuffer);
    
    let lastError: Error | null = null;
    let attempts = 0;
    
    // Try Vision API first if enabled
    if (config.vision.enabled) {
      for (let i = 0; i < config.vision.maxRetries; i++) {
        attempts++;
        try {
          console.log(`Vision API attempt ${i + 1}/${config.vision.maxRetries}...`);
          
          const result = await this.processWithVision(processedImage);
          console.log(`Vision OCR completed with confidence: ${result.confidence.toFixed(1)}%`);
          
          return {
            text: result.text,
            confidence: result.confidence,
            provider: 'vision',
            attempts,
            languageCode: result.languageCode,
          };
        } catch (error) {
          lastError = error as Error;
          console.warn(`Vision API attempt ${i + 1} failed:`, error);
          
          // Exponential backoff before retry
          if (i < config.vision.maxRetries - 1) {
            const delay = getBackoffDelay(i);
            console.log(`Waiting ${delay}ms before retry...`);
            await sleep(delay);
          }
        }
      }
      
      console.log('Vision API failed, falling back to Tesseract...');
    }
    
    // Fallback to Tesseract
    attempts++;
    try {
      const result = await this.processWithTesseract(processedImage);
      console.log(`Tesseract OCR completed with confidence: ${result.confidence.toFixed(1)}%`);
      
      return {
        text: result.text,
        confidence: result.confidence,
        provider: 'tesseract',
        attempts,
      };
    } catch (error) {
      console.error('Tesseract OCR failed:', error);
      throw lastError || error;
    }
  }

  /**
   * Process image with Google Vision API
   */
  private async processWithVision(imageBuffer: Buffer): Promise<VisionOcrResult> {
    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Vision API timeout after ${config.vision.timeoutMs}ms`));
      }, config.vision.timeoutMs);
    });
    
    // Race between API call and timeout
    return Promise.race([
      this.visionService.analyzeImage(imageBuffer),
      timeoutPromise,
    ]);
  }

  /**
   * Process image with Tesseract
   */
  private async processWithTesseract(imageBuffer: Buffer): Promise<{ text: string; confidence: number }> {
    await this.initialize();

    const result = await Tesseract.recognize(imageBuffer, config.ocr.lang, {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`OCR progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });

    return {
      text: result.data.text,
      confidence: result.data.confidence,
    };
  }

  private async preprocessImage(imageBuffer: Buffer): Promise<Buffer> {
    // Enhance image for better OCR
    return sharp(imageBuffer)
      .resize(2000, null, { withoutEnlargement: true })
      .greyscale()
      .normalize()
      .sharpen()
      .toBuffer();
  }

  /**
   * Parse bill text and extract structured data
   */
  parseBillText(text: string, merchants?: Array<{ id: string; name: string }>): ParsedBillData {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    
    const result: ParsedBillData = {
      merchantName: null,
      totalAmount: null,
      date: null,
      items: [],
      taxAmount: null,
      subtotal: null,
      billType: 'unknown',
      suggestedCategory: null,
      matchedMerchantId: null,
    };

    // Extract merchant name (usually at the top)
    result.merchantName = this.extractMerchantName(lines);

    // Extract total amount using Vietnamese number parsing
    result.totalAmount = this.extractTotalAmount(text);

    // Extract date
    result.date = this.extractDate(text);

    // Extract line items
    result.items = this.extractLineItems(lines);

    // Extract tax
    result.taxAmount = this.extractTax(text);

    // Extract subtotal
    result.subtotal = this.extractSubtotal(text);

    // Classify bill type
    result.billType = classifyBill(text, result.merchantName || undefined);
    result.suggestedCategory = getSuggestedCategory(result.billType);

    // Match merchant against provided merchants list
    if (merchants && result.merchantName) {
      const match = this.findMatchingMerchant(result.merchantName, merchants);
      if (match) {
        result.matchedMerchantId = match.id;
        result.merchantName = match.name; // Use canonical name
      }
    }

    return result;
  }

  /**
   * Extract merchant name from bill text
   */
  private extractMerchantName(lines: string[]): string | null {
    if (lines.length === 0) return null;
    
    // Skip common header lines
    const skipPatterns = [
      /^(cộng\s*hòa|socialist|republic)/i,
      /^(độc\s*lập|independence)/i,
      /^hóa\s*đơn/i,
      /^invoice/i,
      /^receipt/i,
      /^\d+$/,
      /^\*+$/,
      /^-+$/,
    ];
    
    for (const line of lines.slice(0, 5)) {
      let isSkip = false;
      for (const pattern of skipPatterns) {
        if (pattern.test(line)) {
          isSkip = true;
          break;
        }
      }
      
      if (!isSkip && line.length > 2 && line.length < 100) {
        return line;
      }
    }
    
    return lines[0] || null;
  }

  /**
   * Extract total amount with Vietnamese number format support
   */
  private extractTotalAmount(text: string): number | null {
    const totalPatterns = [
      // Vietnamese patterns
      /(?:tổng\s*(?:cộng|tiền|thanh\s*toán)?|thành\s*tiền|thanh\s*toán)[:\s]*([0-9.,]+)/gi,
      /(?:grand\s*total|total\s*amount|total)[:\s]*([0-9.,]+)/gi,
      // Amount followed by currency
      /([0-9.,]+)\s*(?:VND|VNĐ|đồng|đ)\b/gi,
      // Large numbers that might be totals
      /\b([0-9]{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?)\b/g,
    ];

    let maxAmount = 0;
    
    for (const pattern of totalPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const amount = parseVietnameseAmount(match[1]);
        if (amount && amount > maxAmount && amount < 1000000000) { // Sanity check
          maxAmount = amount;
        }
      }
    }

    // Also try extracting all amounts and taking the largest reasonable one
    const allAmounts = extractAmounts(text);
    for (const amount of allAmounts) {
      if (amount > maxAmount && amount < 1000000000) {
        maxAmount = amount;
      }
    }

    return maxAmount > 0 ? maxAmount : null;
  }

  /**
   * Extract date from bill text
   */
  private extractDate(text: string): string | null {
    const datePatterns = [
      // DD/MM/YYYY or DD-MM-YYYY
      /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/,
      // YYYY/MM/DD or YYYY-MM-DD
      /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/,
      // Vietnamese date format: ngày DD tháng MM năm YYYY
      /ngày\s*(\d{1,2})\s*tháng\s*(\d{1,2})\s*năm\s*(\d{4})/i,
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        return this.parseDate(match[0]);
      }
    }

    return null;
  }

  /**
   * Extract line items from bill text
   */
  private extractLineItems(lines: string[]): BillItem[] {
    const items: BillItem[] = [];
    
    const itemPatterns = [
      // Name quantity x price = total
      /^(.+?)\s+(\d+)\s*[x×]\s*([0-9.,]+)\s*=?\s*([0-9.,]+)?$/i,
      // Name (qty) price
      /^(.+?)\s*\((\d+)\)\s*([0-9.,]+)$/i,
      // Name qty price total
      /^(.+?)\s+(\d+)\s+([0-9.,]+)\s+([0-9.,]+)$/i,
    ];
    
    for (const line of lines) {
      for (const pattern of itemPatterns) {
        const match = line.match(pattern);
        if (match) {
          const unitPrice = parseVietnameseAmount(match[3]);
          const quantity = parseInt(match[2], 10);
          const totalPrice = match[4] ? parseVietnameseAmount(match[4]) : null;
          
          items.push({
            name: match[1].trim(),
            quantity,
            unitPrice: unitPrice || 0,
            totalPrice: totalPrice || (unitPrice || 0) * quantity,
          });
          break;
        }
      }
    }

    return items;
  }

  /**
   * Extract tax amount from bill text
   */
  private extractTax(text: string): number | null {
    const taxPatterns = [
      /(?:tax|thuế|vat|gtgt)[:\s]*([0-9.,]+)/i,
      /(?:thuế\s*gtgt|vat\s*\d+%)[:\s]*([0-9.,]+)/i,
    ];
    
    for (const pattern of taxPatterns) {
      const match = text.match(pattern);
      if (match) {
        return parseVietnameseAmount(match[1]);
      }
    }
    
    return null;
  }

  /**
   * Extract subtotal from bill text
   */
  private extractSubtotal(text: string): number | null {
    const subtotalPatterns = [
      /(?:subtotal|tạm\s*tính|tiền\s*hàng)[:\s]*([0-9.,]+)/i,
      /(?:cộng\s*tiền\s*hàng)[:\s]*([0-9.,]+)/i,
    ];
    
    for (const pattern of subtotalPatterns) {
      const match = text.match(pattern);
      if (match) {
        return parseVietnameseAmount(match[1]);
      }
    }
    
    return null;
  }

  private parseDate(str: string): string | null {
    if (!str) return null;

    // Handle Vietnamese format
    const vnMatch = str.match(/ngày\s*(\d{1,2})\s*tháng\s*(\d{1,2})\s*năm\s*(\d{4})/i);
    if (vnMatch) {
      const day = parseInt(vnMatch[1], 10);
      const month = parseInt(vnMatch[2], 10);
      const year = parseInt(vnMatch[3], 10);
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    const parts = str.split(/[\/\-\.]/);
    if (parts.length !== 3) return null;

    let day: number, month: number, year: number;

    if (parts[2].length === 4) {
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
    } else if (parts[0].length === 4) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    } else {
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      year = 2000 + parseInt(parts[2], 10);
    }

    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  /**
   * Find matching merchant from merchants list using fuzzy matching
   */
  findMatchingMerchant(
    extractedName: string,
    merchants: Array<{ id: string; name: string }>
  ): MerchantMatch | null {
    if (!extractedName || merchants.length === 0) {
      return null;
    }

    let bestMatch: MerchantMatch | null = null;
    const minScore = 0.6; // Minimum score threshold

    for (const merchant of merchants) {
      const score = fuzzyMatchScore(extractedName, merchant.name);
      
      if (score >= minScore && (!bestMatch || score > bestMatch.score)) {
        bestMatch = {
          id: merchant.id,
          name: merchant.name,
          score,
        };
      }
      
      // Also check if merchant name is contained in extracted name
      if (extractedName.toLowerCase().includes(merchant.name.toLowerCase())) {
        const containScore = 0.85;
        if (!bestMatch || containScore > bestMatch.score) {
          bestMatch = {
            id: merchant.id,
            name: merchant.name,
            score: containScore,
          };
        }
      }
    }

    return bestMatch;
  }

  /**
   * Check if OCR result needs manual review based on confidence
   */
  needsReview(confidence: number): boolean {
    return confidence < config.vision.confidenceThreshold;
  }

  async cleanup() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
    await this.visionService.cleanup();
  }
}
