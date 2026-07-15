import { Box, Typography } from '@mui/material';
import { useEffect, useRef } from 'react';

type Props = {
    latitude: number | null;
    longitude: number | null;
    onChange: (lat: number, lng: number) => void;
};

const HONDURAS_CENTER: [number, number] = [14.5, -86.5];

export default function LocationPicker({ latitude, longitude, onChange }: Props) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const leafletRef = useRef<any>(null);

    useEffect(() => {
        if (mapInstanceRef.current) return;

        const initMap = async () => {
            const L = await loadLeaflet();
            leafletRef.current = L;

            if (!mapRef.current) return;

            const map = L.map(mapRef.current, {
                center: latitude && longitude ? [latitude, longitude] : HONDURAS_CENTER,
                zoom: 13,
                attributionControl: false,
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
            }).addTo(map);

            if (latitude && longitude) {
                markerRef.current = L.marker([latitude, longitude], { draggable: true }).addTo(map);
                markerRef.current.on('dragend', () => {
                    const pos = markerRef.current.getLatLng();
                    onChange(pos.lat, pos.lng);
                });
            }

            map.on('click', (e: any) => {
                const { lat, lng } = e.latlng;
                if (markerRef.current) {
                    markerRef.current.setLatLng([lat, lng]);
                } else {
                    markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map);
                    markerRef.current.on('dragend', () => {
                        const pos = markerRef.current.getLatLng();
                        onChange(pos.lat, pos.lng);
                    });
                }
                onChange(lat, lng);
            });

            mapInstanceRef.current = map;
        };

        initMap();

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!mapInstanceRef.current || !leafletRef.current) return;
        const L = leafletRef.current;
        if (latitude != null && longitude != null) {
            mapInstanceRef.current.setView([latitude, longitude], mapInstanceRef.current.getZoom());
            if (markerRef.current) {
                markerRef.current.setLatLng([latitude, longitude]);
            } else {
                markerRef.current = L.marker([latitude, longitude], { draggable: true }).addTo(mapInstanceRef.current);
                markerRef.current.on('dragend', () => {
                    const pos = markerRef.current.getLatLng();
                    onChange(pos.lat, pos.lng);
                });
            }
        }
    }, [latitude, longitude]);

    return (
        <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                Punto de entrega — haz clic en el mapa para marcar la ubicacion
            </Typography>
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
        </Box>
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
