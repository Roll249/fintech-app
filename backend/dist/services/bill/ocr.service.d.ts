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
export declare class OcrService {
    private worker;
    initialize(): Promise<void>;
    processImage(imageBuffer: Buffer): Promise<OcrResult>;
    private preprocessImage;
    parseBillText(text: string): ParsedBillData;
    private parseAmount;
    private parseDate;
    cleanup(): Promise<void>;
}
//# sourceMappingURL=ocr.service.d.ts.map