import type { Locale } from '../config';

export const recommendedRoutes = {
	en: {
		seoTitle: 'Best Boat Routes in Zakynthos (Zante) | Navagio & Blue Caves',
		seoDescription:
			'Discover the best boat routes in Zakynthos. Visit Shipwreck Beach (Navagio), Blue Caves, Keri Caves, Turtle Island, and hidden gems. Recommended itineraries for self-drive and skipper cruises.',
		heroAria: 'Recommended Routes',
		heroLabel: 'EXPLORE ZAKYNTHOS',
		heroTitle: 'Recommended Routes',
		heroSubtitle:
			'Discover the best destinations around Zakynthos by boat. From iconic landmarks to hidden gems.',
		routesAria: 'Routes',
		cardCta: 'Book This Route',
		contactAria: 'Contact',
		ctaTitle: 'Not sure which route to choose?',
		ctaDesc:
			"Contact us and we'll help you plan the perfect trip based on your preferences, group size, and available time.",
		ctaBtnPrimary: 'Contact Us',
		ctaBtnCall: 'Call: 0030 698 793 1327',
	},
	de: {
		seoTitle: 'Beste Bootsrouten auf Zakynthos (Zante) | Navagio & Blue Caves',
		seoDescription:
			'Entdecken Sie die schönsten Bootsrouten auf Zakynthos. Besuchen Sie Shipwreck Beach (Navagio), die Blue Caves, die Keri Caves, Turtle Island und versteckte Buchten. Empfohlene Routen für Selbstfahrer und Törns mit Skipper.',
		heroAria: 'Empfohlene Routen',
		heroLabel: 'ZAKYNTHOS ENTDECKEN',
		heroTitle: 'Empfohlene Routen',
		heroSubtitle:
			'Entdecken Sie die schönsten Ziele rund um Zakynthos vom Boot aus. Von berühmten Wahrzeichen bis zu versteckten Buchten.',
		routesAria: 'Routen',
		cardCta: 'Diese Route buchen',
		contactAria: 'Kontakt',
		ctaTitle: 'Unsicher, welche Route die richtige ist?',
		ctaDesc:
			'Kontaktieren Sie uns – wir helfen Ihnen, den perfekten Ausflug ganz nach Ihren Wünschen, Ihrer Gruppengröße und der verfügbaren Zeit zu planen.',
		ctaBtnPrimary: 'Kontakt aufnehmen',
		ctaBtnCall: 'Anruf: 0030 698 793 1327',
	},
	fr: {
		seoTitle: 'Meilleurs itinéraires en bateau à Zakynthos (Zante) | Navagio & Blue Caves',
		seoDescription:
			'Découvrez les plus beaux itinéraires en bateau à Zakynthos. Visitez Shipwreck Beach (Navagio), les Blue Caves, les Keri Caves, Turtle Island et des criques secrètes. Itinéraires recommandés sans skipper ou avec skipper.',
		heroAria: 'Itinéraires recommandés',
		heroLabel: 'EXPLORER ZAKYNTHOS',
		heroTitle: 'Itinéraires recommandés',
		heroSubtitle:
			'Découvrez les plus belles destinations autour de Zakynthos en bateau. Des sites emblématiques aux criques secrètes.',
		routesAria: 'Itinéraires',
		cardCta: 'Réserver cet itinéraire',
		contactAria: 'Contact',
		ctaTitle: 'Vous hésitez sur l’itinéraire à choisir ?',
		ctaDesc:
			'Contactez-nous et nous vous aiderons à planifier la sortie idéale selon vos envies, la taille de votre groupe et le temps dont vous disposez.',
		ctaBtnPrimary: 'Contactez-nous',
		ctaBtnCall: 'Appeler : 0030 698 793 1327',
	},
	it: {
		seoTitle: 'Migliori itinerari in barca a Zante (Zacinto) | Navagio & Blue Caves',
		seoDescription:
			'Scopri i più bei itinerari in barca a Zante. Visita Shipwreck Beach (Navagio), le Blue Caves, le Keri Caves, Turtle Island e insenature nascoste. Itinerari consigliati senza patente o con skipper.',
		heroAria: 'Itinerari consigliati',
		heroLabel: 'ESPLORA ZANTE',
		heroTitle: 'Itinerari consigliati',
		heroSubtitle:
			'Scopri le più belle mete intorno a Zante in barca. Dai luoghi iconici alle insenature nascoste.',
		routesAria: 'Itinerari',
		cardCta: 'Prenota questo itinerario',
		contactAria: 'Contatti',
		ctaTitle: 'Non sai quale itinerario scegliere?',
		ctaDesc:
			'Contattaci e ti aiuteremo a pianificare la gita perfetta in base alle tue preferenze, alla dimensione del gruppo e al tempo a disposizione.',
		ctaBtnPrimary: 'Contattaci',
		ctaBtnCall: 'Chiama: 0030 698 793 1327',
	},
} as const satisfies Record<Locale, Record<string, string>>;

export type RecommendedRoutesKey = keyof (typeof recommendedRoutes)['en'];
