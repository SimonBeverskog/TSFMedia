# Tobbes sportfoton – klientportal

En egen adminportal med ett gemensamt lösenord. Klienten behöver varken e-postadress, Sanity-konto, Google-konto eller ChatGPT-konto för att använda portalen.

[Öppna adminportalen](https://tsfmedia-admin.chattyfacet16.chatgpt.site/).

## Innehåll

Portalen hanterar album, bilder, nyheter, sporter, kontaktuppgifter, menyer och sidans texter. Innehållet ligger kvar i samma Sanity-projekt (`d11tiunw`, `production`) och hemsidan läser publicerat innehåll precis som tidigare.

Skapa ett album, ladda upp bilderna och välj albumet vid uppladdning. Bilder sparas som utkast. Granska bildnamn och motivbeskrivningar och publicera bilderna, enskilt eller flera samtidigt i biblioteket. Publicera sedan albumet. Ett album kan innehålla 1–100 bilder; JPEG, PNG och WebP stöds, högst 20 MB per fil.

**Spara utkast** sparar arbete utan att ändra det publicerade innehållet. **Publicera** validerar innehåll och kontrollerar att refererade bilder och sporter är publicerade. **Avpublicera** tar bort innehållet från hemsidans nästa lyckade innehållsläsning men behåller ett utkast. Befintliga bildfiler är fortfarande publika, och hemsidans tidigare byggda reservkopia kan behöva byggas om för att också dra tillbaka innehåll därifrån.

Nyhetstext redigeras som stycken separerade av en tom rad. Befintlig formatering bevaras när texten lämnas orörd; när brödtexten ändras sparas den som vanliga stycken i denna första portalversion.

## Lösenord och serverhemligheter

Lösenordet valdes vid installation och lämnas separat. Det finns inte i GitHub, den byggda koden eller webbläsarens lagring. Servern lagrar en saltad PBKDF2-hash och använder en signerad HttpOnly-session som gäller i åtta timmar. HTTPS-sessionen har Secure och SameSite=Strict. Byte av lösenordshash ogiltigförklarar gamla sessioner.

Följande miljövariabler konfigureras på servern:

- `ADMIN_PASSWORD_HASH`: PBKDF2-hash från `scripts/generate-login.mjs`.
- `SESSION_SECRET`: slumpmässig hemlighet på minst 32 tecken.
- `SANITY_API_TOKEN`: separat, serverlagrad Editor-nyckel, uttryckligen godkänd av beställaren.
- `SANITY_PROJECT_ID`, `SANITY_DATASET`: projektets publika identifierare.
- `PORTAL_ORIGIN`: portalens exakta HTTPS-origin, för kontroll av skrivförfrågningar.

Hemligheter hanteras som runtime secrets i Sites. Den ignorerade `.env.local` används endast för lokal utveckling. `scripts/configure-local.mjs` tar emot lokala värden via dold stdin. `scripts/generate-login.mjs` skriver ett nytt lösenord, dess hash och en sessionshemlighet till stdout; kör det privat och publicera aldrig utdata i kod eller byggloggar.

Inloggningen begränsas till tio felaktiga försök under tio minuter per IP och serverinstans. Vid större trafik eller fler administratörer bör den begränsningen flyttas till en gemensam serverlagring eller gateway. Portalen saknar mejl, kontoregistrering, lösenordsåterställning och individuella användarroller enligt beställningen.

## Kör lokalt

Node.js 24 krävs. Kör `npm ci`, konfigurera `.env.local` enligt `.env.example` och starta med `npm run dev`. Öppna `http://127.0.0.1:4180/`.

`npm run check` kontrollerar syntax. `npm run build` bygger den fristående Worker-filen med inbäddade statiska tillgångar. `npm test` kontrollerar autentisering, CSRF, innehållsvalidering, publicering, avpublicering, uppladdningskontroller och skydd mot överskrivning av nyare ändringar. Kör byggsteget före testerna.

## Hosting och flytt

Sites används som första hostingmiljö. `.openai/hosting.json` innehåller endast portalens projekt-id. All kod finns även i huvudrepots `admin-tsfmedia/`; publiceringen använder en separat, ignorerad Sites-källkopia under `.site-artifacts/` för att hålla huvudrepots Git-inställningar intakta.

Affärslogiken finns i `src/handler.js`, använder standardiserade Request/Response-API:er och har inga Sites-specifika körberoenden. Den kan flyttas till annan Worker-hosting. `scripts/serve.mjs` är en Node-adapter som även kan köras på en vanlig Node-server med motsvarande miljövariabler. Frontend och innehållsdatabas kan behållas. Inga hemligheter bakas in i bygget.

Vid ny publicering: bygg och testa koden, synkronisera den sanerade källkopian utan `.env.local`, använd Sites source-helper för commit/push/paketering och publicera den sparade versionen. Bevara samma `project_id` och lösenordshash tills ett lösenordsbyte är avsiktligt. Den publika inloggningssidan kräver ingen plattformsinloggning; all innehållsläsning och alla ändringar kräver portalens egen session.
