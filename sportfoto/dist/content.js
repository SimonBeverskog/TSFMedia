// Redigera kontaktuppgifter, album och nyheter här. Sökvägar utgår från dist/.
export const photographer = {
  name: 'Tobbe Bengtson',
  email: 'tobbe.bengtson@gmail.com',
  instagram: 'https://www.instagram.com/tobbessportfoton/',
};

// Sporterna visas i denna ordning, även innan deras första album publicerats.
export const sports = ['Fotboll', 'Handboll', 'Innebandy', 'Ishockey', 'Friidrott'];

export const photos = {
  football: { src: 'assets/football.jpg', alt: 'Fotbollsspelare i kamp om bollen på en grön plan', author: 'Maximilian Müller', source: 'https://unsplash.com/photos/ukIGVR_E3yw' },
  hockey: { src: 'assets/hockey.jpg', alt: 'Ishockeyspelare och domare på isen under en match', author: 'Tsimur Asayonak', source: 'https://unsplash.com/photos/ETre64PeFnA' },
  running: { src: 'assets/running.jpg', alt: 'Löpare tävlar under en solig dag', author: 'Felix yu', source: 'https://unsplash.com/photos/LjvGR3r5eUM' },
  football2: { src: 'assets/football2.jpg', alt: 'Två fotbollsspelare utmanar varandra om bollen', author: 'Leo_Visions', source: 'https://unsplash.com/photos/n1GhAJVP7yg' },
  track: { src: 'assets/track.jpg', alt: 'Löpare tävlar på en röd friidrottsbana', author: 'Justin Lagat', source: 'https://unsplash.com/photos/XyN5LhHOlTU' },
};

// Exempelalbum. Byt ut mot fotografens faktiska evenemang före offentlig lansering.
export const events = [
  { id: 'fotboll-i-fokus', title: 'Fotboll i fokus', category: 'Fotboll', date: '2026-11-21', subtitle: 'Dueller, driv och matchkänsla', cover: 'football', photos: ['football', 'football2'] },
  { id: 'en-kvall-pa-isen', title: 'En kväll på isen', category: 'Ishockey', date: '2026-11-20', subtitle: 'Nära spelet, nära känslan', cover: 'hockey', photos: ['hockey'] },
  { id: 'hela-vagen-till-mal', title: 'Hela vägen till mål', category: 'Friidrott', date: '2026-11-15', subtitle: 'Varje steg har en historia', cover: 'running', photos: ['running', 'track'] },
  { id: 'kampen-om-bollen', title: 'Kampen om bollen', category: 'Fotboll', date: '2026-11-01', subtitle: 'Sekunden som gör skillnad', cover: 'football2', photos: ['football2', 'football'] },
  { id: 'pa-loparbanan', title: 'På löparbanan', category: 'Friidrott', date: '2026-10-25', subtitle: 'Från startskott till sista steget', cover: 'track', photos: ['track', 'running'] },
];

export const news = [
  { id: 'valkommen', category: 'AKTUELLT', title: 'En ny plats för sportens ögonblick.', excerpt: 'Välkommen till Tobbes sportfoton. Här ska bilderna få ta plats.', photo: 'football2', body: ['Välkommen till ett första förslag på Tobbes sportfoton — en plats för matchbilder, tävlingar och ögonblick som är värda att spara.', 'Tanken är enkel: välj en sport, hitta ditt evenemang och upplev bilderna i lugn och ro. De album som visas nu är exempel. De ersätts med Tobbes egna fotografier och evenemang inför lanseringen.'] },
  { id: 'hitta-din-bild', category: 'BILDER & FRÅGOR', title: 'Så hittar du din bild.', excerpt: 'Börja med sporten eller sök efter ditt evenemang i bildarkivet.', photo: 'running', body: ['I bildarkivet kan du filtrera efter sport och söka efter ett evenemang. Klicka på ett album för att öppna bildvisningen.', 'Vill du fråga om en bild? Använd knappen ”Fråga om en bild”. Ett mejl öppnas med albumets namn och bildnamnet ifyllt. Tobbe kan då hjälpa dig vidare med tillgänglighet, användning och eventuella villkor.'] },
  { id: 'boka-fotografering', category: 'FOTOGRAFERING', title: 'Ett evenemang att minnas.', excerpt: 'Planerar du en match eller tävling? Hör av dig och berätta mer.', photo: 'hockey', body: ['Planerar du en match, tävling eller ett annat sportevenemang och vill prata om fotografering? Kontakta Tobbe med en kort beskrivning.', 'Berätta gärna vilken sport det gäller, datum, plats och hur bilderna är tänkta att användas. Då finns ett bra underlag för att prata vidare om upplägg och tillgänglighet.'] },
];
