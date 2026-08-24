# Elezioni101 — prototipo Politiche 2027

Prototipo mobile per verificare una sola cosa: una persona che sa poco di politica riesce a capire, in meno di un minuto, cosa trova sulla scheda e chi può essere eletto?

## Prova rapida

Apri `index.html` tramite un piccolo server locale (il browser deve poter caricare il file JSON):

```bash
python3 -m http.server 8000
```

Poi visita `http://localhost:8000/politiche2027/` e scrivi **Padova**.

## Scelte del prototipo

- Al primo accesso: Comune → gesto di voto → pagina personale.
- Dopo il primo accesso: menu e barra inferiore portano direttamente a liste, candidati o legge elettorale.
- Dati ufficiali della Camera 2022 per Padova, usati solo per provare l'interfaccia.
- Impianto provvisorio Stabilicum: proporzionale, liste bloccate e premio oltre il 42%.
- Nessun account, backend, tracciamento o geolocalizzazione.
- HTML, CSS, JavaScript e JSON senza dipendenze.

## Riferimenti UX

- **BallotReady:** indirizzo una volta sola, scheda personalizzata e accesso per sezioni.
- **Who Can I Vote For?:** ricerca geografica diretta, elenco completo e profili dei candidati.
- **VOTE411:** guida elettorale personale separata dalle istruzioni pratiche sul voto.
- **Ballotpedia Sample Ballot:** concetto di fac-simile personale da consultare rapidamente.

Nel prototipo questi pattern diventano: onboarding breve ma saltabile, home personale, indice ricercabile dei candidati, navigazione persistente e profili fotografici.

Le fotografie sono mostrate solo quando esiste una fonte riutilizzabile e attribuibile, principalmente Wikimedia Commons e ritratti istituzionali. In assenza di una licenza verificabile viene mostrato il simbolo della lista, senza usare immagini generate.

## Prima di pubblicare

- Verificare ogni profilo biografico con almeno una fonte primaria.
- Completare fotografie, crediti e licenze per tutti i candidati ufficiali.
- Sostituire programmi, coalizioni e candidati quando diventano ufficiali.
- Aggiornare la spiegazione se cambia la legge elettorale.
- Fare 5–10 test con persone non appassionate di politica.
