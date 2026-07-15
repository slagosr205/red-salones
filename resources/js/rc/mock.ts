export type Product = {
    id: string;
    name: string;
    brand: string;
    category: string;
    price: number;
    leader_price?: number;
    public_price?: number;
    points: number;
};

export const products: Product[] = [
    {
        id: 'p-001',
        name: 'Shampoo Repair Pro 500ml',
        brand: 'KeraNova',
        category: 'Cabello',
        price: 320,
        leader_price: 260,
        public_price: 400,
        points: 25,
    },
    {
        id: 'p-002',
        name: 'Acondicionador Hidratacion 500ml',
        brand: 'KeraNova',
        category: 'Cabello',
        price: 295,
        leader_price: 235,
        public_price: 370,
        points: 22,
    },
    {
        id: 'p-003',
        name: 'Mascarilla Nutritiva 300g',
        brand: 'ColorLab',
        category: 'Cabello',
        price: 450,
        leader_price: 360,
        public_price: 560,
        points: 35,
    },
    {
        id: 'p-004',
        name: 'Oxidante 20 vol 1L',
        brand: 'ColorLab',
        category: 'Color',
        price: 180,
        leader_price: 145,
        public_price: 225,
        points: 12,
    },
    {
        id: 'p-005',
        name: 'Tinte Profesional 6.0',
        brand: 'ColorLab',
        category: 'Color',
        price: 160,
        leader_price: 130,
        public_price: 200,
        points: 10,
    },
    {
        id: 'p-006',
        name: 'Cera Depilatoria 1kg',
        brand: 'DermaSoft',
        category: 'Estetica',
        price: 520,
        leader_price: 420,
        public_price: 650,
        points: 40,
    },
    {
        id: 'p-007',
        name: 'Alcohol Gel 1L',
        brand: 'CleanPro',
        category: 'Higiene',
        price: 130,
        leader_price: 105,
        public_price: 165,
        points: 8,
    },
    {
        id: 'p-008',
        name: 'Guantes Nitrilo (100u)',
        brand: 'CleanPro',
        category: 'Higiene',
        price: 210,
        leader_price: 170,
        public_price: 265,
        points: 14,
    },
];

export type MasterClass = {
    id: string;
    title: string;
    instructor: string;
    date: string;
    modality: 'Virtual' | 'Presencial';
    seats: number;
    pointsRequired: number;
};

export const masterClasses: MasterClass[] = [
    {
        id: 'mc-001',
        title: 'Tecnicas Avanzadas de Colorimetria',
        instructor: 'Andrea Molina',
        date: '2026-06-20',
        modality: 'Virtual',
        seats: 120,
        pointsRequired: 500,
    },
    {
        id: 'mc-002',
        title: 'Corte Comercial Rapido',
        instructor: 'Luis Palma',
        date: '2026-06-28',
        modality: 'Presencial',
        seats: 35,
        pointsRequired: 300,
    },
    {
        id: 'mc-003',
        title: 'Diagnostico Capilar y Tratamientos',
        instructor: 'Diana Reyes',
        date: '2026-07-05',
        modality: 'Virtual',
        seats: 200,
        pointsRequired: 250,
    },
];

export type Benefit = {
    id: string;
    title: string;
    kind: 'Producto' | 'Capacitacion';
    pointsCost: number;
};

export const benefits: Benefit[] = [
    { id: 'b-001', title: 'Kit Profesional', kind: 'Producto', pointsCost: 1000 },
    {
        id: 'b-002',
        title: 'Master Class Colorimetria',
        kind: 'Capacitacion',
        pointsCost: 500,
    },
    { id: 'b-003', title: 'Kit Barberia', kind: 'Producto', pointsCost: 800 },
    {
        id: 'b-004',
        title: 'Taller Marketing para Salones',
        kind: 'Capacitacion',
        pointsCost: 350,
    },
];
