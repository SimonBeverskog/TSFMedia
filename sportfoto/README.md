# Tobbes sportfoton

Svenskt webbplatsförslag för fotografen Tobbe Bengtson. Sidlinjens layout i grafit (`#202126`) och orange (`#FF9E50`). Byggd med HTML, CSS och JavaScript utan externa körberoenden. Barlow Condensed och DM Sans är lokalt lagrade i `dist/assets/fonts/` tillsammans med sina licenser.

## Kör lokalt

Kör `npm run dev` i denna katalog och öppna `http://127.0.0.1:4173`. Kör `npm run check` för att kontrollera innehåll, tillgångar och interna länkar.

## Redigera innehåll

Kontakt, Instagram, sportkategorier, bilder, evenemang och nyheter ligger i `dist/content.js`. Sportlistan är Fotboll, Handboll, Innebandy, Ishockey och Friidrott. Kategorier visas även innan deras första album har publicerats. Lägg fotografens bilder i `dist/assets/` och uppdatera bildlistan och albumen. Sidans huvudsakliga presentationstexter finns i `dist/index.html`. Utseendet finns i `dist/styles.css`.

Albumfilter, fritextsökning, sortering, bildvisning med tangentbord, nyhetsartiklar, mobilmeny och e-postförfrågningar fungerar i webbläsaren. Kontaktknappar öppnar användarens e-postapp; sidan har ingen server för formulär eller administration.

## Demomaterial

Samtliga fem sportbilder kommer från Unsplash. Fotografer och källänkar anges i `dist/content.js` och i sidans bildkällor. Bilderna är inte Tobbes fotografier. Album, albumdatum och nyhetstexter är exempel. Byt till godkänt eget material och justera demomärkningen före offentlig lansering. E-post och Instagram är uppgifter som beställaren har lämnat.

## Publicering

`dist/` är den färdiga webbplatsen och behöver inget byggsteg. Repo-flödet `.github/workflows/pages.yml` validerar och publicerar katalogen till GitHub Pages när `main` uppdateras. Den äldre Sites-identiteten finns kvar lokalt i `.openai/hosting.json` men används inte av GitHub Pages.
