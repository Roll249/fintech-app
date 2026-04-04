"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisionOcrService = void 0;
exports.getVisionService = getVisionService;
const vision_1 = require("@google-cloud/vision");
const index_js_1 = require("../../config/index.js");
class VisionOcrService {
    client = null;
    initialized = false;
    /**
     * Initialize the Vision API client
     * Uses GOOGLE_APPLICATION_CREDENTIALS env var or explicit credentials
     */
    async initialize() {
        if (this.initialized && this.client) {
            return;
        }
        try {
            // Check if Vision API is enabled
            if (!index_js_1.config.vision.enabled) {
                throw new Error('Google Vision API is disabled');
            }
            const clientOptions = {};
            // Use GOOGLE_APPLICATION_CREDENTIALS if set, otherwise use individual keys
            if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
                if (process.env.GOOGLE_CLOUD_PROJECT_ID && process.env.GOOGLE_CLOUD_PRIVATE_KEY) {
                    clientOptions.credentials = {
                        client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
                        private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
                    };
                    clientOptions.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
                }
            }
            this.client = new vision_1.ImageAnnotatorClient(clientOptions);
            this.initialized = true;
            console.log('Google Vision API client initialized');
        }
        catch (error) {
            console.error('Failed to initialize Google Vision API client:', error);
            throw error;
        }
    }
    /**
     * Check if the service is available
     */
    isAvailable() {
        return index_js_1.config.vision.enabled && this.initialized && this.client !== null;
    }
    /**
     * Analyze an image using Google Vision document text detection
     */
    async analyzeImage(imageBuffer) {
        if (!this.client) {
            await this.initialize();
        }
        if (!this.client) {
            throw new Error('Vision API client not initialized');
        }
        console.log('Starting Google Vision OCR analysis...');
        const request = {
            image: {
                content: imageBuffer.toString('base64'),
            },
            imageContext: {
                languageHints: ['vi', 'en'], // Vietnamese and English
            },
        };
        // Use documentTextDetection for better results with receipts/invoices
        const [result] = await this.client.documentTextDetection(request);
        if (!result.fullTextAnnotation) {
            return {
                text: '',
                confidence: 0,
                blocks: [],
                languageCode: null,
            };
        }
        const fullTextAnnotation = result.fullTextAnnotation;
        const text = fullTextAnnotation.text || '';
        // Calculate overall confidence from pages
        let totalConfidence = 0;
        let blockCount = 0;
        const blocks = [];
        if (fullTextAnnotation.pages) {
            for (const page of fullTextAnnotation.pages) {
                if (page.blocks) {
                    for (const block of page.blocks) {
                        const blockText = this.extractBlockText(block);
                        const blockConfidence = block.confidence || 0;
                        totalConfidence += blockConfidence;
                        blockCount++;
                        blocks.push({
                            text: blockText,
                            confidence: blockConfidence * 100, // Convert to percentage
                            boundingBox: block.boundingBox?.vertices
                                ? {
                                    vertices: block.boundingBox.vertices.map(v => ({
                                        x: v.x || 0,
                                        y: v.y || 0,
                                    })),
                                }
                                : null,
                        });
                    }
                }
            }
        }
        // Get detected language
        const languageCode = fullTextAnnotation.pages?.[0]?.property?.detectedLanguages?.[0]?.languageCode || null;
        const averageConfidence = blockCount > 0 ? (totalConfidence / blockCount) * 100 : 0;
        console.log(`Vision OCR completed. Confidence: ${averageConfidence.toFixed(1)}%, Language: ${languageCode}`);
        return {
            text,
            confidence: averageConfidence,
            blocks,
            languageCode,
        };
    }
    /**
     * Extract text from a block structure
     */
    extractBlockText(block) {
        let text = '';
        if (block.paragraphs) {
            for (const paragraph of block.paragraphs) {
                if (paragraph.words) {
                    for (const word of paragraph.words) {
                        if (word.symbols) {
                            for (const symbol of word.symbols) {
                                text += symbol.text || '';
                                // Add space after word if there's a detected break
                                if (symbol.property?.detectedBreak) {
                                    const breakType = symbol.property.detectedBreak.type;
                                    if (breakType === 'SPACE' || breakType === 'SURE_SPACE') {
                                        text += ' ';
                                    }
                                    else if (breakType === 'LINE_BREAK' || breakType === 'EOL_SURE_SPACE') {
                                        text += '\n';
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return text.trim();
    }
    /**
     * Cleanup resources
     */
    async cleanup() {
        if (this.client) {
            await this.client.close();
            this.client = null;
            this.initialized = false;
        }
    }
}
exports.VisionOcrService = VisionOcrService;
// Singleton instance
let visionServiceInstance = null;
function getVisionService() {
    if (!visionServiceInstance) {
        visionServiceInstance = new VisionOcrService();
    }
    return visionServiceInstance;
}
//# sourceMappingURL=vision.service.js.map