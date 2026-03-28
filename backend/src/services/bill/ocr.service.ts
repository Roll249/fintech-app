import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import { config } from '../../config/index.js';

export interface OcrResult {
  text: string;
  confidence: number;
}

export interface ParsedBillData {
  merchantName: string | null;
  totalAmount: number | null;
  date: string | null;
  items: BillItem[];
  taxAmount: number | null;
  subtotal: number | null;
}

export interface BillItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export class OcrService {
  private worker: Tesseract.Worker | null = null;

  async initialize() {
    if (!this.worker) {
      this.worker = await Tesseract.createWorker(config.ocr.lang);
    }
  }

  async processImage(imageBuffer: Buffer): Promise<OcrResult> {
    console.log('Starting OCR processing...');
    
    // Preprocess image for better OCR results
    const processedImage = await this.preprocessImage(imageBuffer);
    
    // Initialize worker if needed
    await this.initialize();

    // Run OCR
    const result = await Tesseract.recognize(processedImage, config.ocr.lang, {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`OCR progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });

    console.log('OCR completed with confidence:', result.data.confidence);

    return {
      text: result.data.text,
      confidence: result.data.confidence,
    };
  }

  private async preprocessImage(imageBuffer: Buffer): Promise<Buffer> {
    // Enhance image for better OCR
    return sharp(imageBuffer)
      .resize(2000, null, { withoutEnlargement: true }) // Resize to max 2000px width
      .greyscale() // Convert to grayscale
      .normalize() // Normalize contrast
      .sharpen() // Sharpen text
      .toBuffer();
  }

  parseBillText(text: string): ParsedBillData {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    
    const result: ParsedBillData = {
      merchantName: null,
      totalAmount: null,
      date: null,
      items: [],
      taxAmount: null,
      subtotal: null,
    };

    // Extract merchant name (usually at the top)
    if (lines.length > 0) {
      // First non-empty line is often the merchant name
      result.merchantName = lines[0];
    }

    // Extract total amount
    const totalPatterns = [
      /(?:total|tổng|thanh toán|thành tiền)[:\s]*([0-9,.]+)/i,
      /([0-9,.]+)\s*(?:VND|đ|dong)/i,
      /(?:grand total|tổng cộng)[:\s]*([0-9,.]+)/i,
    ];

    for (const pattern of totalPatterns) {
      const match = text.match(pattern);
      if (match) {
        const amount = this.parseAmount(match[1]);
        if (amount && amount > (result.totalAmount || 0)) {
          result.totalAmount = amount;
        }
      }
    }

    // Extract date
    const datePatterns = [
      /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/,
      /(\d{2,4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/,
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        result.date = this.parseDate(match[1]);
        break;
      }
    }

    // Extract line items (simple pattern matching)
    const itemPattern = /^(.+?)\s+(\d+)\s*[x×]\s*([0-9,.]+)\s*=?\s*([0-9,.]+)?$/i;
    
    for (const line of lines) {
      const match = line.match(itemPattern);
      if (match) {
        const unitPrice = this.parseAmount(match[3]);
        const quantity = parseInt(match[2], 10);
        result.items.push({
          name: match[1].trim(),
          quantity,
          unitPrice: unitPrice || 0,
          totalPrice: this.parseAmount(match[4]) || (unitPrice || 0) * quantity,
        });
      }
    }

    // Extract tax
    const taxPattern = /(?:tax|thuế|vat)[:\s]*([0-9,.]+)/i;
    const taxMatch = text.match(taxPattern);
    if (taxMatch) {
      result.taxAmount = this.parseAmount(taxMatch[1]);
    }

    // Extract subtotal
    const subtotalPattern = /(?:subtotal|tạm tính)[:\s]*([0-9,.]+)/i;
    const subtotalMatch = text.match(subtotalPattern);
    if (subtotalMatch) {
      result.subtotal = this.parseAmount(subtotalMatch[1]);
    }

    return result;
  }

  private parseAmount(str: string): number | null {
    if (!str) return null;
    
    // Remove thousands separators and convert decimal separator
    const cleaned = str
      .replace(/[,\s]/g, '') // Remove commas and spaces
      .replace(/\./g, '');   // Remove dots (Vietnamese format)
    
    const amount = parseFloat(cleaned);
    return isNaN(amount) ? null : amount;
  }

  private parseDate(str: string): string | null {
    if (!str) return null;

    // Try to parse various date formats
    const parts = str.split(/[\/\-\.]/);
    if (parts.length !== 3) return null;

    let day: number, month: number, year: number;

    // Assume DD/MM/YYYY or DD-MM-YYYY
    if (parts[2].length === 4) {
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
    } 
    // YYYY/MM/DD or YYYY-MM-DD
    else if (parts[0].length === 4) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    }
    // YY/MM/DD - assume 20YY
    else {
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      year = 2000 + parseInt(parts[2], 10);
    }

    // Validate
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  async cleanup() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}
