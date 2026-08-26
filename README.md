# Elite Sniper — Version Lisible / Refactor Humain

> **Source originale :** `Elite Sniper` par FrankChamber (CrazyGames, Juillet 2019)  
> **Moteur réel :** Adobe Animate CC HTML5 Canvas + CreateJS (EaselJS/SoundJS/TweenJS) - 1280x720 @62fps  
> **Clonage vérifié :** `elite-sniper/` 2.7MB, serveur local `http://127.0.0.1:9001` tous assets 200 OK  
> **Original minifié :** `assets.js` 980k sur 1 ligne, `assets.original.beautified.js` 35 871 lignes après beautify

Ce dossier est une **reconstruction professionnelle** du code mono-fichier illisible en **architecture multi-fichiers humaine**.

---

## Structure
```
elite-sniper-readable/
├── index.html                  # HTML propre, charge les modules lisibles
├── assets.original.beautified.js # Original beautified (35k lignes) pour référence
├── README.md
└── js/
    ├── config.js               # Configuration moteur + manifest images/sons
    ├── state.js                # État global (variables renommées + légende)
    ├── missions.js             # 20 missions + données temps/balles
    ├── engine.js               # Init CreateJS, sons, responsive, stage
    ├── gameplay.js             # Boucle principale, visée, tir, ennemis, score
    ├── ui.js                   # Handlers UI (missions, pause, popups, sons)
    └── main.js                 # Point d'entrée, branchement tick
```

---

## Légende variables originales → humaines
L'export Animate CC minifie en 1 lettre. Mapping déduit (frame_0 de `lib.assets`) :

| Orig | Humain | Description |
|------|--------|-------------|
| `w` | `game` | `this` = racine du jeu (`lib.assets`) |
| `A` | `scenes` | `[sceneNormale, sceneZoom5x]` 2 calques (x0.4 et x2) |
| `i` | `soundOn` | boolean son activé |
| `p` | `isPaused` | jeu en pause |
| `c` | `isGameOver` | partie terminée (échec) |
| `b` | `isInGame` | en mission |
| `m` | `isScoped` | lunette ouverte |
| `T` | `isAiming` | en train de viser |
| `g` | `isDraggingJoystick` | mobile joystick drag |
| `f` | `isAlertActive` | alerte en cours |
| `l` | `hintMarker` | sprite marqueur hint |
| `o` | `hintEnemyId` | id ennemi hinté |
| `d` | `fadeInTarget` | nom clip à fade-in |
| `y` | `fadeOutTarget` | nom clip à fade-out |
| `u` | `loadingState` | "show"/"hide" loading |
| `I` | `scaleRatio` | 720/canvas.height |
| `x,B` | `sceneOffsetX/Y` | offset scène zoomée |
| `e` | `bulletDecals` | impacts |
| `_` | `adFlags` | [0,0,0,0] pub déjà vue |
| `F` | `missionAnim` | anim panel mission |
| `S` | `unlockedMission` | max mission débloquée (1-20) |
| `v` | `hintsLeft` | indices restants |
| `C` | `currentMission` | mission en cours 1-20 |
| `a` | `totalScore` | somme scores |
| `h` | `bulletsLeft` | balles restantes |
| `r` | `popupMode` | raison popup |
| `H` | `missionPage` | page 1-4 (5 missions/page) |
| `M` | `timeLeft` | temps restant |
| `P` | `headshots` | nb headshots |
| `G` | `shotsFired` | tirs totaux |
| `D` | `kills` | ennemis tués |
| `E` | `scoutTimer` | timer scout |
| `L` | `activeScout` | scout actif |
| `Y` | `scoutWarnCountdown` | compte warning |
| `J` | `hostageId` | otage lié |
| `X` | `MISSION_TIME` | temps par mission |
| `R` | `MISSION_SCORE` | score par mission (save) |
| `N` | `MISSION_BULLETS` | balles par mission |
| `k` | `scoutList` | liste scouts |
| `O` | `isMobile` | détection mobile |

---

## Comment lire
1. Lire `js/config.js` → comprendre assets
2. Lire `js/missions.js` → format `[type, ..., linked]` 
3. Lire `js/state.js` → état global
4. Lire `js/engine.js` → init
5. Lire `js/gameplay.js` → boucle tick + tir (cœur)
6. Lire `js/ui.js` → interactions

Original beautified gardé tel quel pour preuve.

