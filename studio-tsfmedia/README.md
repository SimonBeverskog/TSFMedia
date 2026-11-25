# TSFMedia – Sanity Studio

Fristående adminportal för Tobbes sportfoton. Projekt `d11tiunw`, dataset `production`.

**[Öppna adminportalen](https://tsfmedia.sanity.studio/)** och logga in med det Google-konto som har tillgång till Sanity-projektet.

## Redigera hemsidan

- **Kontakt & sidinställningar:** namn, e-post, Instagram, logotyptext, meny och sidfot.
- **Startsida & texter:** rubriker, bokningsknapp, presentation, sidbilder och utvalt album.
- **Album & evenemang:** sport, datum, omslag och 1–100 ordnade bildreferenser.
- **Bildbibliotek:** bilder, beskrivningar, fotograf och val för fristående visning.
- **Nyheter:** ingress, formaterad text och publiceringsdatum.
- **Sporter:** namn och ordning i sportlisten och filtren.

Ändringar sparas som utkast. Klicka **Publicera** när innehållet är klart. Hemsidan hämtar publicerade ändringar vid nästa sidladdning; Sanitys CDN kan ge en kort fördröjning. Ingen GitHub-push behövs för vanliga innehållsändringar.

## Ladda upp ett evenemang

1. Skapa ett album med rubrik, sport och datum. Låt det vara ett utkast.
2. Öppna **Ladda upp bilder** i verktygsmenyn uppe till vänster. Ladda om verktyget om ett nyligen skapat album saknas.
3. Välj sport, datum, album och 1–100 JPEG-, PNG- eller WebP-bilder, högst 20 MB per fil. Bilderna sparas som utkast och läggs till i albumets utkast.
4. Granska bildnamn och beskrivningar i Bildbibliotek. Filnamnet används bara som ett första förslag. Publicera bilderna.
5. Välj omslag, ordna bilderna och publicera albumet.

För en fristående bild: välj **Även som fristående bild**. Den kan samtidigt användas i ett eller flera album. Bilder återanvänds genom referenser, utan dubbla uppladdningar.

## Publikt material

Datasetet och bildfilerna är publika. Utkast visas inte på hemsidan, men en uppladdad bildfil är tillgänglig via sin CDN-adress även innan bildposten publiceras. Ladda bara upp material avsett för offentlig visning.

Framtida privata album kräver en separat lösning med åtkomstkontroll och skyddad bildlagring. Ett dolt album eller ett utkast gör inte bildfilen privat. De separata bild- och albumdokumenten gör det möjligt att utöka modellen utan att bygga om redigeringen.

## Utveckling

Använd Node.js 24 (minst 22.12) och npm 11. Studio ligger bredvid `sportfoto/` med egna beroenden och egen byggprocess.

```sh
npm ci
npm run dev
npm run check
npm run build
```

`npm run schema:deploy` publicerar schemat. `npm run deploy -- --yes --schema-required` publicerar Studio på den registrerade adressen. CLI-inloggning via `npx sanity login` krävs för publicering.

`npm run typegen` genererar schema och typer för GROQ-frågan i `../sportfoto/src/`. Samma generering körs automatiskt under Studio-utveckling och bygge. Schema, frågor och genererade typer finns i samma repo. Funktioner som körs vid innehållsändringar kan läggas till senare vid behov.

Sanity MCP är valfritt och är ännu inte anslutet. Om du vill använda Sanitys agentverktyg kan det anslutas via `npx sanity@latest mcp configure`; be om den anslutningen innan en agent kör kommandot.

`npm run content:import-demo` importerar sidans tidigare publika demoinnehåll utan att skriva över redaktionella ändringar. Kör normalt bara vid första installationen. Bilder, album och nyheter behåller exempelmärkningen och bildkällorna.

`npm run test:cms` kontrollerar API-genererade utkast och albumreferenser mot hemsidans publika läsare. Det skapar två tillfälliga utkast och städar bort dem i `finally`; inget testinnehåll publiceras.

Korrigeringar av CLI-beroenden finns i `overrides`. Sanitys CLI-beroenden har fortfarande en måttlig `minimatch`-anmärkning efter installation; detta beroende ingår inte i hemsidans webbläsarbunt. Undvik `npm audit fix --force`, som föreslår att nedgradera Sanity till en äldre huvudversion.
