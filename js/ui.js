/**
 * ui.js - Interface utilisateur
 * Original: fonctions V(), q(), $, tt(), K() etc. dans frame_0
 * Gère : sélection missions, pagination, sons, pause, hints, popups
 */

let game = null;
let State = null;

export function bindAllHandlers(instance) {
    game = instance;
    // lazy import State pour éviter cycle
    import('./state.js').then(m=> State=m);

    // HOME
    game.home.startgame_btn.addEventListener("mousedown", onStartGame);
    game.home.login_btn.addEventListener("mousedown", ()=> window.h5api?.login(()=>{}));
    game.home.rank_btn.addEventListener("mousedown", onRank);
    game.home.share_btn.addEventListener("mousedown", onShare);

    // MISSION SELECT
    game.mission.pageup_btn.addEventListener("mousedown", onPageUp);
    game.mission.pagedown_btn.addEventListener("mousedown", onPageDown);
    game.mission.home_btn.addEventListener("mousedown", onMissionHome);
    game.mission.soundon_btn.addEventListener("mousedown", onSoundOn);
    game.mission.soundoff_btn.addEventListener("mousedown", onSoundOff);
    game.mission.share_btn.addEventListener("mousedown", onShare);
    game.mission.rank_btn.addEventListener("mousedown", onRank);
    game.mission.submit_btn.addEventListener("mousedown", onSubmitScore);
    for(let i=1;i<=20;i++){
        game.mission.panel["btn"+i].addEventListener("mousedown", e=> onMissionSelect(e, i));
    }

    // IN-GAME
    game.wheel_btn?.addEventListener("mousedown", ()=> State.set('isDraggingJoystick', true));
    game.aim_btn?.addEventListener("mousedown", onAimToggle);
    game.fire_btn?.addEventListener("mousedown", onFireBtn);
    game.panel?.addEventListener("mousedown", ()=>{}); // placeholder
    game.sight_mc.addEventListener("mousedown", ()=>{});
    game.stop_btn.addEventListener("mousedown", onPause);
    game.hint_btn.addEventListener("mousedown", onHint);

    // POPUP
    game.pop.cancel_btn.addEventListener("mousedown", onPopCancel);
    game.pop.confirm_btn.addEventListener("mousedown", onPopConfirm);

    // PAUSE MENU
    game.stop_mc.continue_btn.addEventListener("mousedown", onContinue);
    game.stop_mc.restart_btn.addEventListener("mousedown", onRestart);
    game.stop_mc.mission_btn.addEventListener("mousedown", onStopToMissions);
    game.stop_mc.soundon_btn.addEventListener("mousedown", onSoundOn);
    game.stop_mc.soundoff_btn.addEventListener("mousedown", onSoundOff);

    // FAIL / RESULT
    game.fail.restart_btn.addEventListener("mousedown", onFailRestart);
    game.fail.mission_btn.addEventListener("mousedown", onFailToMissions);
    game.fail.share_btn.addEventListener("mousedown", onShare);
    game.fail.rank_btn.addEventListener("mousedown", onRank);
    game.result.mission_btn.addEventListener("mousedown", onResultToMissions);
    game.result.next_btn.addEventListener("mousedown", onNextMission);
    game.result.submit_btn.addEventListener("mousedown", onSubmitScore);
    game.result.share_btn.addEventListener("mousedown", onShare);
    game.result.rank_btn.addEventListener("mousedown", onRank);
    game.tutorial.skip_btn.addEventListener("mousedown", onSkipTutorial);
    game.landscape_mc.addEventListener("mousedown", ()=> { playSound("switch"); game.landscape_mc.visible=false; });

    // GLOBAL MOUSE
    game.on("mousedown", onGlobalMouseDown);
    game.on("pressup", ()=> State.set('isDraggingJoystick', false));
}

// === MISSION PANEL ===

export function updateMissionPanel(g) {
    // original U()
    const page = g.__missionPage || State.get('missionPage') || 1;
    const unlocked = State.get('unlockedMission');
    // 5 missions par page : page1=1-5, page2=6-10, etc.
    const toShow = [];
    for(let n=1; n<=5; n++) {
        const id = n + (page-1)*5;
        if (id<=20) toShow.push(id);
    }
    // clear
    for(let n=1;n<=5;n++){
        g.mission["mission"+n+"_txt"].text="";
        g.mission["point"+n+"_txt"].text="";
    }
    for(let n=1;n<=20;n++){
        g.mission.panel["btn"+n].visible=false;
        g.mission.panel["btn"+n].alpha = n>unlocked ? 0.2 : 1;
    }
    toShow.forEach((missionId, idx)=>{
        const slot = idx+1;
        const label = missionId<10? "0"+missionId : String(missionId);
        g.mission["mission"+slot+"_txt"].text = label;
        // scores
        import('./state.js').then(s=> {
            g.mission["point"+slot+"_txt"].text = "SCORE:"+s.missionScores[missionId];
        });
        g.mission.panel["btn"+missionId].visible=true;
    });
    g.mission.pageup_btn.visible = page>1;
    g.mission.pagedown_btn.visible = page<4;
}

export function refreshTotalScore(g) {
    import('./state.js').then(s=>{
        const total = s.recalcTotalScore();
        g.mission.score_txt.text = "TOTAL SCORE:"+total;
        g.mission.submit_btn.alpha = total>0 ? 1 : 0.2;
    });
}

function onMissionSelect(e, missionId) {
    if (e.currentTarget.currentFrame!==0 || e.currentTarget.alpha!==1) return;
    e.currentTarget.gotoAndPlay(1);
    playSound("switch",0.8);
    setTimeout(()=>{
        e.currentTarget.gotoAndStop(0);
        State.set('currentMission', missionId);
        State.set('popupMode', 2);
        game.pop.txt.text = "Do you want to perform the mission "+missionId+"\n";
        game.pop.tips.text = "";
        game.pop.alpha=0; game.pop.scaleX=game.pop.scaleY=0.5;
        game.pop.visible=true; game.pop.cancel_btn.visible=true;
        State.set('fadeInTarget','pop');
    },300);
}

function onPageUp(e){
    if(e.currentTarget.currentFrame!==0) return;
    e.currentTarget.gotoAndPlay(1); playSound("switch",0.8);
    const page = State.get('missionPage');
    if(page>1) State.set('missionPage', page-1);
    setTimeout(()=>{
        e.currentTarget.gotoAndStop(0);
        updateMissionPanel(game);
        game.mission.panel.alpha=0;
        State.set('missionAnim',3);
    },300);
}
function onPageDown(e){
    if(e.currentTarget.currentFrame!==0) return;
    e.currentTarget.gotoAndPlay(1); playSound("switch",0.8);
    const page = State.get('missionPage');
    if(page<4) State.set('missionPage', page+1);
    setTimeout(()=>{
        e.currentTarget.gotoAndStop(0);
        updateMissionPanel(game);
        game.mission.panel.alpha=0;
        State.set('missionAnim',3);
    },300);
}

function onMissionHome(e){
    e.currentTarget.gotoAndPlay(1); playSound("switch",0.8);
    setTimeout(()=>{
        e.currentTarget.gotoAndStop(0);
        game.home.visible=true; game.home.scaleX=game.home.scaleY=0.5; game.home.alpha=0;
        State.set('fadeInTarget','home');
    },300);
}

// === SONS ===

function onSoundOn(e){
    e.currentTarget.gotoAndPlay(1);
    setTimeout(()=>{
        e.currentTarget.gotoAndStop(0);
        game.mission.soundon_btn.visible=false;
        game.mission.soundoff_btn.visible=true;
        game.stop_mc.soundon_btn.visible=false;
        game.stop_mc.soundoff_btn.visible=true;
        State.set('soundOn', true);
        try{ createjs.Sound.stop(); }catch(e){}
        playSound("theme");
        playSound("switch",0.8);
    },300);
}
function onSoundOff(e){
    if(e.currentTarget.currentFrame!==0) return;
    e.currentTarget.gotoAndPlay(1); playSound("switch",0.8);
    setTimeout(()=>{
        e.currentTarget.gotoAndStop(0);
        game.mission.soundoff_btn.visible=false;
        game.mission.soundon_btn.visible=true;
        game.stop_mc.soundoff_btn.visible=false;
        game.stop_mc.soundon_btn.visible=true;
        State.set('soundOn', false);
        try{ createjs.Sound.stop(); }catch(e){}
    },300);
}

// === POPUP ===

function onPopCancel(e){
    if(e.currentTarget.currentFrame!==0) return;
    e.currentTarget.gotoAndPlay(1); playSound("switch",0.8);
    setTimeout(()=>{
        e.currentTarget.gotoAndStop(0);
        game.pop.visible=false;
        const mode = State.get('popupMode');
        if([3,4,5,6].includes(mode)){
            // échec via popup cancel -> direct fail
            State.set('isGameOver', true);
            game.__scenes[1].visible=false;
            game.sight_mc.visible=false;
            State.set('isScoped', false);
            let tips=""; let title="";
            if(mode===3){ tips="Please practice more to improve mission efficiency"; title="End of mission time"; }
            if(mode===4){ tips="Please practice more to improve the shooting rate"; title="The bullet has been consumed"; }
            game.fail.tips.text="Tips\n"+tips;
            game.fail.txt.text=title;
            setTimeout(()=> showFail(),800);
        } else if(mode===7){
            State.set('isPaused', false);
            // resume
        }
    },300);
}
function onPopConfirm(e){
    if(e.currentTarget.currentFrame!==0) return;
    e.currentTarget.gotoAndPlay(1); playSound("switch",0.8);
    setTimeout(()=>{
        e.currentTarget.gotoAndStop(0);
        game.pop.visible=false;
        const mode = State.get('popupMode');
        if(mode===2){
            // start mission
            game.loading_mc.visible=true; game.loading_mc.alpha=0;
            State.set('loadingState','show');
            setTimeout(()=>{
                State.set('loadingState','hide');
                game.mission.visible=false;
                import('./gameplay.js').then(m=> m.startMission(State.get('currentMission')));
            },2500);
        } else if([3,4,5,6].includes(mode)){
            // pub
            try{ window.h5api.playAd(result=>{
                // si pub vue, resume sinon fail
            }); }catch(e){}
        }
    },300);
}

function showFail(){
    game.fail.mission_txt.text="Mission"+State.get('currentMission');
    game.fail.visible=true; game.fail.scaleX=game.fail.scaleY=0.5; game.fail.alpha=0;
    State.set('fadeInTarget','fail');
    stage.canvas.style.cursor="default";
}

// === IN-GAME ===

function onAimToggle(){
    const scoped = State.get('isScoped');
    State.set('isScoped', !scoped);
    game.sight_mc.visible = !scoped;
    game.__scenes[1].visible = !scoped;
    game.fire_btn.alpha = !scoped? 1 : 0.5;
}
function onFireBtn(){
    import('./gameplay.js').then(m=> m.fireShot());
}
function onGlobalMouseDown(){
    // desktop click = tir si scoped
    const isMobile = window.__IS_MOBILE;
    if(isMobile) return;
    import('./gameplay.js').then(m=> {
        if(State.get('isScoped') && State.get('isInGame') && !State.get('isPaused')) {
            m.fireShot();
        }
    });
}
function onPause(){
    State.set('isPaused', true);
    game.stop_mc.visible=true; game.stop_mc.alpha=0; game.stop_mc.scaleX=game.stop_mc.scaleY=0.5;
    State.set('fadeInTarget','stop_mc');
    stage.canvas.style.cursor="default";
}
function onContinue(e){
    e.currentTarget.gotoAndPlay(1); playSound("switch",0.8);
    setTimeout(()=>{
        e.currentTarget.gotoAndStop(0);
        State.set('fadeOutTarget','stop_mc');
        State.set('isPaused', false);
        stage.canvas.style.cursor="none";
    },300);
}
function onRestart(e){
    e.currentTarget.gotoAndPlay(1); playSound("switch",0.8);
    setTimeout(()=> restartCurrentMission(),300);
}
function restartCurrentMission(){
    // clean scenes
    game.__scenes?.forEach(s=> { try{ game.scene.removeChild(s); game.scene5x.removeChild(s);}catch(e){}});
    game.loading_mc.visible=true; game.loading_mc.alpha=0; State.set('loadingState','show');
    setTimeout(()=>{
        game.stop_mc.visible=false;
        State.set('loadingState','hide');
        import('./gameplay.js').then(m=> m.startMission(State.get('currentMission')));
    },2500);
}
function onStopToMissions(e){
    e.currentTarget.gotoAndPlay(1); playSound("switch",0.8);
    setTimeout(()=>{
        e.currentTarget.gotoAndStop(0);
        game.loading_mc.visible=true; game.loading_mc.alpha=0; State.set('loadingState','show');
        setTimeout(()=>{
            // clean
            game.__scenes?.forEach(s=> { try{ game.scene.removeChild(s); game.scene5x.removeChild(s);}catch(e){}});
            game.stop_mc.visible=false;
            game.mission.visible=true; game.mission.scaleX=game.mission.scaleY=0.5; game.mission.alpha=0;
            State.set('fadeInTarget','mission'); State.set('missionAnim',1);
            State.set('loadingState','hide');
        },2500);
    },300);
}
function onHint(){
    if(State.get('hintsLeft')<=0) return;
    // trouve dernier ennemi vivant
    const missionId = State.get('currentMission');
    const arr = game[`scene${missionId}_arr`];
    let target=0;
    for(let n=arr.length-1; n>=1; n--) if(arr[n][1]===1) {target=n; break;}
    if(!target) return;
    State.set('hintsLeft', State.get('hintsLeft')-1);
    game.hint_btn.txt.text=String(State.get('hintsLeft'));
    import('./state.js').then(s=> s.saveProgress());
    // affiche marqueur
    const marker = game.__hintMarker || new lib.symbol_mc();
    marker.visible=true; marker.gotoAndPlay(0);
    marker.x = game.__scenes[0]["enemy"+target+"_mc"].x;
    marker.y = game.__scenes[0]["enemy"+target+"_mc"].y;
    State.set('hintEnemyId', target);
}
function onStartGame(e){
    e.currentTarget.gotoAndPlay(1); playSound("switch",0.8);
    if(typeof GameAnalytics!=='undefined') GameAnalytics("addDesignEvent","EnterMissionSelect",1);
    setTimeout(()=>{
        game.loading_mc.visible=true; game.loading_mc.alpha=0; State.set('loadingState','show');
        setTimeout(()=>{
            game.home.visible=false; e.currentTarget.gotoAndStop(0);
            State.set('loadingState','hide');
            game.mission.visible=true; State.set('missionAnim',1);
        },2500);
    },300);
}
function onFailRestart(e){ e.currentTarget.gotoAndPlay(1); playSound("switch",0.8); setTimeout(()=> restartCurrentMission(),300); }
function onFailToMissions(e){ e.currentTarget.gotoAndPlay(1); playSound("switch",0.8); setTimeout(()=> onStopToMissions(e),300); }
function onResultToMissions(e){ e.currentTarget.gotoAndPlay(1); playSound("switch",0.8); setTimeout(()=> onStopToMissions(e),300); }
function onNextMission(e){
    if(e.currentTarget.alpha!==1) return;
    e.currentTarget.gotoAndPlay(1); playSound("switch",0.8);
    setTimeout(()=>{
        e.currentTarget.gotoAndStop(0);
        game.result.visible=false;
        // clean
        game.__scenes?.forEach(s=> { try{ game.scene.removeChild(s); game.scene5x.removeChild(s);}catch(e){}});
        game.loading_mc.visible=true; game.loading_mc.alpha=0; State.set('loadingState','show');
        setTimeout(()=>{
            State.set('loadingState','hide');
            const next = State.get('currentMission')+1;
            State.set('currentMission', next);
            import('./gameplay.js').then(m=> m.startMission(next));
        },2500);
    },300);
}
function onSkipTutorial(e){
    e.currentTarget.gotoAndPlay(1); playSound("switch",0.8);
    if(typeof GameAnalytics!=='undefined') GameAnalytics("addDesignEvent","CompleteTutorial",1);
    setTimeout(()=>{
        e.currentTarget.gotoAndStop(0);
        game.tutorial.visible=false;
        State.set('isPaused', false);
        stage.canvas.style.cursor="none";
    },300);
}
function onShare(e){ e.currentTarget.gotoAndPlay(1); playSound("switch",0.8); setTimeout(()=>{ e.currentTarget.gotoAndStop(0); try{ window.h5api.share(); }catch(e){}},300); }
function onRank(e){ e.currentTarget.gotoAndPlay(1); playSound("switch",0.8); setTimeout(()=>{ e.currentTarget.gotoAndStop(0); try{ window.h5api.showRanking(); }catch(e){}},300); }
function onSubmitScore(e){ e.currentTarget.gotoAndPlay(1); playSound("switch",0.8); setTimeout(()=>{ e.currentTarget.gotoAndStop(0); try{ import('./state.js').then(s=> window.h5api.submitRanking(s.totalScore, ()=>{})); }catch(e){}},300); }

function playSound(id, vol=1){
    if(!State.get('soundOn')) return;
    try{ createjs.Sound.play(id,{volume:vol}); }catch(e){}
}
