# Tobbes sportfoton

Sportfotografi av Tobbe Bengtson. Sidlinjens design i grafit (`#202126`) och orange (`#FF9E50`), med bildarkiv, fem sporter, nyheter, Instagram och kontakt.

- **[Visa hemsidan](https://simonbeverskog.github.io/TSFMedia/)**
- **[Sanity Studio för utveckling](https://tsfmedia.sanity.studio/)**
- **[Öppna klientportalen med lösenord](https://tsfmedia-admin.chattyfacet16.chatgpt.site/)**

## Samma repo, fristående appar

```text
TSFMedia/
├── sportfoto/           # Publik hemsida på GitHub Pages
├── admin-tsfmedia/      # Egen klientportal med ett gemensamt lösenord
└── studio-tsfmedia/     # Fristående Sanity Studio
```

Sanity-projekt: `d11tiunw`, dataset: `production`. Studio är inte inbyggt i hemsidan. Apparna använder Node.js 24; Studio kräver minst 22.12. Använd npm 11 för installation av Studios låsta beroenden.

## Kör lokalt

Installera med `npm --prefix sportfoto ci` och `npm --prefix studio-tsfmedia ci`.

- Hemsida: `npm --prefix sportfoto run build`, sedan `npm --prefix sportfoto run dev` på `http://127.0.0.1:4173`.
- Studio: `npm --prefix studio-tsfmedia run dev` på `http://localhost:3333`.
- Klientportal: `npm --prefix admin-tsfmedia ci`, konfigurera serverhemligheter enligt dess README och kör `npm --prefix admin-tsfmedia run dev` på `http://127.0.0.1:4180`.
- Kontroller: `npm --prefix sportfoto run check`, `npm --prefix sportfoto test` och `npm --prefix studio-tsfmedia run check`.

## Innehåll och publicering

Redigera kontakt, sidtexter, sidbilder, sporter, album, fristående bilder och nyheter i klientportalen. Den kräver ett gemensamt lösenord; klienten behöver inget Sanity-konto. Publicera bilder före album som refererar till dem. Läs [klientportalens guide](admin-tsfmedia/README.md). Sanity Studio finns kvar som utvecklarverktyg med sin tidigare inloggning.

Hemsidan läser en uttrycklig projektion av publicerat innehåll från Sanitys publika API vid sidladdning. CDN-cache kan ge en kort fördröjning efter publicering. Inga hemliga API-nycklar eller GitHub-token används i webbläsaren. CMS-ändringar kräver ingen GitHub-push eller webhook.

GitHub Actions bygger dessutom en innehållskopia och publicerar `sportfoto/dist/` vid varje push till `main`. Kopian används vid tillfälliga API-fel. Om innehåll måste dras tillbaka även ur den sparade kopian: kör om Pages-flödet efter avpublicering i Sanity. Förhandsförslaget har kvar `noindex` tills en riktig lansering planeras.

Studio publiceras separat med `npm --prefix studio-tsfmedia run deploy -- --yes --schema-required` efter kodändringar. GitHub kontrollerar Studio-koden, men lagrar ingen Sanity-token för automatisk Studio-publicering.

## Demomaterial

Fem bilder från Unsplash och tidigare album och nyheter har importerats som märkta exempel. De är inte Tobbes egna uppdrag. Kontaktuppgifterna kommer från beställaren. Typsnitten lagras lokalt med sina licenser. Ingen analys eller spårningskaka används av hemsidan.

Allt bildmaterial är publikt i detta skede. Privata album kräver riktig åtkomstkontroll och skyddad bildlagring; se redaktörsguiden innan den funktionen införs.
