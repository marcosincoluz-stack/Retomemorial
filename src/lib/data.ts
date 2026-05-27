export const EVENTS = [
    {
        id: 'disco',
        name: 'Disco',
        slug: 'disco',
        title: 'Lanzamiento de Disco',
        image: '/disco.jpg',
        description: 'Adivina quién lanzará más lejos.',
        markToBeat: { male: 62.00, female: 61.00 },
        startTime: '2026-06-15T19:30:00',
    },
    {
        id: 'jabalina',
        name: 'Jabalina',
        slug: 'jabalina',
        title: 'Lanzamiento de Jabalina',
        image: '/jabalina.jpg',
        description: 'La prueba de los dioses.',
        markToBeat: { male: 79.00, female: 61.00 },
        startTime: '2026-06-15T18:20:00',
    },
    
];

export type Athlete = {
    id: string;
    name: string;
    mark: number;
    image: string;
};

export type AthleteWithMeta = Athlete & {
    eventSlug: string;
    gender: 'male' | 'female';
    bio: string;
    highlights: AthleteHighlightData[];
};

export type AthleteHighlightData = {
    tier: 'gold' | 'silver' | 'bronze';
    label: string;
    sortOrder: number;
};

export type AthletesByEvent = Record<string, { male: Athlete[]; female: Athlete[] }>;

const ATHLETES_LOCAL: AthletesByEvent = {
    disco: {
        male: [
            { id: 'dm1', name: 'Marcos Moreno', mark: 61.15, image: '/marcosmoreno.jpg' },
            { id: 'dm2', name: 'Yasiel Sotero', mark: 64.53, image: '/yasielsotero.jpg' },
            { id: 'dm3', name: 'Bruno Cagigos', mark: 50.87, image: '/brunocagigos.jpg' },
            { id: 'dm4', name: 'Mykahilo Brudin', mark: 61.33, image: '/brudin.jpg' },
            { id: 'dm5', name: 'Miguel Capdepont', mark: 53.61, image: '/capdepont.jpg' },
            { id: 'dm6', name: 'Diego Casas', mark: 62.10, image: 'https://images.unsplash.com/photo-1544033527-b192daee1f5b?q=80&w=400&auto=format&fit=crop' },
        ],
        female: [
            { id: 'df1', name: 'Nneka Naomey Ezenwa', mark: 55.49, image: '/naomeyezenwa.jpg' },
            { id: 'df2', name: 'Natalia Sainz', mark: 53.96, image: '/nataliasainz.jpg' },
            { id: 'df3', name: 'Ines Alais Tellene', mark: 44.71, image: '/inestellene.jpg' },
            { id: 'df4', name: 'Raquel Villa', mark: 42.94, image: '/raquelvilla.jpg' },
            { id: 'df5', name: 'Angela Ferreira', mark: 40.00, image: '/angelaferreira.jpg' },
            { id: 'df6', name: 'June Kintana', mark: 56.20, image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=400&auto=format&fit=crop' },
        ],
    },
    jabalina: {
        male: [
            { id: 'jm1', name: 'Nicolás Quijera', mark: 80.21, image: '/nicoquijera.jpg' },
            { id: 'jm2', name: 'Jorge Franco', mark: 76.98, image: '/jorgefranco.jpg' },
            { id: 'jm3', name: 'Rodrigo Iglesias', mark: 72.97, image: '/rodrigoiglesias.jpg' },
            { id: 'jm4', name: 'David Agudo', mark: 66.45, image: '/davidagudo.jpg' },
            { id: 'jm5', name: 'Hailu Estrampes', mark: 71.43, image: '/hailuestrampes.jpg' },
            { id: 'jm6', name: 'Manu Quijera', mark: 79.50, image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=400&auto=format&fit=crop' },
        ],
        female: [
            { id: 'jf1', name: 'Haruka Kitaguchi', mark: 67.38, image: 'https://images.unsplash.com/photo-1594882645126-14020914d58d?q=80&w=400&auto=format&fit=crop' },
            { id: 'jf2', name: 'Kelsey-Lee Barber', mark: 66.91, image: 'https://images.unsplash.com/photo-1502014822147-1aed8061dfc8?q=80&w=400&auto=format&fit=crop' },
            { id: 'jf3', name: 'Mackenzie Little', mark: 65.70, image: 'https://images.unsplash.com/photo-1628779238951-3013b5bf5a45?q=80&w=400&auto=format&fit=crop' },
            { id: 'jf4', name: 'Kara Winger', mark: 68.11, image: 'https://images.unsplash.com/photo-1566895291253-fa587530db9c?q=80&w=400&auto=format&fit=crop' },
            { id: 'jf5', name: 'Lina Muze', mark: 64.78, image: 'https://images.unsplash.com/photo-1606041011872-596597976b25?q=80&w=400&auto=format&fit=crop' },
            { id: 'jf6', name: 'Arantza Moreno', mark: 59.15, image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=400&auto=format&fit=crop' },
        ],
    },
};

export const ATHLETES: AthletesByEvent = ATHLETES_LOCAL;

const BIOS_LOCAL: Record<string, string> = {
    dm1: 'Discóbolo riojano de La Rioja Atletismo. En marzo de 2025 fue bronce absoluto de España con 61,15 m y oro sub-23 en el Nacional de Lanzamientos de Invierno. También compitió internacionalmente en categorías sub-20 y sub-23.',
    dm2: 'Especialista hispano-cubano del Tenerife CajaCanaria. Campeón de España absoluto de disco en 2021, 2023 y 2025; en 2025 ganó con 64,53 m y récord del campeonato. Fue oro europeo sub-18 y sub-20, y doble bronce europeo sub-23.',
    dm3: 'Discóbolo universitario (UC3M) en progresión dentro del circuito nacional. Figura en el Campeonato de España Universitario 2024 en disco (2 kg), compitiendo en categoría masculina.',
    dm4: 'Lanzador ucraniano afincado en Logroño, habitual en competiciones nacionales con Atletismo Numantino. En 2025 fue subcampeón sub-23 en el Nacional de Invierno (54,68 m) y 4.º en el Europeo sub-23 con 59,85 m.',
    dm5: 'Atleta del Trops-Cueva de Nerja especializado en disco. Fue campeón de España sub-20 en 2025 (49,76 m) y posteriormente campeón de España sub-23 (53,61 m), además de entrar en la preselección española sub-23 para la Copa de Europa de Lanzamientos 2026.',
};

const HIGHLIGHTS_LOCAL: Record<string, AthleteHighlightData[]> = {
    dm1: [
        { tier: 'gold', label: 'Oro sub-23 en invierno (2025)', sortOrder: 0 },
        { tier: 'bronze', label: 'Bronce de España absoluto (2025)', sortOrder: 1 },
        { tier: 'silver', label: 'Marca destacada: 61,15 m', sortOrder: 2 },
    ],
    dm2: [
        { tier: 'gold', label: 'Campeón de España absoluto (2021, 2023, 2025)', sortOrder: 0 },
        { tier: 'silver', label: 'Récord de campeonato: 64,53 m (2025)', sortOrder: 1 },
        { tier: 'bronze', label: 'Doble bronce europeo sub-23', sortOrder: 2 },
    ],
    dm3: [
        { tier: 'gold', label: 'Participación en CEU 2024 (disco 2 kg)', sortOrder: 0 },
        { tier: 'silver', label: 'Proyección dentro del circuito nacional', sortOrder: 1 },
        { tier: 'bronze', label: 'Perfil universitario competitivo', sortOrder: 2 },
    ],
    dm4: [
        { tier: 'gold', label: '4.º en Europeo sub-23 (2025)', sortOrder: 0 },
        { tier: 'silver', label: 'Subcampeón de España sub-23 (2025)', sortOrder: 1 },
        { tier: 'silver', label: 'Plata nacional de invierno (54,68 m)', sortOrder: 2 },
    ],
    dm5: [
        { tier: 'gold', label: 'Campeón de España sub-23 (2025)', sortOrder: 0 },
        { tier: 'silver', label: 'Campeón de España sub-20 (2025)', sortOrder: 1 },
        { tier: 'bronze', label: 'Preselección Copa de Europa 2026', sortOrder: 2 },
    ],
};

export function getAthleteCost(athleteId: string, eventSlug: string, genderKey?: 'male' | 'female'): number {
    return getAthleteCostFromList(athleteId, ATHLETES[eventSlug]);
}

export function getAthleteCostFromList(athleteId: string, eventPool?: { male: Athlete[]; female: Athlete[] }): number {
    if (!eventPool) return 0;

    const allAthletes = [
        ...(eventPool.male || []),
        ...(eventPool.female || []),
    ];

    const sorted = [...allAthletes].sort((a, b) => b.mark - a.mark);
    const index = sorted.findIndex((a) => a.id === athleteId);
    if (index === -1) return 0;

    const ranking = index + 1;
    return ranking <= 12 ? (13 - ranking) : 1;
}

export function getAthleteBioLocal(athleteId: string): string {
    return BIOS_LOCAL[athleteId] ?? '';
}

export function getAthleteHighlightsLocal(athleteId: string): AthleteHighlightData[] {
    return HIGHLIGHTS_LOCAL[athleteId] ?? [];
}