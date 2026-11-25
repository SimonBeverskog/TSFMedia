# Tobbes sportfoton – hemsidan

HTML, CSS och JavaScript med innehåll från Sanity. Designen använder grafit (`#202126`), orange (`#FF9E50`), Barlow Condensed och DM Sans. Typsnitten och deras licenser finns i `dist/assets/fonts/`.

## Kör och kontrollera

Använd Node.js 24. Kör `npm ci`, `npm run build` och `npm run dev`. Öppna `http://127.0.0.1:4173`. `npm run check` kontrollerar tillgångar, innehåll och ankare; `npm test` kontrollerar tomt innehåll, brutna bildreferenser, fristående bilder, publiceringsdatum och säker textrendering.

## Innehåll från Sanity

Redigera i [adminportalen](https://tsfmedia.sanity.studio/). [Redaktörsguiden](../studio-tsfmedia/README.md) beskriver uppladdning och publicering.

- `src/sanity.js`: publik Sanity-klient, GROQ-projektion och bildstorlekar.
- `src/content-model.js`: omvandlar CMS-innehåll till hemsidans format.
- `scripts/build.mjs`: bygger läsaren och en kopia av publicerat innehåll.
- `dist/app.js`, `dist/render-content.js`: interaktion och innehållsrendering.
- `dist/index.html`, `dist/styles.css`: struktur och design.
- `dist/content.js`, `dist/page-content.js`: det ursprungliga förslaget, för import och reservvisning.

`dist/sanity.js` och `dist/cms-snapshot.js` är genererade. Kör `npm run build` efter ändringar i läsaren. GitHub Actions bygger dem före publicering. Den publika läsaren visar endast publicerade dokument; en lyckad läsning av tomma samlingar visar tomt innehåll, utan att återinföra demoalbum.

Bildkort använder bilder upp till 900 px, bildvisningen 1800 px och miniatyrer 160 px. Originalfiler levereras inte automatiskt i galleriet. Albumfilter, sökning, sortering, tangentbordsstyrd bildvisning, nyheter, mobilmeny och e-postförfrågningar fungerar i webbläsaren.

## GitHub Pages

Push till `main` bygger och publicerar till [hemsidan](https://simonbeverskog.github.io/TSFMedia/). Vanlig innehållsredigering i Sanity syns efter publicering och nästa sidladdning, med eventuell CDN-fördröjning.

En byggd innehållskopia används vid API-fel. Kör om Pages-flödet efter avpublicering om innehåll även ska tas bort ur kopian. Alla uppladdade bildfiler är publika i nuvarande lösning. Hemsidan har kvar demomärkning och `noindex` inför klientgranskning.
