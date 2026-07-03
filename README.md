# Avos — portfolio

A short, static portfolio site for the **Avos** web agency, built from the source
design (Figma slides). No build step — plain HTML/CSS with a touch of JS.

## Pages
- `index.html` — home: hero, three service cards, selected works.
- `emarket.html` — case study: eMarket (mobile app concept).
- `force-drop-zone.html` — case study: Force Drop Zone (gaming landing).
- `dentalogica.html` — case study: Dentalogica (dental clinic branding).

## Header (reproduced from the design spec)
- **Nav pill** — radius 90 · fill `#828282` @ 60% · background blur 20 · gap Avos↔Home = 152px · font Pragati Narrow.
- **Case pill** — W 641 · H 75 · radius 90 · padding L60/R80/T5/B5 · fill `#FFFFFF` @ 60% · stroke `#48484C` @ 30% (1px inside) · background blur 20.

## Home hero
The hero panel (grainy background, title, service cards) is rendered 1:1 from the
source design into `assets/img/hero-panel.jpg`; clickable areas are overlaid on the cards.

## Type
- Display / serif: **Playfair Display**
- Narrow grotesque (header, works): **Pragati Narrow**
- Mono (case pages, footer): **Space Mono**

## Run locally
```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Images live in `assets/img/`, styles in `assets/css/style.css`.
