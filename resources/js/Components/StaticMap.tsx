import { Box } from '@mui/material';
import { useEffect, useRef } from 'react';

type Props = {
    latitude: number | string;
    longitude: number | string;
};

export default function StaticMap({ latitude, longitude }: Props) {
    const mapRef = useRef<HTMLDivElement>(null);
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const init = async () => {
            const L = await loadLeaflet();
            if (!mapRef.current) return;

            const lat = Number(latitude);
            const lng = Number(longitude);

            const map = L.map(mapRef.current, {
                center: [lat, lng],
                zoom: 15,
                zoomControl: false,
                scrollWheelZoom: false,
                dragging: false,
                attributionControl: false,
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
            }).addTo(map);

            L.marker([lat, lng]).addTo(map);
        };

        init();
    }, [latitude, longitude]);

    return (
        <Box
            ref={mapRef}
            sx={{
                width: '100%',
                height: 280,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                overflow: 'hidden',
                '& .leaflet-container': { width: '100%', height: '100%' },
            }}
        />
    );
}

async function loadLeaflet(): Promise<any> {
    if ((window as any).L) return (window as any).L;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => resolve((window as any).L);
        document.body.appendChild(script);
    });
}
