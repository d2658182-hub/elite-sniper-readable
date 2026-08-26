/**
 * engine.js - Moteur CreateJS + Init
 * Original: début de frame_0 (lignes 33211-33500) dans assets.js
 * Fait : setup canvas, responsive, sons, mobile detect, cache UI refs
 */

import { GAME_CONFIG, SOUND_MANIFEST, GAME_ANALYTICS, CANVAS_ID } from './config.js';
import { setGame, State, loadProgress, recalcTotalScore } from './state.js';
import { updateMissionPanel, refreshTotalScore } from './ui.js';

// Alias pour lisibilité : game = w (this)
let game = null;

export function initEngine(instance) {
    game = instance;
    setGame(instance);

    // === CACHE UI REFS (comme original frame_0 début) ===
    // Ces alias évitent `this.loading.loading_mc` partout
    game.loading_mc = game.loading.loading_mc;
    game.logo = game.logo.logo || game.logo; // hack Animate : parent check
    game.landscape_mc = game.landscape.landscape_mc;
    game.txt = game.txt.txt || game.txt;
    game.tips = game.tips.tips || game.tips;
    game.pop = game.pop.pop || game.pop;
    game.home = game.home.home || game.home;
    game.mission = game.mission.mission || game.mission;
    game.stop_mc = game._stop.stop_mc;
    game.result = game.result.result || game.result;
    game.fail = game.fail.fail || game.fail;
    game.tutorial = game.tutorial.tutorial || game.tutorial;
    game.circle_mc = game.panel.circle_mc;
    game.wheel_btn = game.panel.wheel_btn;
    game.aim_btn = game.panel.aim_btn;
    game.fire_btn = game.panel.fire_btn;
    // UI counters
    game.army1_mc = game.ui.army1_mc; game.army1_txt = game.ui.army1_txt;
    game.bullet_mc = game.ui.bullet_mc;
    game.info_mc = game.ui.info_mc;
    game.army2_mc = game.ui.army2_mc; game.army2_txt = game.ui.army2_txt;
    game.army3_mc = game.ui.army3_mc; game.army3_txt = game.ui.army3_txt;
    game.army4_mc = game.ui.army4_mc; game.army4_txt = game.ui.army4_txt;
    game.army5_mc = game.ui.army5_mc; game.army5_txt = game.ui.army5_txt;
    game.army6_mc = game.ui.army6_mc; game.army6_txt = game.ui.army6_txt;
    game.headshot_mc = game.ui.headshot_mc;
    game.sight_mc = game.sight.sight_mc;
    game.stop_btn = game.btn.stop_btn;
    game.hint_btn = game.btn.hint_btn;
    game.scene5x = game.scene5x.scene5x || game.scene5x;
    game.point_mc = game.point.point_mc;
    game.sign = game.sign.sign || game.sign;
    game.scene = game.scene.scene || game.scene;

    // === ÉTAT INITIAL ===
    game.stop();
    game.sight_mc.visible = false;
    game.point_mc.mouseEnabled = false;
    stage.canvas.style.cursor = "default";

    // === MOBILE DETECT (isMobile = O) ===
    const ua = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|PlayBook|BlackBerry/i.test(ua);
    State.set('isMobile', isMobile); // on stocke dans module state via hack
    // workaround: state.js isMobile est let, on l'exporte mais pas via State.set, on le fait direct
    // on expose global pour autres modules
    window.__IS_MOBILE = isMobile;

    createjs.Touch.enable(stage);

    // === SONS ===
    createjs.Sound.on("fileload", onSoundLoaded);
    SOUND_MANIFEST.forEach(s => createjs.Sound.registerSound(s));

    // === ANALYTICS ===
    if (typeof GameAnalytics !== 'undefined') {
        GameAnalytics("setEnabledInfoLog", true);
        GameAnalytics("initialize", GAME_ANALYTICS.gameKey, GAME_ANALYTICS.secretKey);
        GameAnalytics("configureBuild", GAME_ANALYTICS.build);
    }

    // === LOAD PROGRESS ===
    loadProgress();

    // === ÉCRAN LOADING 2.5s puis HOME ===
    game.loading_mc.visible = false;
    setTimeout(() => {
        // détermine page mission initiale
        const unlocked = State.get('unlockedMission');
        let page = 1;
        if (unlocked <=5) page=1; else if (unlocked<=10) page=2; else if (unlocked<=15) page=3; else page=4;
        State.set('missionPage', page);

        updateMissionPanel(game);
        refreshTotalScore(game);

        // hide popups
        game.loading_mc.visible = false;
        game.pop.visible = false;
        game.result.visible = false;
        game.fail.visible = false;
        game.stop_mc.visible = false;
        game.tutorial.visible = false;
        game.landscape_mc.visible = false;
        // sons UI
        game.mission.soundon_btn.visible = false;
        game.mission.soundoff_btn.visible = true;
        game.stop_mc.soundon_btn.visible = false;
        game.stop_mc.soundoff_btn.visible = true;

        if (!isMobile) {
            game.circle_mc.visible = false;
            game.wheel_btn.visible = false;
            game.aim_btn.visible = false;
            game.fire_btn.visible = false;
        } else {
            if (window.innerWidth < window.innerHeight) game.landscape_mc.visible = true;
        }

        // anim home scene en boucle (léger drift)
        startHomeDrift();

        // branchement handlers
        import('./ui.js').then(m => m.bindAllHandlers(game));

        // show loading fade
        game.loading_mc.visible = true;
        game.loading_mc.alpha = 0;
        State.set('loadingState', 'show');
        animateLoadingFade();

        setTimeout(() => {
            game.logo.visible = false;
            State.set('loadingState', 'hide');
            playSound("theme");
        }, 2500);

    }, 2500);
}

function onSoundLoaded(e) {
    // callback fileload, original Kt()
    // console.log("sound loaded", e.id);
}

export function playSound(id, volume=1) {
    if (!State.get('soundOn')) return;
    try { createjs.Sound.play(id, {volume}); } catch(e) {}
}

export function stopAllSounds() {
    try { createjs.Sound.stop(); } catch(e) {}
}

// === RESPONSIVE (extrait de index.html makeResponsive) ===
// Déjà dans index.html, mais logique rappelée ici :
// canvas.width = w * pRatio * sRatio; stage.scaleX = pRatio*sRatio
// w=1280, h=720, sRatio = min(iw/w, ih/h) si fit

function animateLoadingFade() {
    // gère u = "show"/"hide" dans tick
    // fait ici via ticker : on laisse gameplay.js gérer le tick global
}

function startHomeDrift() {
    // original jt() : tween aléatoire de home.scene x/y en boucle
    function drift() {
        const tx = 80 - Math.random()*160;
        const ty = 120 - Math.random()*240;
        createjs.Tween.get(game.home.scene).to({x:tx},1200, createjs.Ease.linear);
        createjs.Tween.get(game.home.scene).to({y:ty},1200, createjs.Ease.quadOut).call(drift);
    }
    drift();
}

// === UTILS ===
export function focusCanvas() {
    // original ut() : refocus si perdu (pub)
    if (!document.hasFocus()) {
        document.getElementById("container_background")?.focus();
        document.getElementById(CANVAS_ID)?.focus();
    }
}
