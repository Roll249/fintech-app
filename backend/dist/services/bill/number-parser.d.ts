/**
 * Vietnamese number parsing utilities
 * Handles various number formats commonly used in Vietnam and internationally
 */
export type NumberFormat = 'vn' | 'international' | 'none';
/**
 * Detects the number format used in a string
 * - 'vn': Vietnamese format (1.000.000,50) - dots for thousands, comma for decimal
 * - 'international': International format (1,000,000.50) - commas for thousands, dot for decimal
 * - 'none': No separators detected (100000)
 */
export declare function detectNumberFormat(text: string): NumberFormat;
/**
 * Parse a Vietnamese formatted amount string to a number
 * Handles multiple formats:
 * - 1.000.000 (VN thousands separator)
 * - 1.000.000,50 (VN with decimal)
 * - 1,000,000.50 (International)
 * - 100000 (no separator)
 * - 100.000đ or 100,000 VND (with currency suffix)
 */
export declare function parseVietnameseAmount(text: string): number | null;
/**
 * Format a number in Vietnamese format
 */
export declare function formatVietnameseAmount(amount: number): string;
/**
 * Extract all potential amounts from a text string
 */
export declare function extractAmounts(text: string): number[];
//# sourceMappingURL=number-parser.d.ts.map