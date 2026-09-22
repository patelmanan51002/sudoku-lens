// HTML5 Canvas based image processing for Sudoku grid extraction

/**
 * Loads an image from a File, Blob, or URL into an HTMLImageElement
 */
export function loadImage(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Failed to load image: ' + err));

    if (typeof source === 'string') {
      img.src = source;
    } else if (source instanceof File || source instanceof Blob) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(source);
    } else {
      reject(new Error('Unsupported image source'));
    }
  });
}

/**
 * Preprocesses and finds the outer grid bounding box in an image
 */
export function findGridBoundingBox(ctx, width, height) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Compute row and column dark pixel densities or variance
  const rowDark = new Float32Array(height);
  const colDark = new Float32Array(width);

  for (let y = 0; y < height; y++) {
    let darkCount = 0;
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      // luminance
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum < 160) {
        darkCount++;
      }
    }
    rowDark[y] = darkCount;
  }

  for (let x = 0; x < width; x++) {
    let darkCount = 0;
    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum < 160) {
        darkCount++;
      }
    }
    colDark[x] = darkCount;
  }

  // Find bounds with significant dark pixels (lines or numbers)
  const rowThresh = width * 0.05;
  const colThresh = height * 0.05;

  let top = 0;
  while (top < height && rowDark[top] < rowThresh) top++;
  let bottom = height - 1;
  while (bottom > top && rowDark[bottom] < rowThresh) bottom--;

  let left = 0;
  while (left < width && colDark[left] < colThresh) left++;
  let right = width - 1;
  while (right > left && colDark[right] < colThresh) right--;

  // Fallback if not detected properly
  if (bottom - top < height * 0.5 || right - left < width * 0.5) {
    return { x: 0, y: 0, width, height };
  }

  // Add slight margin / clamp
  const gridWidth = right - left;
  const gridHeight = bottom - top;

  return {
    x: Math.max(0, left),
    y: Math.max(0, top),
    width: gridWidth,
    height: gridHeight
  };
}

/**
 * Checks if the grid features alternating shaded blocks (e.g. blue checkerboard)
 */
export function detectCheckerboard(ctx, bbox) {
  try {
    const cellW = bbox.width / 9;
    const cellH = bbox.height / 9;

    // Check center of Box 0 (r=1, c=1) vs center of Box 1 (r=1, c=4)
    const getAvgColor = (r, c) => {
      const cx = Math.floor(bbox.x + (c + 0.5) * cellW);
      const cy = Math.floor(bbox.y + (r + 0.5) * cellH);
      const pixel = ctx.getImageData(cx, cy, 1, 1).data;
      return { r: pixel[0], g: pixel[1], b: pixel[2] };
    };

    const c0 = getAvgColor(1, 1);
    const c1 = getAvgColor(1, 4);

    // If box 0 has distinct blue tint (b > r + 15) and box 1 is white or different
    const isBlueTint = (c) => c.b > c.r + 15 && c.b > 180;
    if (isBlueTint(c0) !== isBlueTint(c1)) {
      return true;
    }
  } catch (e) {
    // ignore
  }
  return true; // default true for clean styling
}

/**
 * Extracts 81 cell canvas images from the main image
 */
export async function extractCells(img) {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);

  const bbox = findGridBoundingBox(ctx, img.width, img.height);
  const cellW = bbox.width / 9;
  const cellH = bbox.height / 9;
  const hasCheckerboard = detectCheckerboard(ctx, bbox);

  const cells = [];

  for (let r = 0; r < 9; r++) {
    const row = [];
    for (let c = 0; c < 9; c++) {
      const cellCanvas = document.createElement('canvas');
      const targetSize = 64;
      cellCanvas.width = targetSize;
      cellCanvas.height = targetSize;
      const cellCtx = cellCanvas.getContext('2d', { willReadFrequently: true });

      // Crop inside the cell with 12% margin to eliminate border lines
      const padX = cellW * 0.12;
      const padY = cellH * 0.12;
      const sx = bbox.x + c * cellW + padX;
      const sy = bbox.y + r * cellH + padY;
      const sw = cellW - padX * 2;
      const sh = cellH - padY * 2;

      // Fill white background first
      cellCtx.fillStyle = '#ffffff';
      cellCtx.fillRect(0, 0, targetSize, targetSize);

      // Draw cropped cell
      cellCtx.drawImage(canvas, sx, sy, sw, sh, 0, 0, targetSize, targetSize);

      // Binarize and enhance contrast for OCR
      const cellData = cellCtx.getImageData(0, 0, targetSize, targetSize);
      const d = cellData.data;
      let minLum = 255;
      let maxLum = 0;

      // First pass: find luminance range
      for (let i = 0; i < d.length; i += 4) {
        const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        if (lum < minLum) minLum = lum;
        if (lum > maxLum) maxLum = lum;
      }

      // Check if cell has meaningful dark stroke content (is not completely blank)
      const hasContent = (maxLum - minLum > 60) && (minLum < 120);

      if (hasContent) {
        // High-contrast binarization: digit strokes -> solid black, background -> pure white
        const threshold = minLum + (maxLum - minLum) * 0.45;
        for (let i = 0; i < d.length; i += 4) {
          const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          const val = lum < threshold ? 0 : 255;
          d[i] = val;
          d[i + 1] = val;
          d[i + 2] = val;
          d[i + 3] = 255;
        }
        cellCtx.putImageData(cellData, 0, 0);
      }

      row.push({
        r,
        c,
        canvas: cellCanvas,
        hasContent,
        dataUrl: cellCanvas.toDataURL()
      });
    }
    cells.push(row);
  }

  return {
    bbox,
    cells,
    hasCheckerboard,
    originalCanvas: canvas
  };
}
