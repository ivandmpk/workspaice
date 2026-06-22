/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./src/renderer/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        workspaice: {
          // Tint colors
          tint: {
            primary: 'var(--workspaice-tint-primary)',
            secondary: 'var(--workspaice-tint-secondary)',
            tertiary: 'var(--workspaice-tint-tertiary)',
            white: 'var(--workspaice-tint-white)',
            black: 'var(--workspaice-tint-black)',
            gray: 'var(--workspaice-tint-gray)',
            disabled: 'var(--workspaice-tint-disabled)',
            brand: 'var(--workspaice-tint-brand)',
            placeholder: 'var(--workspaice-tint-placeholder)',
            error: 'var(--workspaice-tint-error)',
            'error-disabled': 'var(--workspaice-tint-error-disabled)',
            warning: 'var(--workspaice-tint-warning)',
            success: 'var(--workspaice-tint-success)',
          },

          // Border colors
          border: {
            primary: 'var(--workspaice-border-primary)',
            secondary: 'var(--workspaice-border-secondary)',
            warning: 'var(--workspaice-border-warning)',
            error: 'var(--workspaice-border-error)',
            success: 'var(--workspaice-border-success)',
            brand: 'var(--workspaice-border-brand)',
          },

          // Background colors
          background: {
            primary: 'var(--workspaice-background-primary)',
            'primary-hover': 'var(--workspaice-background-primary-hover)',
            secondary: 'var(--workspaice-background-secondary)',
            'secondary-hover': 'var(--workspaice-background-secondary-hover)',
            tertiary: 'var(--workspaice-background-tertiary)',
            'tertiary-hover': 'var(--workspaice-background-tertiary-hover)',
            disabled: 'var(--workspaice-background-disabled)',

            // Brand
            'brand-primary': 'var(--workspaice-background-brand-primary)',
            'brand-primary-hover': 'var(--workspaice-background-brand-primary-hover)',
            'brand-secondary': 'var(--workspaice-background-brand-secondary)',
            'brand-secondary-hover': 'var(--workspaice-background-brand-secondary-hover)',

            // Gray
            'gray-primary': 'var(--workspaice-background-gray-primary)',
            'gray-primary-hover': 'var(--workspaice-background-gray-primary-hover)',
            'gray-secondary': 'var(--workspaice-background-gray-secondary)',
            'gray-secondary-hover': 'var(--workspaice-background-gray-secondary-hover)',

            // Success
            'success-primary': 'var(--workspaice-background-success-primary)',
            'success-primary-hover': 'var(--workspaice-background-success-primary-hover)',
            'success-secondary': 'var(--workspaice-background-success-secondary)',
            'success-secondary-hover': 'var(--workspaice-background-success-secondary-hover)',

            // Error
            'error-primary': 'var(--workspaice-background-error-primary)',
            'error-primary-hover': 'var(--workspaice-background-error-primary-hover)',
            'error-secondary': 'var(--workspaice-background-error-secondary)',
            'error-secondary-hover': 'var(--workspaice-background-error-secondary-hover)',

            // Warning
            'warning-primary': 'var(--workspaice-background-warning-primary)',
            'warning-primary-hover': 'var(--workspaice-background-warning-primary-hover)',
            'warning-secondary': 'var(--workspaice-background-warning-secondary)',
            'warning-secondary-hover': 'var(--workspaice-background-warning-secondary-hover)',

            // Mask
            'mask-overlay': 'var(--workspaice-background-mask-overlay)',
            'mask-lighten': 'var(--workspaice-background-mask-lighten)',
          },
        },
      },
      spacing: {
        none: 'var(--workspaice-spacing-none)',
        '3xs': 'var(--workspaice-spacing-3xs)',
        xxs: 'var(--workspaice-spacing-xxs)',
        xs: 'var(--workspaice-spacing-xs)',
        sm: 'var(--workspaice-spacing-sm)',
        md: 'var(--workspaice-spacing-md)',
        lg: 'var(--workspaice-spacing-lg)',
        xl: 'var(--workspaice-spacing-xl)',
        xxl: 'var(--workspaice-spacing-xxl)',
      },
      borderRadius: {
        none: 'var(--workspaice-radius-none)',
        xs: 'var(--workspaice-radius-xs)',
        sm: 'var(--workspaice-radius-sm)',
        md: 'var(--workspaice-radius-md)',
        lg: 'var(--workspaice-radius-lg)',
        xl: 'var(--workspaice-radius-xl)',
        xxl: 'var(--workspaice-radius-xxl)',
      },
      animation: {
        'fade-in': 'fadeIn 1s ease-out',
        flash: 'flash 0.5s ease-in-out 2',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        flash: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('tailwind-scrollbar')],
  corePlugins: {
    preflight: false,
  },
}
