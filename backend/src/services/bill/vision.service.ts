import { ImageAnnotatorClient, protos } from '@google-cloud/vision';
import { config } from '../../config/index.js';

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
  vertices: Array<{ x: number; y: number }>;
}

export class VisionOcrService {
  private client: ImageAnnotatorClient | null = null;
  private initialized: boolean = false;

  /**
   * Initialize the Vision API client
   * Uses GOOGLE_APPLICATION_CREDENTIALS env var or explicit credentials
   */
  async initialize(): Promise<void> {
    if (this.initialized && this.client) {
      return;
    }

    try {
      // Check if Vision API is enabled
      if (!config.vision.enabled) {
        throw new Error('Google Vision API is disabled');
      }

      const clientOptions: any = {};

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

      this.client = new ImageAnnotatorClient(clientOptions);
      this.initialized = true;
      console.log('Google Vision API client initialized');
    } catch (error) {
      console.error('Failed to initialize Google Vision API client:', error);
      throw error;
    }
  }

  /**
   * Check if the service is available
   */
  isAvailable(): boolean {
    return config.vision.enabled && this.initialized && this.client !== null;
  }

  /**
   * Analyze an image using Google Vision document text detection
   */
  async analyzeImage(imageBuffer: Buffer): Promise<VisionOcrResult> {
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
    const blocks: TextBlock[] = [];

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
  private extractBlockText(block: protos.google.cloud.vision.v1.IBlock): string {
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
                  } else if (breakType === 'LINE_BREAK' || breakType === 'EOL_SURE_SPACE') {
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
  async cleanup(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.initialized = false;
    }
  }
}

// Singleton instance
let visionServiceInstance: VisionOcrService | null = null;

export function getVisionService(): VisionOcrService {
  if (!visionServiceInstance) {
    visionServiceInstance = new VisionOcrService();
  }
  return visionServiceInstance;
}
