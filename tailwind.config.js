/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sudoku: {
          blue: '#c8e4f8',      // matching the sample image's light blue checkerboard cells
          bluedark: '#a5d3f2',
          border: '#334155',
          thick: '#0f172a',
          given: '#0f172a',
          user: '#2563eb',
          highlight: '#e0f2fe',
          sameNum: '#bae6fd',
          error: '#fecdd3',
          errorText: '#e11d48'
        }
      }
    },
  },
  plugins: [],
}
