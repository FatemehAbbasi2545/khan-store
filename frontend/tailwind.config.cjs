module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ruby: {
          DEFAULT: '#6B1030',
          deep: '#45091F',
          light: '#8C1C41',
        },
        bronze: {
          DEFAULT: '#A9762C',
          light: '#C99A55',
        },
        navy: {
          DEFAULT: '#1F3A5F',
          light: '#2E4F7A',
        },
        ivory: {
          DEFAULT: '#F7EFE2',
          deep: '#EEE1C8',
        },
        ink: {
          DEFAULT: '#241512',
          soft: '#4E3F38',
        },
      },
      fontFamily: {
        display: ['var(--font-aref)', 'serif'],
        body: ['var(--font-vazir)', 'sans-serif'],
      },
      borderRadius: {
        sm: '4px',
        md: '10px',
      },
    },
  },
  plugins: [],
};
