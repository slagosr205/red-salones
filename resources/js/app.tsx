import '../css/app.css';
import './bootstrap';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { createRoot } from 'react-dom/client';

import { toastSuccess, toastError } from './rc/toast';

import '@fontsource/inter/latin.css';
import '@fontsource/poppins/latin.css';
import '@fontsource/playfair-display/latin.css';

const theme = createTheme({
    palette: {
        primary: { main: '#BFA16B', contrastText: '#FFFFFF' },
        secondary: { main: '#0F4F63', contrastText: '#FFFFFF' },
        background: { default: '#E8DDD0', paper: '#F5F0E8' },
        text: { primary: '#082F3A' },
    },
    typography: {
        fontFamily: [
            'Poppins',
            'Inter',
            'Playfair Display',
            'system-ui',
            '-apple-system',
            'Segoe UI',
            'Roboto',
            'Arial',
            'sans-serif',
        ].join(','),
        h1: { fontFamily: 'Playfair Display, Poppins, Inter, serif', fontWeight: 800, letterSpacing: -1.2 },
        h2: { fontFamily: 'Playfair Display, Poppins, Inter, serif', fontWeight: 800, letterSpacing: -1.0 },
        h3: { fontFamily: 'Playfair Display, Poppins, Inter, serif', fontWeight: 800, letterSpacing: -0.9 },
        h4: { fontFamily: 'Playfair Display, Poppins, Inter, serif', fontWeight: 800, letterSpacing: -0.6 },
        h5: { fontWeight: 900, letterSpacing: -0.4 },
        h6: { fontWeight: 800, letterSpacing: -0.2 },
    },
    shape: {
        borderRadius: 12,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: 12,
                    fontWeight: 800,
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 18,
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow:
                        '0 18px 40px rgba(17, 24, 39, 0.08), 0 2px 10px rgba(17, 24, 39, 0.04)',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    borderRight: '1px solid rgba(0,0,0,0.08)',
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backdropFilter: 'saturate(180%) blur(10px)',
                },
            },
        },
    },
});

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

router.on('success', (event) => {
    const flash = event.detail.page.props.flash as
        | { success?: string; error?: string; status?: string }
        | undefined;
    if (flash?.success) toastSuccess(flash.success);
    if (flash?.error) toastError(flash.error);
    if (flash?.status) toastSuccess(flash.status);
});

router.on('error', (event) => {
    if (Object.keys(event.detail.errors).length === 0) {
        window.location.href = route('login');
    }
});

router.on('invalid', () => {
    window.location.href = route('login');
});

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <App {...props} />
            </ThemeProvider>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});
