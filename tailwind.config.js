import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                brand: {
                    gold: '#BFA16B',
                    'gold-dark': '#8C7347',
                    blue: '#0F4F63',
                    'blue-dark': '#082F3A',
                    beige: '#E8DDD0',
                    ivory: '#F5F0E8',
                },
            },
        },
    },

    plugins: [forms],
};
