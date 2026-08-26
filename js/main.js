/**
 * main.js - Point d'entrée propre
 * Remplace le gros frame_0 monolithique par imports ESM lisibles
 * Charge CreateJS, puis branche le game
 */

import { GAME_CONFIG, CANVAS_ID } from './config.js';
import { initEngine } from './engine.js';
import { initGameplay } from './gameplay.js';
import * as State from './state.js';

// === SETUP STAGE (comme index.html original) ===
const canvas = document.getElementById(CANVAS_ID);
const stage = new createjs.Stage(canvas);
window.stage = stage; // global pour compatibilité assets.js

// Ticker
createjs.Ticker.framerate = GAME_CONFIG.fps;
createjs.Ticker.addEventListener("tick", onTick);

// Composition AdobeAn (simulé)
const lib = window.lib; // vient de assets.js original, mais ici on le garde
// Pour version 100% refactor, on importerait lib depuis sprites.js

// === INIT GAME INSTANCE ===
// En version refactor complète, on instancierait `new lib.assets()`
// Ici on garde le lib.assets original pour compat mais avec état externe

// On attend que AdobeAn composition soit prête
function start() {
    const comp = AdobeAn.getComposition("28B497B60847774D94E996E7A9D3CF54");
    const libRef = comp.getLibrary();
    const exportRoot = new libRef.assets();
    stage.addChild(exportRoot);

    // Branche les modules lisibles
    initEngine(exportRoot);
    initGameplay(exportRoot, State);

    // Responsive déjà dans index.html, mais on le rappelle
    window.addEventListener('resize', () => {
        // makeResponsive(true,'both',true,1) déjà branché dans index.html
    });
}

// === TICK GLOBAL (remplace le gros this.on("tick",function(){...}) de 600 lignes) ===
function onTick(event) {
    const game = window.stage?.getChildAt(0); // exportRoot
    if (!game) return;

    // 1. Visée (souris + joystick mobile)
    handleAim(game);

    // 2. Scout timer
    handleScout(game);

    // 3. Loading fade
    handleLoadingFade(game);

    // 4. Mission panel anim
    handleMissionAnim(game);

    // 5. FadeIn/FadeOut générique
    handleFades(game);

    stage.update(event);
}

function handleAim(game) {
    if (!State.isInGame || State.isPaused) return;
    const scale = 720 / canvas.height;
    State.scaleRatio = scale;

    if (!window.__IS_MOBILE && !State.isAiming) {
        // desktop souris directe
        game.point_mc.x = stage.mouseX * scale;
        game.point_mc.y = stage.mouseY * scale;
    }
    if (window.__IS_MOBILE && State.isDraggingJoystick) {
        // joystick virtuel (code original g)
        const dx = stage.mouseX*scale - game.wheel_btn.x;
        const dy = stage.mouseY*scale - game.wheel_btn.y;
        let dist = Math.sqrt(dx*dx+dy*dy);
        const ang = Math.atan2(dy,dx);
        if (dist>80) dist=80;
        const ax = Math.cos(ang)*dist;
        const ay = Math.sin(ang)*dist;
        game.wheel_btn.x += (180+ax - game.wheel_btn.x)/2;
        game.wheel_btn.y += (560+ay - game.wheel_btn.y)/2;
        game.point_mc.x += ax/10;
        game.point_mc.y += ay/10;
        game.point_mc.x = Math.max(0, Math.min(1280, game.point_mc.x));
        game.point_mc.y = Math.max(0, Math.min(720, game.point_mc.y));
    } else if (window.__IS_MOBILE) {
        game.wheel_btn.x += (180 - game.wheel_btn.x)/2;
        game.wheel_btn.y += (560 - game.wheel_btn.y)/2;
    }

    // parallax scène zoomée suit point_mc
    if (!State.isAiming && game.__scenes) {
        const rx = Math.round(game.point_mc.x);
        const ry = Math.round(game.point_mc.y);
        const sx = State.scopeBaseX, sy = State.scopeBaseY;
        const sceneZoom = game.__scenes[1];
        // original: A[1].x += (x + (j - r)*5 - A[1].x)/10
        const ox = game.__sceneOffsetX, oy = game.__sceneOffsetY;
        if (rx <= State.scopeBaseX) sceneZoom.x += (ox + (sx - rx)*5 - sceneZoom.x)/10;
        else sceneZoom.x += (ox - (rx - sx)*5 - sceneZoom.x)/20;
        if (ry <= State.scopeBaseY) sceneZoom.y += (oy + (sy - ry)*5 - sceneZoom.y)/10;
        else sceneZoom.y += (oy - (ry - sy)*5 - sceneZoom.y)/20;
    }
}

function handleScout(game){
    if (!State.isInGame || State.scoutList.length===0) return;
    if (State.scoutTimer>0) {
        State.scoutTimer--;
        if (State.scoutTimer<=0) {
            State.scoutTimer = Math.floor(1280+Math.random()*280);
            const idx = Math.floor(Math.random()*State.scoutList.length);
            const scoutId = State.scoutList[idx];
            State.activeScout = scoutId;
            game.__scenes[1]["warning"+scoutId+"_mc"].visible=true;
            try{ createjs.Sound.play("alert",{volume:0.5}); }catch(e){}
            game.army4_mc.warn.visible=true;
            State.scoutWarnCountdown = 620;
        }
    }
    if (State.activeScout!==0) {
        if (State.scoutWarnCountdown>0) State.scoutWarnCountdown--;
        if (State.scoutWarnCountdown<=0) {
            if (!State.isAlertActive) {
                // trigger fail scout
            } else {
                game.__scenes[1]["warning"+State.activeScout+"_mc"].visible=false;
                game.army4_mc.warn.visible=false;
                State.activeScout=0;
            }
        }
    }
}

function handleLoadingFade(game){
    if (State.loadingState==="show" && game.loading_mc.alpha<1) game.loading_mc.alpha+=0.1;
    if (State.loadingState==="hide" && game.loading_mc.alpha>0) {
        game.loading_mc.alpha-=0.1;
        if (game.loading_mc.alpha<=0) game.loading_mc.visible=false;
    }
}

function handleMissionAnim(game){
    // original F 1-3
    if (State.missionAnim===1) {
        game.mission.visible=true;
        game.mission.map.gotoAndPlay(1);
        game.mission.panel.alpha=0;
        game.mission.scaleX=game.mission.scaleY=1.5;
        State.missionAnim=2;
    } else if (State.missionAnim===2) {
        if (game.mission.scaleX>1) {
            game.mission.scaleX-=0.05;
            game.mission.scaleY=game.mission.scaleX;
        }
        if (game.mission.scaleX<=1) {
            game.mission.scaleX=game.mission.scaleY=1;
            State.missionAnim=3;
        }
    } else if (State.missionAnim===3) {
        game.mission.panel.alpha+=0.05;
        if (game.mission.panel.alpha>=1) State.missionAnim=0;
    }
}

function handleFades(game){
    // générique d/y (fadeInTarget/fadeOutTarget)
    if (State.fadeInTarget) {
        const t = State.fadeInTarget;
        if (game[t]) {
            game[t].alpha+=0.05;
            if (game[t].scaleX<1) { game[t].scaleX+=0.05; game[t].scaleY+=0.05; }
            if (game[t].alpha>=1) {
                game[t].scaleX=game[t].scaleY=1;
                State.fadeInTarget="";
            }
        }
    }
    if (State.fadeOutTarget) {
        const t = State.fadeOutTarget;
        if (game[t]) {
            game[t].alpha-=0.05;
            game[t].scaleX+=0.05; game[t].scaleY+=0.05;
            if (game[t].alpha<=0) {
                game[t].visible=false;
                game[t].scaleX=game[t].scaleY=1;
                game[t].alpha=1;
                State.fadeOutTarget="";
            }
        }
    }
}

// Lance au load
window.addEventListener('load', start);
