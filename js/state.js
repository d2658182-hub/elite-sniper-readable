/**
 * state.js - État global du jeu
 * Original: var w, A, i, p, c, b, m, T, g, f, l, o, d, y, u, I, j, Q, x, B, e, _, F, S, v, C, a, h, r, H, M, P, G, D, E, L, Y, J, X, R, N, k, O
 * Renommé humainement ici, mais mapping conservé en commentaire
 */

import { MISSION_TIME_TICKS, MISSION_SCORES_INIT, MISSION_BULLETS } from './missions.js';

// === RÉFÉRENCE JEU (w = this) ===
export let game = null; // sera assigné à `this` dans frame_0 (lib.assets instance)
export function setGame(instance) { game = instance; }

// === SCÈNES (A = [sceneNormale, sceneZoom5x]) ===
export let scenes = []; // A[0]= lib["scene"+C] scale 0.4 à (128,72), A[1]= lib["scene"+C] scale 2 à (-1920,-1080)
export let sceneOffsetX = 0; // x = Math.round(A[1].x) - pour parallax
export let sceneOffsetY = 0; // B = Math.round(A[1].y)

// === FLAGS BOOLÉENS ===
export let soundOn = true;            // i
export let isPaused = false;          // p
export let isGameOver = false;        // c
export let isInGame = false;          // b - en mission active
export let isScoped = false;          // m - lunette ouverte
export let isAiming = false;          // T - en train de viser (scope drag)
export let isDraggingJoystick = false;// g - mobile joystick
export let isAlertActive = false;     // f - alerte jaune active

// === UI / VISUEL ===
export let hintMarker = null;         // l = new lib.symbol_mc (marqueur hint)
export let hintEnemyId = 0;           // o - id ennemi hinté
export let fadeInTarget = "";         // d - nom clip à fadeIn (ex: "pop", "home")
export let fadeOutTarget = "";        // y - nom clip à fadeOut
export let loadingState = "";         // u - "show"/"hide" alpha 0-1
export let missionAnim = 0;           // F - 0 idle, 1 scale down, 2 fade, 3 done
export let missionPage = 1;           // H - page 1..4 (5 missions/page)

// === PROGRESSION ===
export let unlockedMission = 1;       // S - max mission débloquée, save localStorage.mission_58675
export let hintsLeft = 5;             // v - indices, +2 par mission réussie, save hint_58675
export let currentMission = 0;        // C - mission en cours 1-20
export let totalScore = 0;            // a - somme R, affiché TOTAL SCORE
export let bulletsLeft = 0;           // h - balles restantes = N[C]
export let popupMode = 0;             // r - raison popup (2=confirm mission, 3=timeout, 4=no bullets...)
export let timeLeft = 0;              // M - temps restant (ticks 500ms)
export let headshots = 0;             // P - headshots comptés
export let shotsFired = 0;            // G - tirs totaux
export let kills = 0;                 // D - tués
export let scoutTimer = 0;            // E - timer avant apparition scout
export let activeScout = 0;           // L - id scout actif avec warning jaune
export let scoutWarnCountdown = 0;    // Y - 620 ticks avant échec si scout pas tué
export let hostageId = 0;             // J - otage lié (type 6)

// === DONNÉES ===
export let missionScores = [...MISSION_SCORES_INIT]; // R[0..20], save localStorage["score_"+t+"_58675"]
export let scoutList = [];            // k - liste ids scouts (type 4) pour mission
export const MISSION_TIME = MISSION_TIME_TICKS; // X
export const MISSION_BULLETS_DATA = MISSION_BULLETS; // N

// === TECHNIQUE ===
export let scaleRatio = 1;            // I = 720/canvas.height - pour mouse*I
export let scopeBaseX = 0;            // j = Math.round(point_mc.x) origine
export let scopeBaseY = 0;            // Q = Math.round(point_mc.y)
export let bulletDecals = [];         // e - tableau impacts new lib.mark_mc
export let adFlags = [0,0,0,0];       // _ - pub déjà proposée [timeout, noBullets, cam, scout]
export let isMobile = false;          // O - /Android|iPhone|iPad/...

// === SETTERS (pour mutation depuis gameplay) ===
export const State = {
    set: (key, val) => {
        switch(key) {
            case 'soundOn': soundOn = val; break;
            case 'isPaused': isPaused = val; break;
            case 'isGameOver': isGameOver = val; break;
            case 'isInGame': isInGame = val; break;
            case 'isScoped': isScoped = val; break;
            case 'isAiming': isAiming = val; break;
            case 'isDraggingJoystick': isDraggingJoystick = val; break;
            case 'isAlertActive': isAlertActive = val; break;
            case 'hintEnemyId': hintEnemyId = val; break;
            case 'fadeInTarget': fadeInTarget = val; break;
            case 'fadeOutTarget': fadeOutTarget = val; break;
            case 'loadingState': loadingState = val; break;
            case 'missionAnim': missionAnim = val; break;
            case 'missionPage': missionPage = val; break;
            case 'unlockedMission': unlockedMission = val; break;
            case 'hintsLeft': hintsLeft = val; break;
            case 'currentMission': currentMission = val; break;
            case 'totalScore': totalScore = val; break;
            case 'bulletsLeft': bulletsLeft = val; break;
            case 'popupMode': popupMode = val; break;
            case 'timeLeft': timeLeft = val; break;
            case 'headshots': headshots = val; break;
            case 'shotsFired': shotsFired = val; break;
            case 'kills': kills = val; break;
            case 'scoutTimer': scoutTimer = val; break;
            case 'activeScout': activeScout = val; break;
            case 'scoutWarnCountdown': scoutWarnCountdown = val; break;
            case 'hostageId': hostageId = val; break;
            case 'scaleRatio': scaleRatio = val; break;
            default: console.warn("State unknown", key);
        }
    },
    get: (key) => {
        const map = { soundOn, isPaused, isGameOver, isInGame, isScoped, isAiming, isDraggingJoystick, isAlertActive, hintEnemyId, fadeInTarget, fadeOutTarget, loadingState, missionAnim, missionPage, unlockedMission, hintsLeft, currentMission, totalScore, bulletsLeft, popupMode, timeLeft, headshots, shotsFired, kills, scoutTimer, activeScout, scoutWarnCountdown, hostageId, scaleRatio, scopeBaseX, scopeBaseY };
        return map[key];
    }
};

// === PERSISTANCE (localStorage comme original) ===
export function loadProgress() {
    if (localStorage.getItem("game_58675") !== null) {
        unlockedMission = Number(localStorage.getItem("mission_58675")) || 1;
        hintsLeft = Number(localStorage.getItem("hint_58675")) || 5;
        for (let t=1; t<=20; t++) {
            missionScores[t] = Number(localStorage.getItem(`score_${t}_58675`)) || 0;
        }
    } else {
        // première fois
        localStorage.setItem("game_58675", "1");
        localStorage.setItem("mission_58675", String(unlockedMission));
        localStorage.setItem("hint_58675", String(hintsLeft));
        for (let t=1; t<=20; t++) localStorage.setItem(`score_${t}_58675`, "0");
    }
    recalcTotalScore();
}

export function saveProgress() {
    localStorage.setItem("mission_58675", String(unlockedMission));
    localStorage.setItem("hint_58675", String(hintsLeft));
    for (let t=1; t<=20; t++) localStorage.setItem(`score_${t}_58675`, String(missionScores[t]));
}

export function recalcTotalScore() {
    totalScore = missionScores.reduce((sum, v) => sum+v, 0);
    return totalScore;
}
