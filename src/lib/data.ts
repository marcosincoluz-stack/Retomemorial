export const EVENTS = [
    {
        id: 'disco',
        name: 'Disco',
        slug: 'disco',
        title: 'Lanzamiento de Disco',
        image: '/disco.jpg', // User provided image
        description: 'Adivina qui\u00e9n lanzar\u00e1 m\u00e1s lejos.',
        markToBeat: { male: 62.00, female: 62.00 },
        startTime: '2026-06-15T18:00:00',
    },
    {
        id: 'jabalina',
        name: 'Jabalina',
        slug: 'jabalina',
        title: 'Lanzamiento de Jabalina',
        image: '/jabalina.jpg', // User provided image
        description: 'La prueba de los dioses.',
        markToBeat: { male: 78.50, female: 61.00 },
        startTime: '2026-06-15T19:30:00',
    },
    {
        id: 'longitud',
        name: 'Longitud',
        slug: 'longitud',
        title: 'Salto de Longitud',
        image: '/longitud.jpg',
        description: '\u00bfQui\u00e9n volar\u00e1 m\u00e1s lejos?',
        markToBeat: { male: 7.85, female: 6.50 },
        startTime: '2026-06-15T20:00:00',
    },
];

export const ATHLETES = {
    disco: {
        male: [
            { id: 'dm1', name: 'Marcos Moreno', mark: 61.15, image: '/marcosmoreno.jpg' },
            { id: 'dm2', name: 'Yasiel Sotero', mark: 64.53, image: '/yasielsotero.jpg' },
            { id: 'dm3', name: 'Bruno Cagigos', mark: 50.87, image: '/brunocagigos.jpg' },
            { id: 'dm4', name: 'Mykahilo Brudin', mark: 61.33, image: '/brudin.jpg' },
            { id: 'dm5', name: 'Miguel Capdepont', mark: 53.61, image: '/capdepont.jpg' },
        ],
        female: [
            { id: 'df1', name: 'Valarie Allman', mark: 71.46, image: 'https://images.unsplash.com/photo-1552674605-46d526d25246?q=80&w=400&auto=format&fit=crop' },
            { id: 'df2', name: 'Sandra Perkovic', mark: 71.41, image: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?q=80&w=400&auto=format&fit=crop' },
            { id: 'df3', name: 'Kristin Pudenz', mark: 67.87, image: 'https://images.unsplash.com/photo-1544367563-12123d8965cd?q=80&w=400&auto=format&fit=crop' },
            { id: 'df4', name: 'Jorinde van Klinken', mark: 67.05, image: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?q=80&w=400&auto=format&fit=crop' },
            { id: 'df5', name: 'Claudine Vita', mark: 66.64, image: 'https://images.unsplash.com/photo-1526676037777-05a232554f77?q=80&w=400&auto=format&fit=crop' },
        ],
    },
    jabalina: {
        male: [
            { id: 'jm1', name: 'Neeraj Chopra', mark: 89.94, image: 'https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?q=80&w=400&auto=format&fit=crop' },
            { id: 'jm2', name: 'Anderson Peters', mark: 93.07, image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=400&auto=format&fit=crop' },
            { id: 'jm3', name: 'Jakub Vadlejch', mark: 90.88, image: 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?q=80&w=400&auto=format&fit=crop' },
            { id: 'jm4', name: 'Julian Weber', mark: 89.54, image: 'https://images.unsplash.com/photo-1561585253-294966603a11?q=80&w=400&auto=format&fit=crop' },
            { id: 'jm5', name: 'Arshad Nadeem', mark: 90.18, image: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?q=80&w=400&auto=format&fit=crop' },
        ],
        female: [
            { id: 'jf1', name: 'Haruka Kitaguchi', mark: 67.38, image: 'https://images.unsplash.com/photo-1594882645126-14020914d58d?q=80&w=400&auto=format&fit=crop' },
            { id: 'jf2', name: 'Kelsey-Lee Barber', mark: 66.91, image: 'https://images.unsplash.com/photo-1502014822147-1aed8061dfc8?q=80&w=400&auto=format&fit=crop' },
            { id: 'jf3', name: 'Mackenzie Little', mark: 65.70, image: 'https://images.unsplash.com/photo-1628779238951-3013b5bf5a45?q=80&w=400&auto=format&fit=crop' },
            { id: 'jf4', name: 'Kara Winger', mark: 68.11, image: 'https://images.unsplash.com/photo-1566895291253-fa587530db9c?q=80&w=400&auto=format&fit=crop' },
            { id: 'jf5', name: 'Lina Muze', mark: 64.78, image: 'https://images.unsplash.com/photo-1606041011872-596597976b25?q=80&w=400&auto=format&fit=crop' },
        ],
    },
    longitud: {
        male: [
            { id: 'lm1', name: 'Miltiadis Tentoglou', mark: 8.52, image: 'https://images.unsplash.com/photo-1552674605-46d526d25246?q=80&w=400&auto=format&fit=crop' },
            { id: 'lm2', name: 'Wayne Pinnock', mark: 8.50, image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=400&auto=format&fit=crop' },
            { id: 'lm3', name: 'Wang Jianan', mark: 8.36, image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400&auto=format&fit=crop' },
            { id: 'lm4', name: 'Simon Ehammer', mark: 8.45, image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=400&auto=format&fit=crop' },
            { id: 'lm5', name: 'Carey McLeod', male: 8.40, image: 'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?q=80&w=400&auto=format&fit=crop' },
        ],
        female: [
            { id: 'lf1', name: 'Ivana Vuleta', mark: 7.06, image: 'https://images.unsplash.com/photo-1594882645126-14020914d58d?q=80&w=400&auto=format&fit=crop' },
            { id: 'lf2', name: 'Malaika Mihambo', mark: 7.12, image: 'https://images.unsplash.com/photo-1566895291253-fa587530db9c?q=80&w=400&auto=format&fit=crop' },
            { id: 'lf3', name: 'Ese Brume', mark: 7.02, image: 'https://images.unsplash.com/photo-1502014822147-1aed8061dfc8?q=80&w=400&auto=format&fit=crop' },
            { id: 'lf4', name: 'Quanesha Burks', mark: 6.98, image: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?q=80&w=400&auto=format&fit=crop' },
            { id: 'lf5', name: 'Brooke Buschkuehl', mark: 7.13, image: 'https://images.unsplash.com/photo-1535131749050-aac1f124c655?q=80&w=400&auto=format&fit=crop' },
        ],
    },
};
