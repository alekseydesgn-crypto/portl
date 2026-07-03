# Avos — portfolio

A short, static portfolio site for the **Avos** web agency, built from the source
design (Figma slides). No build step — plain HTML/CSS with a touch of JS.

## Pages
- `index.html` — home: hero, three service cards, selected works.
- `emarket.html` — case study: eMarket (mobile app concept).
- `force-drop-zone.html` — case study: Force Drop Zone (gaming landing).
- `dentalogica.html` — case study: Dentalogica (dental clinic branding).

## Header (reproduced 1:1 from the design spec)
- **Nav pill** — W 520 · H 75 · radius 90 · padding L60/T5/R5/B5 · fill `#828282` @ 60% · background blur 20.
- **Case pill** — W 641 · H 75 · radius 90 · padding L60/R80/T5/B5 · fill `#FFFFFF` @ 60% · stroke `#48484C` @ 30% (1px inside) · background blur 20.

## Type
- Display / serif: **Playfair Display**
- Labels / body: **Space Mono**

## Run locally
```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Images live in `assets/img/`, styles in `assets/css/style.css`.
