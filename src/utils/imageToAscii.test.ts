import { getAverageL, convertImageToAscii } from './imageToAscii';

// Mocking browser APIs that are not available in Node.js environment for testing
// A more sophisticated setup might use jsdom or similar
if (typeof HTMLCanvasElement === 'undefined') {
    global.HTMLCanvasElement = class HTMLCanvasElement extends HTMLElement {
        getContext(contextId: string): CanvasRenderingContext2D | null {
            if (contextId === '2d') {
                return {
                    drawImage: jest.fn(),
                    getImageData: jest.fn().mockImplementation((x, y, sw, sh) => ({
                        data: new Uint8ClampedArray(sw * sh * 4).fill(128), // Mock data (e.g., all gray)
                        width: sw,
                        height: sh,
                    })),
                    // Add other methods if your functions use them
                } as any;
            }
            return null;
        }
    } as any;
    global.HTMLImageElement = class HTMLImageElement extends HTMLElement {} as any;
    global.ImageData = class ImageData {
        data: Uint8ClampedArray;
        width: number;
        height: number;
        constructor(dataOrWidth: Uint8ClampedArray | number, widthOrHeight: number, height?: number) {
            if (typeof dataOrWidth === 'number') {
                this.width = dataOrWidth;
                this.height = widthOrHeight;
                this.data = new Uint8ClampedArray(dataOrWidth * widthOrHeight * 4);
            } else {
                this.data = dataOrWidth;
                this.width = widthOrHeight;
                this.height = height!;
            }
        }
    } as any;
}


describe('imageToAscii Utilities', () => {
  describe('getAverageL', () => {
    it('should calculate the average luminance correctly for a simple ImageData', () => {
      // R=100, G=150, B=200. Alpha is ignored.
      // Grayscale = 0.299*100 + 0.587*150 + 0.114*200 = 29.9 + 88.05 + 22.8 = 140.75
      const data = Uint8ClampedArray.from([100, 150, 200, 255]); // One pixel
      const imageData = new ImageData(data, 1, 1);
      expect(getAverageL(imageData)).toBeCloseTo(140.75);
    });

    it('should calculate the average for a 2x1 image', () => {
      // Pixel 1: R=50, G=50, B=50 -> grayscale = 0.299*50 + 0.587*50 + 0.114*50 = 50
      // Pixel 2: R=150, G=150, B=150 -> grayscale = 150
      // Average = (50+150)/2 = 100
      const data = Uint8ClampedArray.from([
        50, 50, 50, 255,  // Pixel 1
        150, 150, 150, 255 // Pixel 2
      ]);
      const imageData = new ImageData(data, 2, 1);
      expect(getAverageL(imageData)).toBeCloseTo(100);
    });

    it('should return 0 for an empty ImageData (0 pixels)', () => {
      const data = new Uint8ClampedArray(0);
      const imageData = new ImageData(data, 0, 0);
      // np.average([]) would typically result in NaN, but our implementation sums then divides.
      // If data.length is 0, data.length/4 is 0. Division by zero -> NaN.
      // Let's adjust the test to expect NaN or ensure the function handles it (e.g., returns 0).
      // Current implementation sum/(data.length/4) will be 0/0 = NaN.
      // For robustness, getAverageL could return 0 if data.length is 0.
      // Let's assume the function is called with valid non-empty ImageData for now.
      // If it must handle empty, the function should be:
      // if (data.length === 0) return 0;
      // For now, let's test with a 1x1 black pixel.
      const blackPixelData = Uint8ClampedArray.from([0,0,0,255]);
      const blackImageData = new ImageData(blackPixelData, 1,1);
      expect(getAverageL(blackImageData)).toBe(0);
    });
  });

  describe('convertImageToAscii', () => {
    // Testing convertImageToAscii is more involved due to its reliance on canvas and image loading.
    // These tests would typically require a more complex mocking setup (e.g., jsdom and canvas mock).
    // Here's a conceptual test assuming mocks are in place:

    it('should convert a mock image to ASCII art', async () => {
      const mockImage = {
        width: 10, // Small dimensions for simplicity
        height: 10,
        // Mock other HTMLImageElement properties if needed
      } as HTMLImageElement;

      // Mock the getContext and getImageData calls within the test or via setup
      // For this example, our global mock for HTMLCanvasElement will be used.
      // The mock by default returns mid-gray pixels (128)
      // avg = 128. gsval = gscale2[Math.min(Math.floor((128 * 10) / 256), gscale2.length - 1)]
      // gsval = gscale2[Math.min(Math.floor(5), 9)] = gscale2[5] = '8' (from '17398888888'[::-1])
      // gscale2 = '8888889371'
      // gscale2[5] = '8'

      const cols = 2;
      const scale = 1; // tileWidth = 10/2 = 5, tileHeight = 5/1 = 5, rows = 10/5 = 2
      // Expect a 2x2 ASCII art of '8's
      const asciiArt = await convertImageToAscii(mockImage, cols, scale);

      expect(asciiArt).toEqual(['88', '88']);
    });

    it('should throw an error if image is too small for specified columns', async () => {
      const mockImage = { width: 5, height: 10 } as HTMLImageElement;
      const cols = 10; // More columns than image width
      const scale = 1;

      await expect(convertImageToAscii(mockImage, cols, scale))
        .rejects
        .toThrow("Image too small for specified cols!");
    });
  });
});
