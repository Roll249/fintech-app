/**
 * Bill type classification based on content patterns
 */
export type BillType = 'receipt' | 'invoice' | 'utility' | 'restaurant' | 'supermarket' | 'ecommerce' | 'pharmacy' | 'fuel' | 'telecom' | 'unknown';
/**
 * Classify a bill based on its text content and optionally merchant name
 */
export declare function classifyBill(text: string, merchantName?: string): BillType;
/**
 * Get human-readable label for bill type
 */
export declare function getBillTypeLabel(type: BillType): string;
/**
 * Get suggested category based on bill type
 */
export declare function getSuggestedCategory(type: BillType): string | null;
//# sourceMappingURL=bill-classifier.d.ts.map