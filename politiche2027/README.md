# Elezioni101 — prototipo Politiche 2027

Prototipo mobile per verificare una sola cosa: una persona che sa poco di politica riesce a capire, in meno di un minuto, cosa trova sulla scheda e chi può essere eletto?

## Prova rapida

Apri `index.html` tramite un piccolo server locale (il browser deve poter caricare il file JSON):

```bash
python3 -m http.server 8000
```

Poi visita `http://localhost:8000/politiche2027/` e scrivi **Padova**.

## Scelte del prototipo

- Flusso unico: Comune → gesto di voto → coalizioni/liste → candidati → spiegazione.
- Dati ufficiali della Camera 2022 per Padova, usati solo per provare l'interfaccia.
- Impianto provvisorio Stabilicum: proporzionale, liste bloccate e premio oltre il 42%.
- Nessun account, backend, tracciamento o geolocalizzazione.
- HTML, CSS, JavaScript e JSON senza dipendenze.

## Prima di pubblicare

- Verificare ogni profilo biografico con almeno una fonte primaria.
- Sostituire programmi, coalizioni e candidati quando diventano ufficiali.
- Aggiornare la spiegazione se cambia la legge elettorale.
- Fare 5–10 test con persone non appassionate di politica.
