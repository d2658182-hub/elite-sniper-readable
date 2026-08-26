/**
 * gameplay.js - CŒUR DU JEU : boucle tick, visée, tir, ennemis, timers, score
 * Original: gros blocs dans frame_0 + les handlers W(), Qt(), Mt(), etc.
 * Renommé humainement, commenté en français
 */

import { MISSIONS_RAW, MISSION_TIME_TICKS, MISSION_BULLETS } from './missions.js';

// State sera importé dynamiquement pour éviter cycle
let game = null;
let State = null;

export function initGameplay(instance, stateModule) {
    game = instance;
    State = stateModule;
}

// ============================================================================
// 1. LANCEMENT MISSION (original Qt())
// ============================================================================
export function startMission(missionId) {
    const missionData = MISSIONS_RAW[missionId];
    if (!missionData) return;

    console.log(`[MISSION] Start ${missionId}`, describeMission(missionId));

    // Analytics
    if (typeof GameAnalytics !== 'undefined') GameAnalytics("addDesignEvent", "StartMission"+missionId, 1);

    // Crée 2 calques scène : normale (0.4) et zoom 5x (2) comme original
    // A[0] et A[1] = new lib["scene"+C]
    const sceneNormal = new lib["scene"+missionId]();
    const sceneZoom   = new lib["scene"+missionId]();
    sceneNormal.scaleX = sceneNormal.scaleY = 0.4;
    sceneNormal.x = 128.05; sceneNormal.y = 72.05;
    sceneZoom.scaleX = sceneZoom.scaleY = 2;
    sceneZoom.x = -1920; sceneZoom.y = -1080;

    game.scene.addChild(sceneNormal);
    game.scene5x.addChild(sceneZoom);

    // stocke pour tick
    game.__scenes = [sceneNormal, sceneZoom];
    game.__sceneOffsetX = Math.round(sceneZoom.x);
    game.__sceneOffsetY = Math.round(sceneZoom.y);
    sceneNormal.addChild(game.__hintMarker || new lib.symbol_mc());
    sceneNormal.visible = false;
    sceneZoom.visible = false;
    game.sight_mc.visible = false;

    // reset flags
    State.set('isInGame', true);
    State.set('isGameOver', false);
    State.set('isPaused', false);
    State.set('isScoped', false);
    State.set('isAlertActive', false);
    State.set('hintEnemyId', 0);
    State.set('activeScout', 0);
    State.set('scoutWarnCountdown', 0);
    State.set('headshots', 0);
    State.set('shotsFired', 0);
    State.set('kills', 0);
    State.set('scoutTimer', 0);
    State.set('hostageId', 0);
    State.set('timeLeft', MISSION_TIME_TICKS[missionId]);
    State.set('bulletsLeft', MISSION_BULLETS[missionId]);
    State.set('currentMission', missionId);
    State.set('adFlags', [0,0,0,0]);
    game.__bulletDecals = [];
    // reset armies
    [1,2,3,4,5,6].forEach(n => game[`army${n}`] = 0);

    // UI
    game.info_mc.mission_txt.text = "Mission"+missionId;
    game.info_mc.time_mc.gotoAndStop(99);
    game.fire_btn.alpha = 0.5;
    game.__killsNeeded = 0;

    // init ennemis après 1ms (setTimeout 1)
    setTimeout(() => initEnemies(missionId, sceneNormal, sceneZoom), 1);
}

function describeMission(id) {
    const d = MISSIONS_RAW[id];
    return `${d.length-1} ennemis`;
}

function initEnemies(missionId, sceneNormal, sceneZoom) {
    const data = MISSIONS_RAW[missionId];
    const scoutList = [];
    game.__scoutList = scoutList;

    // compte armies + setup sprites
    for (let i=1; i<data.length; i++) {
        const type = data[i][0];
        // reset état vivant
        sceneZoom["enemy"+i+"_mc"].gotoAndPlay("Stand="+data[i][2]);
        game[`scene${missionId}_arr`][i][1] = 1; // vivant
        sceneNormal["enemy"+i+"_mc"].visible = false;

        if (type===1) game.army1++;
        if (type===2) {
            data[i][2] = data[i][3]; // direction -> block
            startPatrol(i, 1);
            game.army2++;
        }
        if (type===3) game.army3++;
        if (type===4) {
            game.army4++;
            scoutList.push(i);
        }
        if (type===5) {
            data[i][2] = data[i][3];
            sceneZoom["enemy"+i+"_mc"].gotoAndPlay("stand="+data[i][2]);
            startPatrol(i,1);
            game.army5++;
        }
        if (type===6) {
            sceneZoom["enemy"+i+"_mc"].gotoAndPlay("stand="+data[i][2]);
            game.army6++;
        }
    }

    // UI counters
    game.army1_txt.text = String(game.army1);
    game.army1_mc.warn.visible = false;
    for (let n=2; n<=6; n++) {
        if (game[`army${n}`] > 0) {
            game[`army${n}_mc`].gotoAndStop(n-1);
            game[`army${n}_mc`].visible = true;
            game[`army${n}_mc`].warn.visible = false;
            game[`army${n}_txt`].text = String(game[`army${n}`]);
        }
    }
    // warnings scouts cachés
    scoutList.forEach(id => {
        sceneNormal["warning"+id+"_mc"].visible = false;
        sceneZoom["warning"+id+"_mc"].visible = false;
    });
    if (scoutList.length>0) {
        State.set('scoutTimer', Math.floor(640+Math.random()*260));
    }
    game.bullet_mc.txt.text = String(State.get('bulletsLeft')).padStart(2,'0');
    game.hint_btn.txt.text = String(State.get('hintsLeft'));

    sceneNormal.visible = true;
    startCountdown();
    stage.canvas.style.cursor = "none";

    // tuto mission 1
    if (missionId===1 && State.get('unlockedMission')===1) {
        const isMobile = window.__IS_MOBILE;
        if (!isMobile) game.tutorial.gotoAndPlay("Step=1P");
        else game.tutorial.gotoAndPlay("Step=1M");
        if (typeof GameAnalytics!=='undefined') GameAnalytics("addDesignEvent","StartTutorial",1);
        game.tutorial.visible = true;
        game.tutorial.scaleX = game.tutorial.scaleY = 0.5;
        game.tutorial.alpha = 0;
        State.set('fadeInTarget', 'tutorial');
        State.set('isPaused', true);
        stage.canvas.style.cursor = "default";
    }
}

// ============================================================================
// 2. PATROUILLE (original St(n,s))
// ============================================================================
function startPatrol(enemyId, dir) {
    // dir 0 = gauche, 1 = droite, déplace de ±100px +57y
    const sceneNormal = game.__scenes[0];
    const sceneZoom = game.__scenes[1];
    const missionId = State.get('currentMission');
    const arr = game[`scene${missionId}_arr`];
    const targetX = arr[enemyId][2]===1 ? sceneNormal["enemy"+enemyId+"_mc"].x -100 : sceneNormal["enemy"+enemyId+"_mc"].x +100;
    // note: original fait x±100 et y±57 selon direction
}

export function startEnemyPatrol(enemyId, side) {
    const missionId = State.get('currentMission');
    const arr = game[`scene${missionId}_arr`];
    const sceneNormal = game.__scenes[0];
    const sceneZoom = game.__scenes[1];
    if (!sceneNormal) return;
    const enemyN = sceneNormal["enemy"+enemyId+"_mc"];
    const enemyZ = sceneZoom["enemy"+enemyId+"_mc"];
    const dir = arr[enemyId][2];
    const destX = side===0 ? enemyN.x -100 : enemyN.x +100;
    const destY = dir===1 ? enemyN.y +57 : enemyN.y -57;

    enemyN.gotoAndPlay("Run="+dir);
    enemyZ.gotoAndPlay("Run="+dir);
    createjs.Tween.get(enemyN).to({x:destX, y:destY}, 1600, createjs.Ease.linear).call(()=>{
        if (arr[enemyId][1]===1 && enemyZ.currentLabel!=="Block") {
            enemyN.gotoAndPlay("Stand="+dir);
            enemyZ.gotoAndPlay("Stand="+dir);
        }
        setTimeout(()=>{
            if (arr[enemyId][1]===1 && enemyZ.currentLabel!=="Block") {
                arr[enemyId][2] = arr[enemyId][2]===1 ? 2 : 1;
                startEnemyPatrol(enemyId, side===0?1:0);
            }
        }, 900);
    });
    createjs.Tween.get(enemyZ).to({x:destX, y:destY}, 1600, createjs.Ease.linear);
}

// ============================================================================
// 3. COMPTE À REBOURS (original W())
// ============================================================================
export function startCountdown() {
    const tick = () => {
        if (State.get('isGameOver') || State.get('timeLeft')<=0) return;
        // décrémente toutes les 500ms
        setTimeout(()=>{
            if (State.get('isGameOver')) return;
            if (State.get('timeLeft')>0) {
                State.set('timeLeft', State.get('timeLeft')-1);
                // UI time
                const pct = Math.round(State.get('timeLeft')/MISSION_TIME_TICKS[State.get('currentMission')]*100);
                game.info_mc.time_mc.gotoAndStop(pct-1);
                // vérif hostages qui fuient si temps > leur cooldown
                checkHostageEscape();
                if (!State.get('isPaused') && !State.get('isGameOver') && State.get('timeLeft')>0) tick();
                else if (!State.get('isGameOver') && State.get('timeLeft')===0) {
                    handleTimeOver();
                }
            }
        }, 500);
    };
    tick();
}

function checkHostageEscape() {
    const missionId = State.get('currentMission');
    const arr = game[`scene${missionId}_arr`];
    for (let n=1; n<arr.length; n++) {
        if (arr[n][0]===6 && arr[n][1]===1 && arr[n][3]===State.get('timeLeft')) {
            playSound("alert",0.5);
            game.army6_mc.warn.visible = true;
            startHostageRun(n);
            State.set('hostageId', n);
        }
    }
}

function handleTimeOver() {
    State.set('isPaused', true);
    const adFlags = State.get('adFlags');
    if (adFlags[0]===0) {
        // propose pub si pas déjà vu
        let canPlayAd = false;
        try { window.h5api.canPlayAd(e=>{canPlayAd=e.canPlayAd}); } catch(e){}
        setTimeout(()=>{
            game.__scenes[1].visible=false;
            game.sight_mc.visible=false;
            State.set('isScoped', false);
            if (canPlayAd) {
                adFlags[0]=1; State.set('popupMode',3);
                // affiche pop "watch 15s ad to continue"
            } else {
                handleFail("End of mission time", "Please practice more to improve mission efficiency");
            }
        },800);
    } else {
        handleFail("End of mission time", "Please practice more to improve mission efficiency");
    }
}

function handleFail(title, tips) {
    State.set('isGameOver', true);
    game.__scenes[1].visible=false;
    game.sight_mc.visible=false;
    State.set('isScoped', false);
    game.fail.tips.text = "Tips\n"+tips;
    game.fail.txt.text = title;
    setTimeout(()=> showFailScreen(), 800);
}

function showFailScreen() {
    game.fail.mission_txt.text = "Mission"+State.get('currentMission');
    game.fail.visible=true;
    game.fail.scaleX=game.fail.scaleY=0.5;
    game.fail.alpha=0;
    State.set('fadeInTarget','fail');
    stage.canvas.style.cursor="default";
}

// ============================================================================
// 4. TIR (original Mt())
// ============================================================================
export function fireShot() {
    if (!State.get('isInGame') || State.get('isPaused') || State.get('isGameOver')) return;
    if (!State.get('isScoped') || State.get('bulletsLeft')<=0) return;

    const missionId = State.get('currentMission');
    const arr = game[`scene${missionId}_arr`];
    const sceneZoom = game.__scenes[1];
    const sceneNormal = game.__scenes[0];
    const scale = 720 / canvas.height; // I
    let hitSomething = false;

    playSound("shoot",0.7);

    for (let n=1; n<arr.length; n++) {
        if (arr[n][1]!==1) continue; // mort
        const enemyZ = sceneZoom["enemy"+n+"_mc"];
        const pos = sceneZoom.localToGlobal(enemyZ.x, enemyZ.y);
        const sx = Math.round(pos.x * scale);
        const sy = Math.round(pos.y * scale);
        const linked = arr[n][4];

        // === TYPE 3 : caméra (petite hitbox 620-660 x 348-368) ===
        if (arr[n][0]===3) {
            if (sx>620 && sx<=660 && sy>348 && sy<=368) {
                killEnemy(n, sceneNormal, sceneZoom, false);
                hitSomething = true;
                if (linked>0 && arr[linked][1]===1 && !State.get('isAlertActive')) triggerAlert(linked);
            }
        }
        // === TYPE 6 : otage (2 zones) ===
        else if (arr[n][0]===6) {
            if (sx>650 && sx<=700) {
                if (sy>405 && sy<=445) { // headshot haut
                    State.set('headshots', State.get('headshots')+1);
                    game.headshot_mc.spr.txt.text = String(State.get('headshots'));
                    game.headshot_mc.gotoAndPlay("Show");
                    killEnemy(n, sceneNormal, sceneZoom, true, 800);
                    hitSomething=true;
                    if (linked>0) triggerAlert(linked);
                    game.army6_mc.warn.visible=false;
                } else if (sy>370 && sy<=405) { // corps
                    killEnemy(n, sceneNormal, sceneZoom, true, 800);
                    hitSomething=true;
                    if (linked>0) triggerAlert(linked);
                    game.army6_mc.warn.visible=false;
                }
            }
        }
        // === AUTRES TYPES ===
        else if (sx>625 && sx<=655) {
            if (sy>380 && sy<=405) { // headshot
                State.set('headshots', State.get('headshots')+1);
                game.headshot_mc.spr.txt.text = String(State.get('headshots'));
                game.headshot_mc.gotoAndPlay("Show");
                killEnemy(n, sceneNormal, sceneZoom, false, arr[n][0]===4?0:400);
                hitSomething=true;
                if (n===State.get('hintEnemyId')) hideHint();
                if (linked>0 && arr[linked][1]===1) triggerAlert(linked);
                if (n===State.get('activeScout')) clearScout();
            } else if (sy>335 && sy<=380) {
                if (arr[n][0]===5) {
                    // blindé : block
                    State.set('isPaused',true);
                    enemyZ.gotoAndPlay("Block");
                    setTimeout(()=> { if(!State.get('isAlertActive')) triggerAlert(n,true); },1200);
                } else {
                    killEnemy(n, sceneNormal, sceneZoom, false, arr[n][0]===4?0:400);
                    hitSomething=true;
                    if (n===State.get('hintEnemyId')) hideHint();
                    if (linked>0) triggerAlert(linked);
                    if (n===State.get('activeScout')) clearScout();
                }
            }
        }
    }

    // === EFFET RECUL ===
    State.set('isAiming', true);
    const zoom = game.__scenes[1];
    const baseX = zoom.x, baseY = zoom.y;
    const recoilX = zoom.x +30 -Math.random()*60;
    const recoilY = zoom.y +140;
    createjs.Tween.get(zoom).to({x:recoilX, y:recoilY},300, createjs.Ease.quartOut)
        .call(()=> createjs.Tween.get(zoom).to({x:baseX, y:baseY},300, createjs.Ease.quartOut)
        .call(()=> State.set('isAiming', false)));

    // décrémente balles
    if (hitSomething) State.set('kills', State.get('kills')+1);
    State.set('bulletsLeft', State.get('bulletsLeft')-1);
    State.set('shotsFired', State.get('shotsFired')+1);
    updateBulletUI();
    // check fin de balles
    if (State.get('bulletsLeft')===0 && !State.get('isGameOver')) handleOutOfBullets();
}

function killEnemy(id, sceneNormal, sceneZoom, isHostage=false, delay=400) {
    const missionId = State.get('currentMission');
    const arr = game[`scene${missionId}_arr`];
    sceneZoom["enemy"+id+"_mc"].gotoAndPlay(isHostage? "Dead="+arr[id][2] : "Dead="+arr[id][2]);
    sceneNormal["enemy"+id+"_mc"].visible=false;
    spawnMark(sceneNormal["enemy"+id+"_mc"].x, sceneNormal["enemy"+id+"_mc"].y);
    arr[id][1]=0;
    if (arr[id][0]===4) removeScoutFromList(id);
    if (arr[id][0]===2 || arr[id][0]===5 || isHostage) removeTween(id, delay);
    decrementArmy(arr[id][0]);
}

function decrementArmy(type) {
    if (game[`army${type}`]>0) game[`army${type}`]--;
    refreshArmyUI();
    // victoire si tous morts
    let remaining=0;
    for(let n=1;n<=6;n++) if(game[`army${n}_mc`]?.visible) remaining+=game[`army${n}`];
    if (remaining===0) {
        State.set('isGameOver',true);
        State.set('isPaused',true);
        playSound("success",0.8);
        setTimeout(()=> showVictory(),1600);
    }
}

function refreshArmyUI() {
    for(let n=1;n<=6;n++) if(game[`army${n}_mc`]?.visible) {
        game[`army${n}_txt`].text=String(game[`army${n}`]);
    }
}

function spawnMark(x,y) {
    const marks = game.__bulletDecals;
    const idx = marks.length;
    marks.push("mc");
    marks[idx]= new lib.mark_mc();
    game.__scenes[0].addChild(marks[idx]);
    marks[idx].x=x; marks[idx].y=y;
}

function removeTween(id, delay) {
    setTimeout(()=>{
        createjs.Tween.removeTweens(game.__scenes[0]["enemy"+id+"_mc"]);
        createjs.Tween.removeTweens(game.__scenes[1]["enemy"+id+"_mc"]);
    }, delay);
}

function removeScoutFromList(id) {
    const list = game.__scoutList;
    const idx = list.indexOf(id);
    if(idx!==-1) list.splice(idx,1);
    game.__scenes[1]["warning"+id+"_mc"].visible=false;
    game.army4_mc.warn.visible=false;
    if (id===State.get('activeScout')) {
        State.set('activeScout',0);
        State.set('scoutWarnCountdown',0);
        State.set('scoutTimer', Math.floor(640+Math.random()*260));
    }
}

function triggerAlert(linkedId, isBlock=false) {
    // original Rt(t,n)
    State.set('isAlertActive', true);
    playSound("warn",0.8);
    // si pub pas vue, propose ad sinon direct fail "monitored device"
}

function hideHint() {
    game.__hintMarker.visible=false;
    State.set('hintEnemyId',0);
}
function clearScout() {
    game.__scenes[1]["warning"+State.get('activeScout')+"_mc"].visible=false;
    game.army4_mc.warn.visible=false;
    State.set('activeScout',0);
    State.set('scoutWarnCountdown',0);
}

function updateBulletUI() {
    const left = State.get('bulletsLeft');
    game.bullet_mc.txt.text = left>=10? String(left) : "0"+left;
}

function handleOutOfBullets() {
    State.set('isPaused',true);
    const adFlags = State.get('adFlags');
    if (adFlags[1]===0) {
        let canPlayAd=false;
        try{ window.h5api.canPlayAd(e=>canPlayAd=e.canPlayAd);}catch(e){}
        setTimeout(()=>{
            game.__scenes[1].visible=false;
            game.sight_mc.visible=false;
            State.set('isScoped',false);
            if(canPlayAd) { adFlags[1]=1; State.set('popupMode',4); }
            else handleFail("The bullet has been consumed","Please practice more to improve the shooting rate");
        },800);
    } else {
        handleFail("The bullet has been consumed","Please practice more to improve the shooting rate");
    }
}

function showVictory() {
    // original Jt()
    const missionId = State.get('currentMission');
    const timeLeft = State.get('timeLeft');
    const totalTime = MISSION_TIME_TICKS[missionId];
    const elapsed = Math.round((totalTime - timeLeft)/2);
    const accuracy = Math.round(State.get('kills')/State.get('shotsFired')*100) || 0;
    const timeBonus = Math.round(timeLeft/totalTime*5000);
    const headBonus = State.get('headshots')*50;
    const hitBonus = accuracy*10;
    const score = timeBonus+headBonus+hitBonus;

    // save
    const scores = State.get('missionScores'); // via hack
    // ... recalcTotalScore via state.js
    // affiche result_mc
    game.result.mission_txt.text = "Mission"+missionId;
    // etc.
    game.result.visible=true;
    game.result.scaleX=game.result.scaleY=0.5;
    game.result.alpha=0;
    State.set('fadeInTarget','result');
    stage.canvas.style.cursor="default";
}

function playSound(id,vol){ 
    if(!State.get('soundOn')) return;
    try{ createjs.Sound.play(id,{volume:vol}); }catch(e){}
}

function startHostageRun(id){
    // original vt(n) : hostage fuit
    const sceneNormal = game.__scenes[0];
    const sceneZoom = game.__scenes[1];
    const missionId = State.get('currentMission');
    const arr = game[`scene${missionId}_arr`];
    const destX = arr[id][2]===1? sceneNormal["enemy"+id+"_mc"].x -102 : sceneNormal["enemy"+id+"_mc"].x +102;
    const destY = sceneNormal["enemy"+id+"_mc"].y +59;
    createjs.Tween.get(sceneNormal["enemy"+id+"_mc"]).to({x:destX,y:destY},800, createjs.Ease.linear).call(()=>{
        if(arr[id][1]===1){
            if(arr[id][2]===1 && sceneNormal["enemy"+id+"_mc"].x<=-400 || arr[id][2]===2 && sceneNormal["enemy"+id+"_mc"].x>=3000){
                State.set('isPaused',true);
                setTimeout(()=> handleFail("Found by the scout",""),1800);
            } else if(!State.get('isPaused')) startHostageRun(id);
        }
    });
    createjs.Tween.get(sceneZoom["enemy"+id+"_mc"]).to({x:destX,y:destY},800, createjs.Ease.linear);
}
