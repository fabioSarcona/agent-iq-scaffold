import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
        extend: {
          fontFamily: {
            sans: [
              "Inter",
              "-apple-system",
              "BlinkMacSystemFont",
              "Segoe UI",
              "Roboto",
              "Oxygen",
              "Ubuntu",
              "Cantarell",
              "Fira Sans",
              "Droid Sans",
              "Helvetica Neue",
              "sans-serif",
            ],
          },
          fontSize: {
            xs: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.025em' }],
            sm: ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.025em' }],
            base: ['1rem', { lineHeight: '1.5rem', letterSpacing: '0' }],
            lg: ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.025em' }],
            xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.025em' }],
            '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.025em' }],
            '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.05em' }],
            '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.05em' }],
          },
          fontWeight: {
            light: '300',
            normal: '400',
            medium: '500',
            semibold: '600',
            bold: '700',
          },
          spacing: {
            xs: 'var(--space-xs)',
            sm: 'var(--space-sm)', 
            base: 'var(--space-base)',
            lg: 'var(--space-lg)',
            xl: 'var(--space-xl)',
            '2xl': 'var(--space-2xl)',
            '3xl': 'var(--space-3xl)',
          },
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				brand: {
					primary: 'hsl(var(--brand-primary))',
					secondary: 'hsl(var(--brand-secondary))',
					tertiary: 'hsl(var(--brand-tertiary))'
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				'chat-bubble': {
					user: 'hsl(var(--chat-bubble-user))',
					bot: 'hsl(var(--chat-bubble-bot))',
					'user-text': 'hsl(var(--chat-bubble-user-text))',
					'bot-text': 'hsl(var(--chat-bubble-bot-text))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
          keyframes: {
            'accordion-down': {
              from: {
                height: '0'
              },
              to: {
                height: 'var(--radix-accordion-content-height)'
              }
            },
            'accordion-up': {
              from: {
                height: 'var(--radix-accordion-content-height)'
              },
              to: {
                height: '0'
              }
            },
            'scale-in': {
              '0%': { transform: 'scale(0)', opacity: '0' },
              '100%': { transform: 'scale(1)', opacity: '1' }
            },
            'fade-up': {
              '0%': { transform: 'translateY(10px)', opacity: '0' },
              '100%': { transform: 'translateY(0)', opacity: '1' }
            }
          },
          animation: {
            'accordion-down': 'accordion-down 0.2s ease-out',
            'accordion-up': 'accordion-up 0.2s ease-out',
            'scale-in': 'scale-in 0.2s ease-out',
            'fade-up': 'fade-up 0.3s ease-out'
          }
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
