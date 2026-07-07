import {
    AppBar,
    Badge,
    Box,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Popover,
    Toolbar,
    Typography,
    useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    Assessment,
    CloudUpload,
    Groups,
    Inventory2,
    LocalShipping,
    Logout,
    Menu as MenuIcon,
    Notifications,
    Settings,
    ShoppingCart,
    Storefront,
    WorkspacePremium,
} from '@mui/icons-material';
import { Link, router, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useEffect, useMemo, useState } from 'react';

import { cartCount } from '@/rc/cart';
import { getNotifications, removeNotification, type Notification } from '@/rc/notifications';
import { RcRole } from '@/rc/role';

const drawerWidth = 280;

type NavItem = {
    key: string;
    label: string;
    href: string;
    icon: ReactNode;
    active: boolean;
};

const routeMap: Record<string, string> = {
    dashboard: '/dashboard',
    'rc.products': '/rc/productos',
    'rc.cart': '/rc/carrito',
    'rc.points': '/rc/puntos',
    'rc.redeem': '/rc/canjes',
    'rc.benefits': '/rc/beneficios',
    'rc.promotions': '/rc/promociones',
    'rc.network': '/rc/red-comercial',
    'rc.orders': '/rc/pedidos',
    'rc.reports': '/rc/reportes',
    'rc.pending': '/rc/pendientes',
    'rc.articles': '/rc/articulos',
    'rc.masterclasses': '/rc/master-classes',
    'rc.inventory': '/rc/inventario',
    'rc.bulk-upload': '/rc/carga-masiva',
    'rc.settings': '/rc/configuracion',
    'rc.pos': '/rc/pos',
    'rc.zones': '/rc/zonas',
};

function useNav(role: RcRole): NavItem[] {
    return useMemo(() => {
        const path = window.location.pathname;
        const isActive = (name: string) => path.startsWith(routeMap[name] ?? '/__missing__');
        const items: NavItem[] = [
            {
                key: 'dashboard',
                label: 'Dashboard',
                href: '/dashboard',
                icon: <Storefront fontSize="small" />,
                active: isActive('dashboard'),
            },
        ];

        if (role === 'salon' || role === 'lider') {
            items.push(
                {
                    key: 'products',
                    label: 'Comprar',
                    href: '/rc/productos',
                    icon: <Storefront fontSize="small" />,
                    active: isActive('rc.products'),
                },
                {
                    key: 'cart',
                    label: 'Carrito',
                    href: '/rc/carrito',
                    icon: <ShoppingCart fontSize="small" />,
                    active: isActive('rc.cart'),
                },
            );
        }

        if (role === 'lider' || role === 'admin') {
            items.push(
                {
                    key: 'orders',
                    label: 'Pedidos',
                    href: '/rc/pedidos',
                    icon: <LocalShipping fontSize="small" />,
                    active: isActive('rc.orders'),
                },
                {
                    key: 'points',
                    label: 'Mis Puntos',
                    href: '/rc/puntos',
                    icon: <WorkspacePremium fontSize="small" />,
                    active: isActive('rc.points'),
                },
                {
                    key: 'redeem',
                    label: 'Canjes',
                    href: '/rc/canjes',
                    icon: <WorkspacePremium fontSize="small" />,
                    active: isActive('rc.redeem'),
                },
            );
        }

        if (role === 'admin') {
            items.push({
                key: 'pos',
                label: 'POS',
                href: '/rc/pos',
                icon: <Storefront fontSize="small" />,
                active: isActive('rc.pos'),
            });
            items.push({
                key: 'benefits',
                label: 'Beneficios',
                href: '/rc/beneficios',
                icon: <WorkspacePremium fontSize="small" />,
                active: isActive('rc.benefits'),
            });
            items.push({
                key: 'promotions',
                label: 'Promociones',
                href: '/rc/promociones',
                icon: <WorkspacePremium fontSize="small" />,
                active: isActive('rc.promotions'),
            });
            items.push({
                key: 'articles',
                label: 'Artículos',
                href: '/rc/articulos',
                icon: <WorkspacePremium fontSize="small" />,
                active: isActive('rc.articles'),
            });
        }

        if (role === 'lider' || role === 'admin') {
            items.push(
                {
                    key: 'network',
                    label: 'Red Comercial',
                    href: '/rc/red-comercial',
                    icon: <Groups fontSize="small" />,
                    active: isActive('rc.network'),
                },
                {
                    key: 'reports',
                    label: 'Reportes',
                    href: '/rc/reportes',
                    icon: <Assessment fontSize="small" />,
                    active: isActive('rc.reports'),
                },
                {
                    key: 'pending',
                    label: 'Pendientes',
                    href: '/rc/pendientes',
                    icon: <Notifications fontSize="small" />,
                    active: isActive('rc.pending'),
                },
            );
        }

        if (role === 'salon' || role === 'lider' || role === 'admin') {
            items.push({
                key: 'masterclasses',
                label: 'Master Classes',
                href: '/rc/master-classes',
                icon: <Groups fontSize="small" />,
                active: isActive('rc.masterclasses'),
            });
        }

        if (role === 'admin') {
            items.push({
                key: 'inventory',
                label: 'Inventario',
                href: '/rc/inventario',
                icon: <Inventory2 fontSize="small" />,
                active: isActive('rc.inventory'),
            });
            items.push({
                key: 'bulk-upload',
                label: 'Carga Masiva',
                href: '/rc/carga-masiva',
                icon: <CloudUpload fontSize="small" />,
                active: isActive('rc.bulk-upload'),
            });
        }

        if (role === 'admin') {
            items.push({
                key: 'zones',
                label: 'Zonas',
                href: '/rc/zonas',
                icon: <Groups fontSize="small" />,
                active: isActive('rc.zones'),
            });
            items.push({
                key: 'settings',
                label: 'Configuracion',
                href: '/rc/configuracion',
                icon: <Settings fontSize="small" />,
                active: isActive('rc.settings'),
            });
        }

        return items;
    }, [role]);
}

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const user = usePage().props.auth.user;
    const userRole: RcRole = user.role ?? 'salon';
    const userId = user.id;
    const role = userRole;
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const navItems = useNav(role);

    const [notifications, setNotifications] = useState<Notification[]>(() => getNotifications(userId));
    const [mobileOpen, setMobileOpen] = useState(false);
    const [accountAnchor, setAccountAnchor] = useState<null | HTMLElement>(null);
    const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);

    useEffect(() => {
        const onChange = () => setNotifications(getNotifications(userId));
        window.addEventListener('rc_notifications_changed', onChange);
        return () => window.removeEventListener('rc_notifications_changed', onChange);
    }, []);

    const cartItems = cartCount();

    const drawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ px: 2.5, pt: 8, pb: 3 }}>
                <Box
                    component="img"
                    src="/storage/logo.png"
                    alt="Logo"
                    sx={{
                        height: 120,
                        width: 'auto',
                        display: 'block',
                    }}
                />
                <Typography variant="body2" color="text.secondary">
                    {role === 'admin'
                        ? 'Administrador'
                        : role === 'lider'
                          ? 'Lider'
                          : 'Salon'}
                </Typography>
            </Box>

            <Divider />

            <List sx={{ px: 1, py: 1 }}>
                {navItems.map((item) => (
                    <ListItemButton
                        key={item.key}
                        component={Link}
                        href={item.href}
                        onClick={() => {
                            if (isMobile) setMobileOpen(false);
                        }}
                        selected={item.active}
                        sx={{ borderRadius: 2 }}
                    >
                        <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.label} />
                    </ListItemButton>
                ))}
            </List>

            <Box sx={{ mt: 'auto', px: 2, py: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                    Sesion: {user.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                    {user.email}
                </Typography>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    zIndex: (t) => t.zIndex.drawer + 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                }}
            >
                <Toolbar sx={{ gap: 1.5 }}>
                    {isMobile && (
                        <IconButton
                            edge="start"
                            onClick={() => setMobileOpen(true)}
                            aria-label="abrir menu"
                        >
                            <MenuIcon />
                        </IconButton>
                    )}

                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        {typeof header === 'string' ? (
                            <Typography variant="h6" noWrap sx={{ fontWeight: 700 }}>
                                {header}
                            </Typography>
                        ) : (
                            header
                        )}
                    </Box>

                    <IconButton
                        aria-label="notificaciones"
                        onClick={(e) => setNotifAnchor(e.currentTarget)}
                    >
                        <Badge badgeContent={notifications.length} color="secondary">
                            <Notifications />
                        </Badge>
                    </IconButton>

                    <Popover
                        anchorEl={notifAnchor}
                        open={Boolean(notifAnchor)}
                        onClose={() => setNotifAnchor(null)}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        slotProps={{ paper: { sx: { width: 340, maxHeight: 360 } } }}
                    >
                        <Box sx={{ px: 2, py: 1.5 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                Notificaciones
                            </Typography>
                        </Box>
                        <Divider />
                        {notifications.map((n: Notification) => (
                            <Box
                                key={n.id}
                                sx={{
                                    px: 2,
                                    py: 1.5,
                                    cursor: 'pointer',
                                    '&:hover': { bgcolor: 'action.hover' },
                                }}
                                onClick={() => removeNotification(userId, n.id)}
                            >
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {n.message}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {n.time}
                                </Typography>
                            </Box>
                        ))}
                    </Popover>

                    {(role === 'salon' || role === 'lider') && (
                        <IconButton
                            aria-label="carrito"
                            onClick={() => router.visit(route('rc.cart'))}
                        >
                            <Badge badgeContent={cartItems} color="primary">
                                <ShoppingCart />
                            </Badge>
                        </IconButton>
                    )}

                    <IconButton
                        aria-label="cuenta"
                        onClick={(e) => setAccountAnchor(e.currentTarget)}
                    >
                        <Box
                            sx={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                bgcolor: 'primary.main',
                                color: 'primary.contrastText',
                                display: 'grid',
                                placeItems: 'center',
                                fontWeight: 800,
                                fontSize: 13,
                            }}
                        >
                            {String(user.name || 'U')
                                .trim()
                                .slice(0, 1)
                                .toUpperCase()}
                        </Box>
                    </IconButton>
                    <Menu
                        anchorEl={accountAnchor}
                        open={Boolean(accountAnchor)}
                        onClose={() => setAccountAnchor(null)}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    >
                        <MenuItem
                            component={Link}
                            href={route('profile.edit')}
                            onClick={() => setAccountAnchor(null)}
                        >
                            Perfil
                        </MenuItem>
                        <Divider />
                        <MenuItem
                            onClick={() => {
                                setAccountAnchor(null);
                                router.post(route('logout'));
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 36 }}>
                                <Logout fontSize="small" />
                            </ListItemIcon>
                            Cerrar sesion
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            <Box
                component="nav"
                sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
            >
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={() => setMobileOpen(false)}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        '& .MuiDrawer-paper': { width: drawerWidth },
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', md: 'block' },
                        '& .MuiDrawer-paper': {
                            width: drawerWidth,
                            boxSizing: 'border-box',
                            borderRightColor: 'divider',
                        },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    width: { md: `calc(100% - ${drawerWidth}px)` },
                    pt: 10,
                    px: { xs: 2, sm: 3 },
                    pb: 4,
                }}
            >
                {children}
            </Box>
        </Box>
    );
}
