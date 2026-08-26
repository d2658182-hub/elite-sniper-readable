/**
 * config.js - Configuration moteur Adobe Animate CC
 * Source original: lib.properties dans assets.js:35690
 * Lisible humainement
 */

// === COMPOSITION Adobe Animate ===
export const COMPOSITION_ID = "28B497B60847774D94E996E7A9D3CF54";

// === PROPRIÉTÉS DE SCÈNE ===
export const GAME_CONFIG = {
    width: 1280,
    height: 720,
    fps: 62,               // 62 fps (inhabituel, Animate défaut 24/30/60)
    backgroundColor: "#CCCCCC",
    opacity: 1,
    responsive: {
        enabled: true,
        dimension: 'both', // width + height
        scaleMode: 1,      // 1 = fit (min ratio), 2 = fill (max)
        hidpi: true
    }
};

// === MANIFEST IMAGES (lib.properties.manifest) ===
// Toutes chargées via createjs.LoadQueue. URLs avec ?timestamp pour cache-bust 15613118...
export const IMAGE_MANIFEST = [
    { src: "images/bg.png",               id: "bg" },
    { src: "images/failbox.png",           id: "failbox" },
    { src: "images/line.png",              id: "line" },
    { src: "images/map.png",               id: "map" },
    { src: "images/mirror.png",            id: "mirror" },
    { src: "images/resultbox.png",         id: "resultbox" },
    { src: "images/road016.png",           id: "road016" },
    { src: "images/road017.png",           id: "road017" },
    { src: "images/road018.png",           id: "road018" },
    { src: "images/road019.png",           id: "road019" },
    { src: "images/road020.png",           id: "road020" },
    { src: "images/scene.png",             id: "scene" }, // fond 289k
    { src: "images/screen.png",            id: "screen" },
    // Atlas générés par Animate (spritesheets)
    { src: "images/assets_atlas_.png",     id: "assets_atlas_" },   // 605x605
    { src: "images/assets_atlas_2.png",    id: "assets_atlas_2" },  // 512x416
    { src: "images/assets_atlas_3.png",    id: "assets_atlas_3" },
    { src: "images/assets_atlas_4.png",    id: "assets_atlas_4" },
    { src: "images/assets_atlas_5.png",    id: "assets_atlas_5" },  // 640x300
    { src: "images/assets_atlas_6.png",    id: "assets_atlas_6" },  // 481x370
    { src: "images/assets_atlas_7.png",    id: "assets_atlas_7" },  // 640x240 + 481x370
    { src: "images/assets_atlas_8.png",    id: "assets_atlas_8" },  // 480x180
    { src: "images/assets_atlas_9.png",    id: "assets_atlas_9" },  // 4x 278x248
    { src: "images/assets_atlas_10.png",   id: "assets_atlas_10" },
    { src: "images/assets_atlas_11.png",   id: "assets_atlas_11" },
    { src: "images/assets_atlas_12.png",   id: "assets_atlas_12" }, // 12 frames 116x263 etc
    { src: "images/assets_atlas_13.png",   id: "assets_atlas_13" }, // 22 frames
    { src: "images/assets_atlas_14.png",   id: "assets_atlas_14" }, // 50+ frames
];

// === SPRITESHEETS METADATA (lib.ssMetadata) ===
// Définit découpage atlas en frames, utilisé par CreateJS SpriteSheet
export const SPRITESHEET_META = [
    { name: "assets_atlas_",   frames: [[0,0,605,605]] },
    { name: "assets_atlas_2",  frames: [[0,0,512,416]] },
    { name: "assets_atlas_3",  frames: [[0,0,512,416]] },
    { name: "assets_atlas_4",  frames: [[0,0,512,416]] },
    { name: "assets_atlas_5",  frames: [[0,0,640,300]] },
    { name: "assets_atlas_6",  frames: [[0,0,481,370]] },
    { name: "assets_atlas_7",  frames: [[0,372,640,240],[0,0,481,370]] },
    { name: "assets_atlas_8",  frames: [[0,228,480,180],[0,0,481,226]] },
    { name: "assets_atlas_9",  frames: [[0,0,278,248],[280,250,278,248],[280,0,278,248],[0,250,278,248]] },
    { name: "assets_atlas_10", frames: [[0,0,278,248],[280,0,278,248],[0,250,278,248],[280,250,240,224]] },
    { name: "assets_atlas_11", frames: [[0,226,278,179],[242,0,278,179],[280,181,278,179],[0,407,278,150],[280,362,278,150],[0,0,240,224]] },
    { name: "assets_atlas_12", frames: [[0,162,116,263],[222,0,116,263],[118,377,178,123],[298,377,178,123],[395,167,178,123],[0,502,178,123],[340,0,165,165],[0,0,220,160],[118,265,275,110],[507,0,114,158],[478,460,114,158],[478,292,127,166]] },
    // ... tronqué pour lisibilité, complet dans assets.original.beautified.js lignes 1-170
];

// === MANIFEST SONS ===
export const SOUND_MANIFEST = [
    { id: "theme",   src: "sound/theme.mp3" },   // 327k musique boucle
    { id: "switch",  src: "sound/switch.mp3" },  // 4.2k clic UI
    { id: "shoot",   src: "sound/shoot.mp3" },   // 19k tir
    { id: "alert",   src: "sound/alert.mp3" },   // 3.4k scout warning
    { id: "warn",    src: "sound/warn.mp3" },    // 24k alerte générale
    { id: "success", src: "sound/success.mp3" }, // 56k victoire
];

// === ANALYTICS ===
export const GAME_ANALYTICS = {
    gameKey: "06e62ed8c5796a4848e630340d428ef2",
    secretKey: "1ca7cb679fbe6d3bdf3deae271563b31b4b87420",
    build: "crazygames 20190707"
};

// === CANVAS ===
export const CANVAS_ID = "canvas";
export const CONTAINER_ID = "animation_container";
