import { BillType } from './bill-classifier.js';
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
export declare class OcrService {
    private worker;
    private visionService;
    constructor();
    initialize(): Promise<void>;
    /**
     * Process image with Vision API fallback to Tesseract
     * Includes retry logic with exponential backoff
     */
    processImage(imageBuffer: Buffer): Promise<OcrResult>;
    /**
     * Process image with Google Vision API
     */
    private processWithVision;
    /**
     * Process image with Tesseract
     */
    private processWithTesseract;
    private preprocessImage;
    /**
     * Parse bill text and extract structured data
     */
    parseBillText(text: string, merchants?: Array<{
        id: string;
        name: string;
    }>): ParsedBillData;
    /**
     * Extract merchant name from bill text
     */
    private extractMerchantName;
    /**
     * Extract total amount with Vietnamese number format support
     */
    private extractTotalAmount;
    /**
     * Extract date from bill text
     */
    private extractDate;
    /**
     * Extract line items from bill text
     */
    private extractLineItems;
    /**
     * Extract tax amount from bill text
     */
    private extractTax;
    /**
     * Extract subtotal from bill text
     */
    private extractSubtotal;
    private parseDate;
    /**
     * Find matching merchant from merchants list using fuzzy matching
     */
    findMatchingMerchant(extractedName: string, merchants: Array<{
        id: string;
        name: string;
    }>): MerchantMatch | null;
    /**
     * Check if OCR result needs manual review based on confidence
     */
    needsReview(confidence: number): boolean;
    cleanup(): Promise<void>;
}
//# sourceMappingURL=ocr.service.d.ts.map