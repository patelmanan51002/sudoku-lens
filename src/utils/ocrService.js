import { createWorker } from 'tesseract.js';

let workerPromise = null;

/**
 * Initializes and returns a cached Tesseract worker configured for single digits
 */
async function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = await createWorker('eng');
      await worker.setParameters({
        tessedit_char_whitelist: '123456789',
        tessedit_pageseg_mode: '10', // Treat image as a single character
      });
      return worker;
    })();
  }
  return workerPromise;
}

/**
 * Recognizes digits across 81 sliced cell canvases
 * Calls onProgress(percent, currentCellIndex)
 */
export async function recognizeSudokuGrid(extractedData, onProgress = () => {}) {
  const { cells } = extractedData;
  const grid = Array.from({ length: 9 }, () => Array(9).fill(0));

  let worker = null;
  try {
    worker = await getWorker();
  } catch (err) {
    console.warn('Tesseract worker initialization issue, falling back to manual review', err);
  }

  let totalProcessed = 0;
  const totalCells = 81;

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cell = cells[r][c];

      if (cell.hasContent && worker) {
        try {
          const ret = await worker.recognize(cell.canvas);
          const raw = ret.data.text.trim();
          const match = raw.match(/[1-9]/);
          if (match) {
            grid[r][c] = parseInt(match[0], 10);
          }
        } catch (e) {
          console.warn(`OCR failed for cell [${r}, ${c}]:`, e);
        }
      }

      totalProcessed++;
      onProgress(Math.round((totalProcessed / totalCells) * 100), totalProcessed);
    }
  }

  return grid;
}

/**
 * Terminate worker if needed
 */
export async function terminateWorker() {
  if (workerPromise) {
    const worker = await workerPromise;
    await worker.terminate();
    workerPromise = null;
  }
}
