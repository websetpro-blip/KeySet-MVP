/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}',
	],
	theme: {
		extend: {
			colors: {
				gray: {
					50: '#F9FAFB',
					100: '#F3F4F6',
					200: '#E5E7EB',
					300: '#D1D5DB',
					400: '#9CA3AF',
					500: '#6B7280',
					600: '#4B5563',
					700: '#374151',
					800: '#1F2937',
					900: '#111827',
				},
				blue: {
					50: '#EFF6FF',
					100: '#DBEAFE',
					300: '#93C5FD',
					500: '#3B82F6',
					600: '#2563EB',
					700: '#1D4ED8',
				},
				success: {
					100: '#D1FAE5',
					400: '#34D399',
					500: '#10B981',
				},
				warning: {
					100: '#FEF3C7',
					400: '#FBBF24',
					500: '#F59E0B',
				},
				error: {
					100: '#FEE2E2',
					300: '#FCA5A5',
					400: '#F87171',
					500: '#EF4444',
					600: '#DC2626',
				},
			},
			fontFamily: {
				sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
				mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'Courier New', 'monospace'],
			},
			fontSize: {
				xs: ['11px', '16px'],
				sm: ['13px', '18px'],
				base: ['14px', '20px'],
				md: ['15px', '22px'],
				lg: ['16px', '24px'],
			},
			spacing: {
				'1': '4px',
				'2': '8px',
				'3': '12px',
				'4': '16px',
				'5': '20px',
				'6': '24px',
				'8': '32px',
			},
			borderRadius: {
				none: '0px',
				sm: '4px',
				md: '6px',
				lg: '8px',
			},
			boxShadow: {
				xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
				sm: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
				md: '0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06)',
				lg: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
				inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
			},
			transitionDuration: {
				fast: '150ms',
				base: '200ms',
				slow: '300ms',
			},
			transitionTimingFunction: {
				default: 'cubic-bezier(0.4, 0, 0.2, 1)',
				in: 'cubic-bezier(0.4, 0, 1, 1)',
				out: 'cubic-bezier(0, 0, 0.2, 1)',
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
}
