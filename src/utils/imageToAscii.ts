// Globals, similar to the Python version
const gscale2 = '17398888888'.split('').reverse().join(''); // 10 levels of gray

/**
 * Given an ImageData object, return the average grayscale value.
 */
export function getAverageL(imageData: ImageData): number {
  const data = imageData.data;
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    // Assuming RGB, alpha - convert to grayscale
    // Using a common formula: 0.299*R + 0.587*G + 0.114*B
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    sum += 0.299 * r + 0.587 * g + 0.114 * b;
  }
  return sum / (data.length / 4);
}

/**
 * Converts an image to ASCII art.
 * @param image The HTMLImageElement to convert.
 * @param cols The number of columns in the ASCII art.
 * @param scale The scale factor for the height of the tiles.
 * @returns A string representing the ASCII art.
 */
export async function convertImageToAscii(
  image: HTMLImageElement,
  cols: number,
  scale: number,
): Promise<string[]> {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Could not get 2D rendering context for canvas.');
  }

  const W = image.width;
  const H = image.height;
  console.log(`input image dims: ${W} x ${H}`);

  canvas.width = W;
  canvas.height = H;
  context.drawImage(image, 0, 0, W, H);

  const tileWidth = W / cols;
  const tileHeight = tileWidth / scale;
  const rows = Math.floor(H / tileHeight);

  console.log(`cols: ${cols}, rows: ${rows}`);
  console.log(`tile dims: ${tileWidth} x ${tileHeight}`);

  if (cols > W || rows > H) {
    console.error("Image too small for specified cols!");
    // In a React app, we'd typically handle this by showing an error to the user
    // For now, let's return an empty array or throw an error.
    throw new Error("Image too small for specified cols!");
  }

  const aimg: string[] = [];

  for (let j = 0; j < rows; j++) {
    const y1 = Math.floor(j * tileHeight);
    let y2 = Math.floor((j + 1) * tileHeight);

    if (j === rows - 1) {
      y2 = H;
    }

    aimg.push("");

    for (let i = 0; i < cols; i++) {
      const x1 = Math.floor(i * tileWidth);
      let x2 = Math.floor((i + 1) * tileWidth);

      if (i === cols - 1) {
        x2 = W;
      }

      // Get image data for the tile
      // Note: createImageData is more direct if we don't need to draw the sub-image
      // However, getImageData is simpler here as we are "cropping" from the main canvas
      const tileImageData = context.getImageData(x1, y1, x2 - x1, y2 - y1);

      const avg = Math.floor(getAverageL(tileImageData));

      // Look up ASCII char
      // The gscale2 string has 10 characters, so we map avg (0-255) to an index (0-9)
      const gsval = gscale2[Math.min(Math.floor((avg * 10) / 256), gscale2.length - 1)];
      aimg[j] += gsval;
    }
  }
  return aimg;
}
