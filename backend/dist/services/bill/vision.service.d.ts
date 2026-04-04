export interface VisionOcrResult {
    text: string;
    confidence: number;
    blocks: TextBlock[];
    languageCode: string | null;
}
export interface TextBlock {
    text: string;
    confidence: number;
    boundingBox: BoundingBox | null;
}
export interface BoundingBox {
    vertices: Array<{
        x: number;
        y: number;
    }>;
}
export declare class VisionOcrService {
    private client;
    private initialized;
    /**
     * Initialize the Vision API client
     * Uses GOOGLE_APPLICATION_CREDENTIALS env var or explicit credentials
     */
    initialize(): Promise<void>;
    /**
     * Check if the service is available
     */
    isAvailable(): boolean;
    /**
     * Analyze an image using Google Vision document text detection
     */
    analyzeImage(imageBuffer: Buffer): Promise<VisionOcrResult>;
    /**
     * Extract text from a block structure
     */
    private extractBlockText;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
}
export declare function getVisionService(): VisionOcrService;
//# sourceMappingURL=vision.service.d.ts.map