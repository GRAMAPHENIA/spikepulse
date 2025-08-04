/**
 * Gestor principal de interfaz de usuario para Spikepulse
 * @module UIManager
 */

import { SPANISH_TEXT } from '../../config/SpanishText.js';
import { SpanishFormatter } from '../../utils/SpanishFormatter.js';

export class UIManager {
    /**
     * Crea una nueva instancia del gestor de UI
     * @param {Object} config - Configuración de UI
     * @param {EventBus} eventBus - Bus de eventos
     */
    constructor(config, eventBus) {
        this.config = config;
        this.eventBus = eventBus;
        this.isInitialized = false;
        
        // Configuración de UI
        this.uiConfig = {
            theme: config.theme || 'spikepulse-dark',
            language: config.language || 'es',
            enableAnimations: config.enableAnimations !== false,
            enableSounds: config.enableSounds !== false,
            showFPS: config.showFPS || false,
            showDebug: config.showDebug || false,
            autoHideControls: config.autoHideControls !== false,
            controlsTimeout: config.controlsTimeout || 3000
        };
        
        // Referencias a elementos DOM
        this.elements = new Map();
        this.containers = new Map();
        this.screens = new Map();
        
        // Estado de UI
        this.currentScreen = null;
        this.previousScreen = null;
        this.isTransitioning = false;
        this.controlsVisible = true;
        this.controlsTimer = null;
        
        // Datos del juego
        this.gameData = {
            distance: 0,
            score: 0,
            lives: 3,
            coins: 0,
            time: 0,
            level: 1,
            fps: 60,
            ping: 0
        };
        
        // Componentes de UI
        this.hud = null;
        this.screenManager = null;
        
        // Estadísticas
        this.stats = {
            screensShown: 0,
            notificationsShown: 0,
            elementsCreated: 0,
            transitionsCompleted: 0
        };
        
        console.log('🎮 UIManager creado');
    }
    
    /**
     * Inicializa el gestor de UI
     */
    async init() {
        try {
            console.log('🔧 Inicializando UIManager...');
            
            // Crear estructura DOM base
            this.createDOMStructure();
            
            // Aplicar tema inicial
            this.applyTheme();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Crear pantallas por defecto
            this.createDefaultScreens();
            
            this.isInitialized = true;
            console.log('✅ UIManager inicializado');
            
            // Emitir evento de inicialización
            this.eventBus.emit('ui:initialized', {
                theme: this.uiConfig.theme,
                language: this.uiConfig.language
            });
            
        } catch (error) {
            console.error('❌ Error inicializando UIManager:', error);
            throw error;
        }
    }
    
    /**
     * Crea la estructura DOM base
     */
    createDOMStructure() {
        // Contenedor raíz de UI
        const uiRoot = this.createElement('div', {
            id: 'spikepulse-ui',
            className: 'spikepulse-ui',
            'aria-label': 'Interfaz de usuario de Spikepulse'
        });
        
        // Contenedor de pantallas
        const screensContainer = this.createElement('div', {
            id: 'screens-container',
            className: 'screens-container',
            'aria-live': 'polite'
        });
        
        // Contenedor de HUD
        const hudContainer = this.createElement('div', {
            id: 'hud-container',
            className: 'hud-container',
            'aria-label': 'Estadísticas del juego'
        });
        
        // Contenedor de controles
        const controlsContainer = this.createElement('div', {
            id: 'controls-container',
            className: 'controls-container',
            'aria-label': 'Controles del juego'
        });
        
        // Contenedor de notificaciones
        const notificationsContainer = this.createElement('div', {
            id: 'notifications-container',
            className: 'notifications-container',
            'aria-live': 'assertive'
        });
        
        // Contenedor de debug
        const debugContainer = this.createElement('div', {
            id: 'debug-container',
            className: 'debug-container',
            'aria-label': 'Información de debug'
        });
        
        // Ensamblar estructura
        uiRoot.appendChild(screensContainer);
        uiRoot.appendChild(hudContainer);
        uiRoot.appendChild(controlsContainer);
        uiRoot.appendChild(notificationsContainer);
        uiRoot.appendChild(debugContainer);
        
        // Añadir al DOM
        document.body.appendChild(uiRoot);
        
        // Guardar referencias
        this.containers.set('root', uiRoot);
        this.containers.set('screens', screensContainer);
        this.containers.set('hud', hudContainer);
        this.containers.set('controls', controlsContainer);
        this.containers.set('notifications', notificationsContainer);
        this.containers.set('debug', debugContainer);
        
        console.log('🏗️ Estructura DOM de UI creada');
    }
    
    /**
     * Aplica el tema actual
     */
    applyTheme() {
        const uiRoot = this.containers.get('root');
        if (uiRoot) {
            // Remover temas anteriores
            uiRoot.classList.remove('spikepulse-dark', 'spikepulse-light');
            
            // Aplicar tema actual
            uiRoot.classList.add(this.uiConfig.theme);
            
            // Establecer atributo de tema
            uiRoot.setAttribute('data-theme', this.uiConfig.theme);
        }
        
        console.log(`🎨 Tema aplicado: ${this.uiConfig.theme}`);
    }
    
    /**
     * Configura event listeners
     */
    setupEventListeners() {
        // Eventos del juego
        this.eventBus.on('game:state-changed', this.handleGameStateChange.bind(this));
        this.eventBus.on('game:data-updated', this.handleGameDataUpdate.bind(this));
        this.eventBus.on('game:paused', this.handleGamePaused.bind(this));
        this.eventBus.on('game:resumed', this.handleGameResumed.bind(this));
        this.eventBus.on('game:over', this.handleGameOver.bind(this));
        
        // Eventos de UI
        this.eventBus.on('ui:show-screen', this.showScreen.bind(this));
        this.eventBus.on('ui:hide-screen', this.hideScreen.bind(this));
        this.eventBus.on('ui:show-notification', this.showNotification.bind(this));
        this.eventBus.on('ui:toggle-hud', this.toggleHUD.bind(this));
        this.eventBus.on('ui:update-theme', this.updateTheme.bind(this));
        this.eventBus.on('ui:action', this.handleUIAction.bind(this));
        
        // Eventos del navegador
        window.addEventListener('resize', this.handleResize.bind(this));
        window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        document.addEventListener('keydown', this.handleKeyboardNavigation.bind(this));
        
        console.log('👂 Event listeners de UI configurados');
    }
    
    /**
     * Crea las pantallas por defecto
     */
    createDefaultScreens() {
        const screenConfigs = [
            { name: 'menu', title: SPANISH_TEXT.GAME_TITLE },
            { name: 'game-over', title: SPANISH_TEXT.GAME_OVER },
            { name: 'pause', title: SPANISH_TEXT.PAUSE_GAME },
            { name: 'settings', title: 'Configuración' },
            { name: 'loading', title: SPANISH_TEXT.LOADING }
        ];
        
        for (const screenConfig of screenConfigs) {
            this.createScreen(screenConfig.name, screenConfig);
        }
        
        console.log('📺 Pantallas por defecto creadas');
    }
    
    /**
     * Crea una pantalla
     * @param {string} screenName - Nombre de la pantalla
     * @param {Object} options - Opciones de la pantalla
     */
    createScreen(screenName, options = {}) {
        const screenElement = this.createElement('div', {
            id: `screen-${screenName}`,
            className: `screen screen-${screenName}`,
            'aria-labelledby': `screen-${screenName}-title`,
            'role': 'dialog',
            'aria-modal': 'true',
            style: 'display: none;'
        });
        
        // Crear contenido específico de la pantalla
        switch (screenName) {
            case 'menu':
                this.createMenuScreen(screenElement, options);
                break;
            case 'game-over':
                this.createGameOverScreen(screenElement, options);
                break;
            case 'pause':
                this.createPauseScreen(screenElement, options);
                break;
            case 'settings':
                this.createSettingsScreen(screenElement, options);
                break;
            case 'loading':
                this.createLoadingScreen(screenElement, options);
                break;
            default:
                this.createGenericScreen(screenElement, screenName, options);
                break;
        }
        
        // Añadir al contenedor de pantallas
        const screensContainer = this.containers.get('screens');
        screensContainer.appendChild(screenElement);
        
        // Guardar referencia
        this.screens.set(screenName, screenElement);
        
        console.log(`📄 Pantalla creada: ${screenName}`);
    }
    
    /**
     * Crea la pantalla de menú
     * @param {HTMLElement} screenElement - Elemento de la pantalla
     * @param {Object} options - Opciones
     */
    createMenuScreen(screenElement, options) {
        const title = this.createElement('h1', {
            id: 'screen-menu-title',
            className: 'screen-title',
            textContent: SPANISH_TEXT.GAME_TITLE
        });
        
        const subtitle = this.createElement('p', {
            className: 'screen-subtitle',
            textContent: SPANISH_TEXT.WELCOME_MESSAGE
        });
        
        const buttonContainer = this.createElement('div', {
            className: 'button-container'
        });
        
        const startButton = this.createButton({
            text: SPANISH_TEXT.START_GAME,
            className: 'btn-primary btn-large',
            onClick: () => this.eventBus.emit('game:start'),
            ariaLabel: 'Comenzar nueva aventura'
        });
        
        const settingsButton = this.createButton({
            text: 'Configuración',
            className: 'btn-secondary',
            onClick: () => this.showScreen('settings'),
            ariaLabel: 'Abrir configuración'
        });
        
        buttonContainer.appendChild(startButton);
        buttonContainer.appendChild(settingsButton);
        
        screenElement.appendChild(title);
        screenElement.appendChild(subtitle);
        screenElement.appendChild(buttonContainer);
    }
    
    /**
     * Crea la pantalla de game over
     * @param {HTMLElement} screenElement - Elemento de la pantalla
     * @param {Object} options - Opciones
     */
    createGameOverScreen(screenElement, options) {
        const title = this.createElement('h1', {
            id: 'screen-game-over-title',
            className: 'screen-title',
            textContent: SPANISH_TEXT.GAME_OVER
        });
        
        const statsContainer = this.createElement('div', {
            className: 'stats-container'
        });
        
        const distanceStat = this.createElement('div', {
            className: 'stat-item',
            innerHTML: `
                <span class="stat-label">${SPANISH_TEXT.DISTANCE}:</span>
                <span class="stat-value" id="final-distance">0m</span>
            `
        });
        
        const scoreStat = this.createElement('div', {
            className: 'stat-item',
            innerHTML: `
                <span class="stat-label">${SPANISH_TEXT.SCORE}:</span>
                <span class="stat-value" id="final-score">0</span>
            `
        });
        
        statsContainer.appendChild(distanceStat);
        statsContainer.appendChild(scoreStat);
        
        const buttonContainer = this.createElement('div', {
            className: 'button-container'
        });
        
        const restartButton = this.createButton({
            text: SPANISH_TEXT.RESTART_GAME,
            className: 'btn-primary',
            onClick: () => this.eventBus.emit('game:restart'),
            ariaLabel: 'Reiniciar el juego'
        });
        
        const menuButton = this.createButton({
            text: 'Menú Principal',
            className: 'btn-secondary',
            onClick: () => this.showScreen('menu'),
            ariaLabel: 'Volver al menú principal'
        });
        
        buttonContainer.appendChild(restartButton);
        buttonContainer.appendChild(menuButton);
        
        screenElement.appendChild(title);
        screenElement.appendChild(statsContainer);
        screenElement.appendChild(buttonContainer);
    }   
 
    /
}o');
    }struiddenager '✅ UIMale.log(  conso           
lse;
   = faized is.isInitial  th        
();
      ns.clearthis.scree;
        ners.clear()tais.con     thi);
   clear(.elements.      thisapas
  / Limpiar m        /  
   }
      ot);
     (uiRoeChildNode.removentot.parRo          uiode) {
  arentN& uiRoot.pRoot &ui  if (     
 ;')s.get('rootontainer = this.cconst uiRoot    
    impiar DOM/ L        /

           }     y();
troanager.desscreenMs.        thi    r) {
nManage (this.scree if     
        
       }
   );estroy(hud.d      this.   {
    his.hud)if (t  ntes
      componer // Destrui        
        
;igation)ardNavandleKeybos.hn', thir('keydowentListeneent.removeEv      documhange);
  ilityCndleVisib, this.hailitychange'tener('visibLisenteEvt.removen    docum    nge);
ionChaentatndleOrie', this.haationchangr('orientListenentveEveow.remoind we);
       andleResizis.hthsize', tener('retLisEvenmovewindow.re      
  s);'*', thioff(is.eventBus.
        thrstenelisevent er   // Remov  
            ager...');
endo UIMantruy🧹 Desle.log('onso c        {
()royest/
    d   *e UI
  estor dos del gcursreia  Limp     ***
    
    /);
    }
eado'anager reset UIMsole.log('✅     con
           false;
ing = sition.isTran this;
       = nulliousScreen  this.prev      null;
  creen =.currentShis      tstado
  setear e       // Re 
 
             };
   ''nerHTML =inContainer.ation  notific        {
   tainer)tionCon (notifica
        if);ns'notificatio.get('.containersainer = thisnContcatiofi noti      constcaciones
  notifipiar im        // L
    
    
        };ping: 0            0,
    fps: 6
         1,vel:        le
       time: 0,         0,
     coins:     
   : 3,    lives
        score: 0,            tance: 0,
      dis{
      .gameData =   this
      l juego datos de/ Resetear 
        /      
 deScreen();this.hi        antallas
tar p     // Ocul     
   ..');
   o UIManager.andetelog('🔄 Resconsole.
         reset() {
     */
   e UIel gestor d* Resetea    **
  
    /  
    }
  
        };ers.keys()).containfrom(this Array. containers:           eys()),
reens.khis.scm(ty.fros: Arra    screen
        .size,is.elements thts:  elemen
          tStats(),.ge: thisats       stta },
     is.gameDa...th{ ta:  gameDa           ing,
nsition this.isTraioning:  isTransit         ,
 eensScrs.previou: thiviousScreen        pre
    rrentScreen,een: this.cuurrentScr  c     
     iConfig },s.u{ ...thig: onfi        c   ialized,
 nitis.isIzed: th  isInitiali        turn {
          refo() {
etDebugIn g     */
   e debug
nformación dect} Iurns {Obj   * @retdebug
  ión de nformac ibtiene  * O   /**
   
   }
     };
  g
       innsitionTrathis.isitioning:      isTrans      ers.size,
 his.containrsCount: tntaine      co
      e,screens.sizCount: this.ens      scree,
      .sizntslemeunt: this.entsCo eleme       
    ntScreen,urre: this.creenrrentSc          cu  ats,
  ...this.st        
     return {{
     etStats()   */
    gísticas
   adct} Ests {Obje   * @returnde UI
  adísticas  Obtiene est     *

    /**    ===
==ICOS MÉTODOS PÚBL ===== 
    //    }
    
  }      null;
tScreen = s.currenhi   t     }
            ;
     = 'none'yle.displaylement.st   screenE           ement) {
  creenEl   if (s   );
      urrentScreent(this.cs.geis.screen = thenElement const scre        een) {
   crntShis.curre       if (tata) {
 deScreen(dhi    /
    *la
 tal de la panatost} data - Decram {Obj
     * @paa actuala la pantalllt    * Ocu*
 
    /*    }
        }

         };
       dden')ud-hiadd('hList.tainer.class     hudCon           {
e   } els     n');
     e('hud-hidderemovst.iner.classLi hudConta            
   le) {(visib    if 
                   );
 hud-hidden's('st.container.classLitainConhud          !              
   e :  data.visibl undefined ?isible !== = data?.vst visibleon   c
         ontainer) {dC    if (hu);
    ('hud'rs.getcontaine = this.ntainerCot hudns     co
   ata) {toggleHUD(d   */
 
     gleatos del tog- Dt} data aram {Objec * @p
    ad del HUD visibilidlaAlterna   * *
     /*   
  }
    }
   
       });          eme
 fig.ththis.uiConheme:      t        
   ged', {theme-chant('ui:emintBus.s.evehi         t      
       ();
  meis.applyThe     thme;
       a.theme = dattheonfig.is.uiC  th          
.theme) {ataif (d     ta) {
   teTheme(da/
    updama
     *s del te - Dato} dataObject* @param {     ema de UI
aliza el tActu
     *  /**   
     }
 ;
       })
   500);ut(resolve, Timeo      setidad
      segurout de  // Time         
             End);
 imationdleAnhanonend', ansititener('trtLisaddEven   element.;
         onEnd)andleAnimatiend', honanimatitListener('.addEvenement         el    
           };
      );
      resolve(      
          ionEnd);handleAnimat', ndneansitiotener('trventLisnt.removeEleme         e     nEnd);
  dleAnimatiod', hanmationen'anientListener(removeEv   element.            ) => {
 d = (mationEnndleAnist ha       con    olve => {
  Promise(reseturn new    r    ment) {
mation(eletForAni/
    wain
     *nimacióa la ado terminesuelve cuansa que se romise} Promerns {Pr@retu* ción
     o con anima - Element elementement}m {HTMLEl    * @paraón
 na animaci urmineque tepera a * Es
       /** 
  
    }
   button; return 
               }
      ld);
  Chiirston, button.f(icorertBefon.inse        butt    });
         'true'
   hidden':  'aria-         `,
      onfig.icon}${cn-tn-icon icome: `b    classNa      {
      , ('span'eElementat this.crenst icon =co     {
       onfig.icon) (c
        if            }
     .onClick);
onfigck', cistener('clin.addEventL       butto   lick) {
   (config.onC    if   
             });

    d || falseisable config.dbled:isa  d         .text,
 igconfl || ig.ariaLabel': confa-labe'ari       xt,
     fig.tetent: conxtCon       te
     || ''}`,ssName g.clan ${confiName: `bt  class         on', {
 lement('buttateE.cre = thisonst button{
        c(config) createButton  */
    do
   eaón cr BotLElement}rns {HTMtu
     * @rel botóniguración deConf config - {Object}ram 
     * @paón configuracibotón con un  Crea/**
     *   
    
    }ement;
 return el
        reated++;ntsC.eleme this.stats    
           }
             }
e);
       ey, valutAttribute(k.seement el             {
   lse  } e       lue;
   nt[key] = va   eleme             ) {
ked'=== 'chec key ed' ||select== ' =lse if (key         } eue;
   sName = vallement.clas        e{
        me') assNa= 'cl(key == } else if            ] = value;
 element[key           ) {
    innerHTML' 'ey === || kntent'textCo= '==if (key             es)) {
ributentries(attbject.lue] of Ot [key, var (cons   fo           
  t(tag);
createElemenocument. = dentonst elem     c{
   tes = {}) ag, attributeElement(t    crea*/
     eado
o crlementElement} EHTML {  * @returnso
   lementel eributos d Atutes -tribObject} ataram {* @p
      elementoelg dag - Taring} tm {stra   * @pas
  utoatribTML con nto H eleme* Crea un**
      
    /===
    UTILIDAD == DE= MÉTODOS/ ====
    
    /    }        }
     }
     ');
  ('game:pauseventBus.emit.e   this        ') {
     = 'menu!=een tScr.currense if (this } el         ');
  'game:resumes.emit(ntBu   this.eve     {
        pause') == ' =Screenis.current   if (th       
  cape') {= 'Eskey ==nt. if (eve) {
       on(eventigatiardNavdleKeybo*/
    han     clado
 teEvento deevent - t} Evenyboard{Ke @param 
     * tecladon porvegaciónaja  Mane
     ***   
    /
    }
    }    e');
 game:paust('us.emintB   this.eve{
         nt.hidden)  if (docume   e() {
    tyChangisibili   handleV
     */
 aa págindad de liliibo de visbi camjaMane**
     *  
    /     }
 100);
       },size();
   handleRe this.       
    ) => {ut((eo     setTim() {
   angeChtationeneOrihandl*/
    ción
     e orientaambio daneja c
     * M   
    /**  }
      });
  
   .innerHeightht: window  heig         h,
 dtinnerWi: window.width           zed', {
 t('ui:resis.emi.eventBu      thise() {
  dleResiz */
    hantana
    vendo de nsionameManeja redi     * **
 /
   
     }
   
        }     break;        ;
   gleHUD()  this.tog              gle-hud':
tog   case ' 
              
          eak;    br           menu');
 reen('.showSc       this
         enu':how-m   case 's              
            break;
         e');
      le-pause:togg'gam.emit(tBusen.evthis           e':
     gle-paus  case 'tog
           (action) {tch swi       
 
       | data;tion | data.acst action =    con     {
ion(data)leUIAct   hand   */
 
   la acción- Datos deata t} daram {Objec* @p
      UIdecciones   * Maneja a /**
   
       ;
    }
       }) 3000
    duration:       
  ',erove-icon: 'gam         or',
   'err   type:       
   ER_MESSAGE,TEXT.GAME_OVANISH_ message: SP         n({
  atiootificwN.sho      this
  notificació/ Mostrar n   /      
  a);
     ate(datUpdleGameData  this.handales
      tos finctualizar da// A     
   ata) {eGameOver(d   handl
     */
 verdel game oatos  - Dject} data{Obparam 
     * @re oveja gam     * Mane*
    /*   

    }
 });    0
    uration: 200     d,
       'play'con:         iss',
    succe  type: '        
  eanudado',ego rage: 'Ju mess    n({
       catiotifi this.showNo) {
       ameResumed(dleG  han/
   *go
    ón del juereanudacija Mane  * 
    
    /**   }
      });
 0
     ration: 200     du       pause',
con: '     i    'info',
   ype:        tado',
     Juego pausage: '       mession({
     otificatwN this.sho    {
   aused() ePandleGam/
    h     *
sa del juegopauneja  Ma  ***
     
    /
   });
   is.gameDataated', th-updit('ui:datatBus.emen.ev     thisonentes
   a otros comp parmitir evento        // E    
  }
    ta);
      (this.gameDatahud.updateDa       this.d) {
     f (this.hu    iste
     exi sizar HUDliActua/         /  
   data };
   eData, .....this.gam { .s.gameData =   thi     e(data) {
eDataUpdatandleGam h/
       *o
 uegs del jta - Datot} daparam {Objec * @    juego
del s de datos neualizacioja act* Mane     
    /**
   
    }
     }       break;
        
     ding');Screen('loaowsh  this.            ng':
  adise 'lo          ca
              eak;
             br     er');
  'game-ovScreen(how.s   this    
         -over':se 'game  ca         
             ak;
      bre           ');
   reen('pausehowScis.s       th:
         paused' case '           
          eak;
            br
          een();eScrthis.hid             ':
   ingaycase 'pl                      
k;
            brea        enu');
  howScreen('m    this.s           nu':
 me     case '   te) {
    witch (sta
        s        data;
te || e = data.stast stat
        con(data) {ateChangeleGameSt  hand       */
tado
el es - Datos dect} data {Objparam
     * @ del juego estadodeambios neja c  * Ma   /**
     
 
  NTOS =====ANEJO DE EVE// ===== M    

    }
            }       }
ion);
     otificatemoveChild(nentNode.rn.par notificatio            de) {
   Noparenttion.otifica   if (n{
             } else      300);
       },}
             ;
        cation)ifioveChild(notde.remtNoarenfication.poti          n      e) {
    arentNodication.pf (notif        i       t(() => {
  setTimeou       xit');
    cation-efi('notiList.addlassification.c not       
     {eAnimations)blnaonfig.es.uiC(thi if        
tion) {ificafication(notideNoti
    h     */ficación
to de notiemenElion - otificatElement} nram {HTML@pa
     * otificaciónuna nculta 
     * O** /  
     );
    }
ge}`ta.messa{datrada: $ficación mosNoti`📢 ole.log(ons;
        cn++nsShowtiocaifis.notthis.stat             
    }
  );
       }, 300   ');
       teron-enficatitive('not.remoclassLision.ficat       noti   => {
      t(()    setTimeou;
         nter')tification-edd('noassList.aication.cltif  no
          tions) {ableAnimaConfig.en.uiis    if (thntrada
     edeón // Animaci
                    }
3000);
    tion || data.dura         }, 
   ;tification)ion(noificatNots.hide   thi            ) => {
 imeout((    setT  
       {tion !== 0)rata.duif (da     po
    de un tiemuésespocultar d Auto-   //           
  ion);
notificatappendChild(er.ntain
        cofications');('notiainers.gets.cont thicontainer = const 
       }
        );
        eButtonndChild(closon.appeficati       noti   
              });
            ion);
notificaton(tificatihis.hideNo         t   > {
    k', () =er('clicentListenButton.addEv    close          
      
        });       '
 ntent: '×    textCo         n',
   ificacióar not': 'Cerrabel   'aria-l           -close',
  cationfinotiName: '  class         n', {
     ttoment('bueateEles.cr = thittoncloseBunst     co    {
     e !== false)abla.clos  if (dat      
  
      sage);ndChild(mesation.appe     notific       
      });
 
     sagemest: data.nten   textCo,
         sage'cation-mesifie: 'notassNamcl        , {
    pan'ment('screateEleage = this.st mess       con 
    
     }      con);
 ppendChild(i.afication   noti    
           });     
 : 'true'en'-hidd 'aria               .icon}`,
con-${datation-icon itifica `nosName:     clas   {
        ', 'spanateElement(n = this.crenst ico         co
   con) {f (data.i  i     
    ;
         })  
  t'ler': 'a'role           ive',
 e': 'assertlivria-      'a      `,
 'info'}ype ||ta.tda-${otificationon natime: `notific   classNa  {
       iv', teElement('dhis.creaation = totific const n
        {a)atn(dtioowNotifica/
    sh
     *ióna notificac latos dedata - Dect} Objm {    * @paracación
 otifiuestra una n
     * M**    /====
    
CACIONES = DE NOTIFI GESTIÓN ===== //   
}
        }
    re);
    ta.scomeDahis.gaber(tformatNumshFormatter.tent = SpaniextConElement.t score  
         ent) {f (scoreElem
        i       }
   
      stance);ata.dihis.gameDce(tatDistanrmr.foormatteishFt = Spanenent.textContdistanceElem      t) {
      tanceElemen     if (dis     
   ');
   final-scoreyId('ElementBnt.getmeement = docureElonst sco
        cistance');al-d('finentByIdgetElemt.umennt = docceElemedistan    const ) {
    rScreen(dateGameOve
    up  */  
 s finalesr con dato game ovela dea pantalaliza l Actu /**
     * 
       }
    = 'none';
le.displaylement.styscreenE         
       }
        );
xit'screen-eove('t.remssLisnElement.cla    scree       
 nt);screenElememation(ForAnis.wait await thi      ');
     'screen-exitassList.add(nElement.clscree      
      mations) {eAnienablnfig.s.uiCoif (thi      
  ) {entscreenElemeenElement(c hideScrasyn
      */ntalla
    paElemento deement - nElt} screeHTMLElemen* @param {    pantalla
 de nto ta un eleme    * Ocul*
   
    /*
    }     }
  ;
   en-enter')emove('scresList.rent.clasemenElcre       s     nElement);
screeon(itForAnimatiit this.wa awa           );
reen-enter'('sc.addsListnt.clasEleme   screen    {
     s) ationnim.enableAonfiguiChis.f (t  i
            
  x';le= 'fplay ise.dent.stylreenElem
        sc) {reenElementt(sccreenElemen showS   async
     */
 tallao de pannt - ElementlemenEcree sLElement}TM{H @param a
     *o de pantall elementuna Muestr* **
       /
      }
         }
  
 se;ng = falTransitioni    this.is       
 inally {     } f   or);
a:', erralldo pantanrror mostr E'❌error(onsole.       c) {
      (error    } catch 
           
          });  
    ousScreen: this.previrevious       p         ,
: screenName     screen          
 n-shown', {i:screemit('untBus.e this.eve     nto
      ir eve // Emit         
      
        }`);Name${screenmostrada: la al`📺 Pant.log(oleons     c         
        own++;
  screensShhis.stats.     t 
                eenName;
   = scrrentScreen this.cur          ment);
 creenElelement(sshowScreenEis.  await th
          a pantallarar nuev    // Most
                    }
     ();
       enOverScres.updateGame      thi     
     r') {game-oveme === 'nNascree        if (
    erame-ovtos si es gzar da// Actuali            
     }
              
     een;s.currentScrreen = thireviousSchis.p   t                  }
 
          ment);lerrentScreenEt(cumenideScreenElewait this.h   a       
           {enElement)crecurrentS      if (       een);
   rentScr.curet(thisens.g = this.screElemententScreconst curren          
       {n)creeentSf (this.curr           i
 si existella actual r panta Oculta   //      {
         try
       
    ing = true;itionisTrans this.  
                    }
 return;
           
 ame}`);eenNda: ${scrcontrao ena nall⚠️ Pant(`rnole.wa     cons       
 {Element)een  if (!scr    enName);
  ens.get(screhis.screnElement = tnst scree        co 
             }
urn;
           ret);
   la'ntalo de pado cambieso, ignoranen progrición '⚠️ Transole.warn(  cons          oning) {
ansiti (this.isTr      if   
       : {};
? data t' 'objec== ata = d typeofs =tionop    const 
    creen;ta.s? data : dastring' = 'peof data == = tyamescreenN     const  {
   en(data)nc showScre    asy    */

 llaa pantade lta - Datos ject} daOb * @param {ntalla
    a una pauestr*
     * M/*  
    
  ====NTALLAS =DE PAIÓN  ===== GEST
    //    }
    
t);d(contenhilnt.appendCeenEleme       scrtle);
 ld(tiChiappendnElement.  scree
      
           });/p>`
     }<eenNamealla: ${scrPant || `<p>tents.conTML: optionrH      inne    ent',
  en-cont: 'screame classN           , {
div'ement('is.createEl= thent ont    const c   
    
           });e
  | screenNamions.title |tent: optCon   text  e',
       n-titlName: 'scree      class  
    e}-title`,${screenNamscreen-   id: `
         1', {t('hemenis.createEltitle = thonst  c
       ions) { optName,screenent, enElemrecreen(sccSeriteGenea cr
   nes
     */Opcions - ioObject} opt {* @paramtalla
     an pe de lae - NombrNamng} screentri@param {s     * lla
 de la panta Elementoment -reenEleent} scHTMLElemam {ar
     * @plla genéricauna pantaa 
     * Cre  /** }
    
  ner);
   ontaiingCadloendChild(ment.appscreenEle;
        tle)tid(endChilement.appreenEl  sc             
xt);
 adingTeld(loappendChitainer.oadingCon      l);
  gressBarroChild(painer.appendoadingCont      l  ner);
pinhild(sner.appendCContaing     loadi      
       });
    text'
  d: 'loading- i
           entura...',parando avntent: 'PrextCo       te,
     ading-text'me: 'loclassNa     , {
       ('p'entcreateElemext = this.t loadingTns        co
       sFill);
 ogreshild(prpendCogressBar.ap     pr  
   
          });   progress'
 loading-d: '   i  ',
       rogress-fille: 'psNam  clas       v', {
   dient('Elemeate = this.crsFillprogresnst    co           
   });
    ar'
   'progress-be:   classNam       iv', {
   lement('deEhis.creat= tssBar progreconst          
;
          })go'
     gando jue 'Carabel':   'aria-l    er',
     spinn'loading-:    className         ', {
t('divlementeE.crea thisinner =t sp   cons 
     
       });     ainer'
   ont: 'loading-cName     class
       ent('div', {s.createElemtainer = thingCononst loadi        c  
});
           NG
   TEXT.LOADISPANISH_t: tenConext   t         title',
een-: 'scrsName       clastle',
     oading-ti: 'screen-lid  
          nt('h1', {teElemeea.cr this =letit      const s) {
  ent, optionem(screenElingScreen createLoad*/
      ones
  ns - Opciject} optio @param {Ob   *a
  lla pantade lemento El - entscreenElemement} MLEl @param {HTarga
     *talla de cpana Crea l* /**
     
        }
    er);
inbuttonContaappendChild(lement.     screenEr);
   ainetingsContChild(sett.appendeenElemen        scrtle);
Child(tiappendnt.screenEleme        
       ;
 n)(backButtodChildppenner.auttonContai
        b      });
   
       'nteriorlla apantaa  a lVolverel: '     ariaLab'),
        'menu ||usScreen(this.previoScreen> this.showk: () = onClic       dary',
    -secon 'btnName:       class
     er',xt: 'Volv         te
   ({toncreateButtton = this.onst backBu 
        c       
  });     ainer'
 -contonsName: 'butt     clas
       ('div', {eElementhis.creatntainer = tuttonCoonst b    c    
    on);
    d(soundSectihilendC.appngsContainer setti;
       emeSection)thappendChild(sContainer.ngetti   s     
     gle);
   d(soundTogendChilappion. soundSect
       dLabel);ndChild(sounn.appe soundSectio       
        });
  
      ); }ecked.chargetabled: e.t{ engle', io:togmit('audtBus.e this.even           ed;
.checkrget e.tableSounds =uiConfig.enais.      th   {
    ', (e) =>getener('chanEventLisle.add   soundTogg 
     );
       
        }onidos'desactivar stivar o : 'Acia-label'ar   '       Sounds,
  nfig.enable.uiCoecked: thisch         
   -toggle',setting ' className:   
        le',nd-toggou    id: 's    
    ox',ype: 'checkb      t, {
      t('input'createElemenggle = this.oundTo   const s          
      });
 
    gle'd-tog for: 'soun           ,
Sonidos:'tent: '   textCon
         g-label',settinassName: 'cl        , {
    ('label'nt.createElemeel = thist soundLab      cons    
  ;
          })on'
  ting-sectiName: 'set    class  , {
      ment('div'reateEle this.cection =ndS  const sounido
      ración de so  // Configu
      
        eSelect);Child(thempendtion.apeSecem
        thLabel);hemeendChild(tppn.atiothemeSec             
  });
      });
   get.value eme: e.tarTheme({ ththis.update      
      ) => {(ee', ngener('chaentListdEvect.ad themeSel
              ;
         })ption);
pendChild(oSelect.aptheme          });
           e
   onfig.them== this.uiCme.value = theselected:            
    ,heme.textt: tentextCont                e.value,
emalue: th   v           
  ption', {nt('oteElemehis.crea option = t    const        theme => {
orEach(emes.f
        th   ];
              }
: 'Claro'xtight', teulse-l'spikepue:   { val     },
      'Oscuro'ext: , t-dark'ikepulse: 'spalue v     {   
    hemes = [st t     con
   ;
            })
    ar tema'ccionl': 'Sele-labe      'aria     select',
  'setting-e: classNam       ,
    me-select'    id: 'the       {
 t', nt('seleceateElemect = this.cremeSele thst      con   
  );
     
        }-select'emefor: 'th           a:',
 nt: 'TemConte     text',
       ting-label'setame: ssN    cla       l', {
 lement('labeeateEcr= this.abel themeL    const    
    ;
     
        })-section'e: 'settinglassNam         civ', {
   nt('dreateEleme this.cection =t themeS   constema
      de ónfiguraciCon//     
                });
 
   -container'settings: '  className         
 t('div', {enteElem= this.creaner aiingsContnst sett      co
           });
   ación'
    onfigurtContent: 'C    tex     ',
   screen-titleassName: '        clle',
    ttings-tit'screen-se id:       1', {
     t('heElemen this.creat title =     const) {
   ptions, olementen(screenEScrettings   createSe/
 s
     *ione Opc options -ct}aram {Obje * @ptalla
    la pane ento d - ElemElementment} screenTMLElearam {H  * @pración
   a de configuantallea la p * Cr  /**
       
  ;
    }
 r)ineContaonld(buttppendChiment.a  screenEle      e);
d(titlilent.appendChreenElem       sc     
 
   ton);ld(menuButendChiontainer.appbuttonC
        ton);artButestChild(rappendr.taineonCon     butt;
   meButton)(resu.appendChildainer buttonCont           
   
     });al'
    rincip al menú p: 'VolverriaLabel         au'),
   creen('men> this.showSnClick: () = o           ,
ary'btn-secondName: '   class      ',
   nú Principal'Metext:         n({
    uttoeateBhis.crton = tt menuButons       c      
 
  });'
        go jueiar elnicReiLabel: '      aria     '),
 estartme:rt('gamintBus.e => this.eveck: ()    onCli,
        ondary'tn-sec'blassName:   c
          GAME,ESTART_H_TEXT.Rt: SPANIS        tex
    teButton({ this.creaton =uttartB  const res   
      
        });go'
     juedar el l: 'Reanu  ariaLabe          me'),
e:resuamBus.emit('gentev() => this.: nClick         o,
   rimary'e: 'btn-pclassNam            E_GAME,
_TEXT.RESUMxt: SPANISH    te        tton({
Buteis.creaton = thumeButresconst             
         });
 
  ainer'n-cont: 'butto  className   {
       , div'ent('lemcreateEthis.iner = uttonContaconst b      
   
         });      
USE_GAMEH_TEXT.PA SPANISt:textConten       tle',
     -tie: 'screen classNam         itle',
  use-teen-pa id: 'scr
           ', {nt('h1eateElemeis.critle = th t      const  {
tions) opment, ElescreenScreen(eatePause */
    cr
     - Opcionesptionsject} oparam {Ob    * @
  pantallade laento emement - ElscreenElent} m {HTMLElem@paraa
     * la de paustalla panrea **
     * C