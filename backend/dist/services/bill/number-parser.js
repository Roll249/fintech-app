"use strict";
/**
 * Vietnamese number parsing utilities
 * Handles various number formats commonly used in Vietnam and internationally
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectNumberFormat = detectNumberFormat;
exports.parseVietnameseAmount = parseVietnameseAmount;
exports.formatVietnameseAmount = formatVietnameseAmount;
exports.extractAmounts = extractAmounts;
/**
 * Detects the number format used in a string
 * - 'vn': Vietnamese format (1.000.000,50) - dots for thousands, comma for decimal
 * - 'international': International format (1,000,000.50) - commas for thousands, dot for decimal
 * - 'none': No separators detected (100000)
 */
function detectNumberFormat(text) {
    // Clean the text first
    const cleaned = text.trim();
    // Check for Vietnamese format: dots as thousands separator, comma as decimal
    // Pattern: digits followed by dots in groups of 3, optionally ending with comma and decimals
    const vnPattern = /^\d{1,3}(\.\d{3})+(,\d+)?$/;
    if (vnPattern.test(cleaned)) {
        return 'vn';
    }
    // Check for Vietnamese format without decimal
    const vnPatternNoDecimal = /^\d{1,3}(\.\d{3})+$/;
    if (vnPatternNoDecimal.test(cleaned)) {
        return 'vn';
    }
    // Check for international format: commas as thousands separator, dot as decimal
    const intlPattern = /^\d{1,3}(,\d{3})+(\.\d+)?$/;
    if (intlPattern.test(cleaned)) {
        return 'international';
    }
    // Check for simple decimal with dot (could be international)
    const simpleDecimalPattern = /^\d+\.\d+$/;
    if (simpleDecimalPattern.test(cleaned)) {
        // If has dot but no comma, check decimal places
        const parts = cleaned.split('.');
        if (parts[1].length <= 2) {
            return 'international';
        }
        // More than 2 decimal places might be VN thousands
        return 'vn';
    }
    // Check for simple decimal with comma (could be VN decimal)
    const vnDecimalPattern = /^\d+,\d+$/;
    if (vnDecimalPattern.test(cleaned)) {
        return 'vn';
    }
    return 'none';
}
/**
 * Parse a Vietnamese formatted amount string to a number
 * Handles multiple formats:
 * - 1.000.000 (VN thousands separator)
 * - 1.000.000,50 (VN with decimal)
 * - 1,000,000.50 (International)
 * - 100000 (no separator)
 * - 100.000đ or 100,000 VND (with currency suffix)
 */
function parseVietnameseAmount(text) {
    if (!text || typeof text !== 'string') {
        return null;
    }
    // Clean the text - remove currency symbols, whitespace, and common suffixes
    let cleaned = text
        .trim()
        .replace(/[đ₫]/gi, '')
        .replace(/\s*(VND|VNĐ|dong|đồng)\s*/gi, '')
        .replace(/\s+/g, '')
        .trim();
    if (!cleaned) {
        return null;
    }
    // Detect the format
    const format = detectNumberFormat(cleaned);
    let result;
    switch (format) {
        case 'vn':
            // Vietnamese format: dots are thousands, comma is decimal
            // Remove dots (thousands separator) and replace comma with dot (decimal)
            cleaned = cleaned.replace(/\./g, '').replace(',', '.');
            result = parseFloat(cleaned);
            break;
        case 'international':
            // International format: commas are thousands, dot is decimal
            // Remove commas (thousands separator)
            cleaned = cleaned.replace(/,/g, '');
            result = parseFloat(cleaned);
            break;
        case 'none':
        default:
            // No separators - just parse directly
            // But handle edge case where there might be a single comma or dot as decimal
            if (cleaned.includes(',') && !cleaned.includes('.')) {
                // Single comma - likely VN decimal separator
                cleaned = cleaned.replace(',', '.');
            }
            result = parseFloat(cleaned);
            break;
    }
    return isNaN(result) ? null : result;
}
/**
 * Format a number in Vietnamese format
 */
function formatVietnameseAmount(amount) {
    const parts = amount.toFixed(0).split('.');
    const integerPart = parts[0];
    // Add dots as thousands separators
    const formatted = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return formatted;
}
/**
 * Extract all potential amounts from a text string
 */
function extractAmounts(text) {
    const amounts = [];
    // Patterns to match different number formats
    const patterns = [
        // Vietnamese format with decimal: 1.000.000,50
        /\d{1,3}(?:\.\d{3})+,\d{1,2}/g,
        // Vietnamese format without decimal: 1.000.000
        /\d{1,3}(?:\.\d{3})+/g,
        // International format with decimal: 1,000,000.50
        /\d{1,3}(?:,\d{3})+\.\d{1,2}/g,
        // International format without decimal: 1,000,000
        /\d{1,3}(?:,\d{3})+/g,
        // Plain number with decimal: 1000000.50
        /\d+\.\d{1,2}/g,
        // Plain number: 1000000
        /\d{4,}/g,
    ];
    for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
            for (const match of matches) {
                const amount = parseVietnameseAmount(match);
                if (amount !== null && amount > 0 && !amounts.includes(amount)) {
                    amounts.push(amount);
                }
            }
        }
    }
    // Sort by value descending (larger amounts first)
    return amounts.sort((a, b) => b - a);
}
//# sourceMappingURL=number-parser.js.map