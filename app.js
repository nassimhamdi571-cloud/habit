/* ========================================================
   طريق 455 — Habit progression engine v2
   Fully custom habits — no presets, no emojis
   Flexible goals: number, duration, binary, open
   Heatmap for full 455-day journey
   Language toggle (AR/EN) with RTL/LTR
   Full color control with hue/sat/light
   Background styles: grid, concentric, electronic, snow
======================================================== */

const STORAGE_KEY = 'h455_state_v2';
const TOTAL_DAYS = 455;
const MILESTONES = [15,45,90,180,270,365,455];
const WEEKDAYS_AR = ['أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'];
const WEEKDAYS_SHORT_AR = ['ح','ن','ث','ر','خ','ج','س'];
const WEEKDAYS_EN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const WEEKDAYS_SHORT_EN = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* ---------- i18n ---------- */
const I18N = {
  ar: {
    nav_home:'الرئيسية', nav_stats:'التقدم', nav_manage:'العادات', nav_reviews:'الترقيات',
    settings_sub:'الإعدادات والتخصيص', settings_lang:'اللغة', settings_theme:'اللون الأساسي',
    settings_bg:'نمط الخلفية', settings_misc:'أخرى', settings_export:'تصدير نسخة احتياطية',
    settings_reset:'إعادة تعيين كل شيء', settings_about:'حول', settings_about_text:'رحلة 455 يومًا لبناء عاداتك تدريجيًا. كل البيانات مخزّنة محليًا.',
    ob_welcome_title:'أهلًا بك في طريق 455', ob_welcome_sub:'رفيقك الذكي لبناء عادات جديدة على مدى 455 يومًا.',
    ob_start:'لنبدأ', ob_add_title:'أضف عادتك الأولى', ob_add_sub:'ابدأ بعادة واحدة أو اثنتين فقط.',
    ob_name:'اسم العادة', ob_goal_type:'نوع الهدف', ob_unit:'الوحدة', ob_target:'الهدف الأولي',
    ob_days:'أيام الأسبوع', ob_progression:'آلية التدرج', ob_range:'الحد الأدنى والحد الأقصى',
    ob_review_period:'فترة المراجعة (أيام)', ob_back:'رجوع', ob_finish:'ابدأ الرحلة ◆',
    goal_number:'رقم (كمية)', goal_duration:'مدة زمنية', goal_binary:'إتمام فقط', goal_open:'مفتوح (بدون هدف)',
    prog_smart:'تلقائي ذكي', prog_range:'نطاق مخصص', prog_fixed:'ثابت (بدون تدرج)',
    add_habit:'إضافة عادة جديدة', edit_habit:'تعديل العادة', delete_habit:'حذف العادة',
    confirm_delete:'حذف العادة؟', confirm_delete_sub:'سيتم حذف العادة وكل سجلاتها نهائيًا.',
    delete:'حذف نهائي', cancel:'إلغاء', done:'تم', today:'اليوم',
    rest_day:'يوم راحة', level:'المستوى', goal:'الهدف', current_streak:'التتابع الحالي',
    best_streak:'أفضل تتابع', adherence:'الالتزام', no_habits:'لا توجد عادات',
    add_first:'أضف عادتك الأولى', reviews_pending:'ترقيات جاهزة للمراجعة',
    accept:'قبول', postpone:'تأجيل', upgrade:'⬆ ترقية', hold:'⏸ تثبيت', down:'⬇ تخفيض',
    deload:'♻ أسبوع تفريغ', phase_establish:'التأسيس', phase_build:'البناء', phase_master:'الإتقان',
    heatmap_title:'خريطة الالتزام — 455 يوم'
  },
  en: {
    nav_home:'Home', nav_stats:'Progress', nav_manage:'Habits', nav_reviews:'Reviews',
    settings_sub:'Settings & Customization', settings_lang:'Language', settings_theme:'Primary Color',
    settings_bg:'Background Style', settings_misc:'Other', settings_export:'Export Backup',
    settings_reset:'Reset Everything', settings_about:'About', settings_about_text:'455-day journey to build your habits gradually. All data stored locally.',
    ob_welcome_title:'Welcome to Path 455', ob_welcome_sub:'Your smart companion to build new habits over 455 days.',
    ob_start:"Let's Start", ob_add_title:'Add Your First Habit', ob_add_sub:'Start with just one or two habits.',
    ob_name:'Habit Name', ob_goal_type:'Goal Type', ob_unit:'Unit', ob_target:'Initial Target',
    ob_days:'Days of Week', ob_progression:'Progression Mechanism', ob_range:'Min & Max Range',
    ob_review_period:'Review Period (days)', ob_back:'Back', ob_finish:'Start Journey ◆',
    goal_number:'Number (Quantity)', goal_duration:'Duration', goal_binary:'Completion Only', goal_open:'Open (No Target)',
    prog_smart:'Smart Auto', prog_range:'Custom Range', prog_fixed:'Fixed (No Progression)',
    add_habit:'Add New Habit', edit_habit:'Edit Habit', delete_habit:'Delete Habit',
    confirm_delete:'Delete Habit?', confirm_delete_sub:'This will permanently delete the habit and all its logs.',
    delete:'Delete Permanently', cancel:'Cancel', done:'Done', today:'Today',
    rest_day:'Rest Day', level:'Level', goal:'Goal', current_streak:'Current Streak',
    best_streak:'Best Streak', adherence:'Adherence', no_habits:'No Habits',
    add_first:'Add Your First Habit', reviews_pending:'Reviews Ready',
    accept:'Accept', postpone:'Postpone', upgrade:'⬆ Upgrade', hold:'⏸ Hold', down:'⬇ Reduce',
    deload:'♻ Deload Week', phase_establish:'Establish', phase_build:'Build', phase_master:'Master',
    heatmap_title:'Commitment Heatmap — 455 Days'
  }
};

let lang = 'ar';
let currentView = 'home';
let state = null;
let bgStyle = 'grid';

/* ---------- State ---------- */
function defaultState(){
  return {
    onboarded: false,
    startDate: todayStr(),
    lang: 'ar',
    primaryColor: '#D4A017',
    saturation: 82,
    lightness: 50,
    bgStyle: 'grid',
    habits: [],
    reviewHistory: []
  };
}

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    state = raw ? JSON.parse(raw) : defaultState();
    if(!state.habits) state.habits = [];
    if(!state.reviewHistory) state.reviewHistory = [];
    if(!state.bgStyle) state.bgStyle = 'grid';
    if(!state.primaryColor) state.primaryColor = '#D4A017';
    if(state.saturation === undefined) state.saturation = 82;
    if(state.lightness === undefined) state.lightness = 50;
    if(!state.lang) state.lang = 'ar';
  }catch(e){ state = defaultState(); }
  lang = state.lang || 'ar';
  bgStyle = state.bgStyle || 'grid';
  applyPrimaryColor(state.primaryColor);
  applySaturation(state.saturation);
  applyBrightness(state.lightness);
}

function saveState(){
  state.lang = lang;
  state.bgStyle = bgStyle;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* ---------- Date helpers ---------- */
function todayStr(d=new Date()){
  const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), day=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function parseDate(s){ const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d); }
function addDays(dateStr,n){ const d=parseDate(dateStr); d.setDate(d.getDate()+n); return todayStr(d); }
function dayDiff(a,b){ return Math.round((parseDate(b)-parseDate(a))/86400000); }
function weekdayOf(dateStr){ return parseDate(dateStr).getDay(); }
function formatDate(dateStr){ const d=parseDate(dateStr); const m=lang==='ar'?MONTHS_AR[d.getMonth()]:MONTHS_EN[d.getMonth()]; return `${d.getDate()} ${m} ${d.getFullYear()}`; }

function getWeekdays(){ return lang==='ar' ? WEEKDAYS_AR : WEEKDAYS_EN; }
function getWeekdaysShort(){ return lang==='ar' ? WEEKDAYS_SHORT_AR : WEEKDAYS_SHORT_EN; }

/* ---------- Habit factory ---------- */
function makeHabit(data){
  return {
    id: 'h'+Date.now()+Math.floor(Math.random()*10000),
    name: data.name || 'عادة جديدة',
    goalType: data.goalType || 'number',
    unit: data.unit || '',
    initialTarget: data.initialTarget || 1,
    target: parseTarget(data.initialTarget),
    days: data.days || [0,1,2,3,4,5,6],
    progression: data.progression || 'smart',
    rangeMin: data.rangeMin || 1,
    rangeMax: data.rangeMax || 5,
    reviewPeriodDays: data.reviewPeriodDays || 15,
    level: 1,
    periodStart: todayStr(),
    createdAt: todayStr(),
    logs: {},
    streak: 0,
    bestStreak: 0,
    sportUpStreak: 0,
    pendingReview: null,
    active: true,
    monogram: data.name ? data.name.charAt(0).toUpperCase() : 'ع'
  };
}

function parseTarget(val){
  if(typeof val === 'string' && val.includes(':')){
    const parts = val.split(':');
    return parseInt(parts[0])*60 + parseInt(parts[1]||0);
  }
  return parseFloat(val) || 0;
}

function formatTarget(val, type){
  if(type === 'duration'){
    const h = Math.floor(val/60), m = Math.round(val%60);
    return h>0 ? `${h}:${String(m).padStart(2,'0')}` : `0:${String(m).padStart(2,'0')}`;
  }
  if(Number.isInteger(val)) return val;
  return Math.round(val*10)/10;
}

/* ---------- Scheduling / logs ---------- */
function isScheduled(habit, dateStr){
  return habit.days.includes(weekdayOf(dateStr));
}

function getLog(habit, dateStr){ return habit.logs[dateStr] || null; }

function setLog(habit, dateStr, completed, value){
  habit.logs[dateStr] = {completed:!!completed, value: value||0};
}

function isHit(habit, dateStr){
  const log = getLog(habit, dateStr);
  if(!log) return false;
  if(habit.goalType === 'binary') return !!log.completed;
  if(habit.goalType === 'open') return log.value > 0;
  if(habit.goalType === 'duration') return log.value >= habit.target;
  return log.value >= habit.target;
}

/* ---------- Streak ---------- */
function recomputeStreak(habit){
  let streak=0, best=0, cur=0;
  let day = habit.createdAt;
  const end = todayStr();
  let seq = [];
  let d = day;
  while(dayDiff(d, end) >= 0){
    seq.push(d);
    d = addDays(d,1);
  }
  for(const ds of seq){
    if(!isScheduled(habit, ds)) continue;
    if(dayDiff(ds, end) === 0 && !habit.logs[ds]) break;
    if(isHit(habit, ds)){ cur++; best=Math.max(best,cur); }
    else { cur = 0; }
  }
  streak = cur;
  habit.streak = streak;
  habit.bestStreak = Math.max(habit.bestStreak||0, best);
}

/* ---------- Progression ---------- */
function growthTarget(habit){
  if(habit.progression === 'fixed') return habit.target;
  if(habit.progression === 'range'){
    const next = Math.min(habit.rangeMax, Math.round((habit.target + (habit.rangeMax - habit.rangeMin) * 0.15)*10)/10);
    return Math.max(habit.rangeMin, next);
  }
  // smart
  if(habit.goalType === 'duration'){
    return Math.ceil(habit.target * 1.10);
  }
  if(habit.goalType === 'number'){
    let next = Math.ceil(habit.target * 1.35);
    return Math.max(next, habit.target+1);
  }
  return habit.target;
}

function deloadTarget(habit){
  if(habit.goalType === 'duration') return Math.max(60, Math.round(habit.target*0.55));
  return Math.max(1, Math.round(habit.target*0.55*10)/10);
}

function computeAdherence(habit, periodStart, periodEnd){
  let required=0, done=0;
  let day = periodStart;
  while(dayDiff(day, periodEnd) > 0){
    if(isScheduled(habit, day)){
      required++;
      if(isHit(habit, day)) done++;
    }
    day = addDays(day,1);
  }
  return {required, done, rate: required>0 ? (done/required*100) : 100};
}

function checkReviews(){
  const today = todayStr();
  for(const habit of state.habits){
    if(!habit.active || habit.pendingReview) continue;
    const elapsed = dayDiff(habit.periodStart, today);
    if(elapsed >= habit.reviewPeriodDays){
      const periodEnd = addDays(habit.periodStart, habit.reviewPeriodDays);
      const {required, done, rate} = computeAdherence(habit, habit.periodStart, periodEnd);
      let action, newTarget=habit.target, newLevel=habit.level, note='';

      if(rate>=80){
        if(habit.goalType === 'open'){ action='hold'; note='أداء ممتاز! لكن الهدف مفتوح، استمر كما أنت.'; }
        else {
          habit.sportUpStreak = (habit.sportUpStreak||0)+1;
          if(habit.sportUpStreak>=5){
            action='deload'; newTarget=deloadTarget(habit); habit.sportUpStreak=0;
            note='أسبوع تفريغ لمنح نفسك فرصة للاستشفاء.';
          }else{
            action='up'; newTarget=growthTarget(habit); newLevel=habit.level+1;
            note='أداء ممتاز! جاهز لرفع المستوى.';
          }
        }
      } else if(rate>=50){
        action='hold'; note='التزام جيد، حافظ على نفس المستوى.';
      } else {
        action='down'; newTarget=habit.goalType==='duration'?Math.max(60,Math.round(habit.target*0.85)):Math.max(1,Math.round(habit.target*0.85*10)/10);
        habit.sportUpStreak=0;
        note='الأداء منخفض — تم تخفيف الحمل مؤقتًا.';
      }

      habit.pendingReview = {
        periodStart: habit.periodStart, periodEnd, required, done, rate: Math.round(rate),
        action, newTarget, newLevel, note
      };
    }
  }
}

function acceptReview(habitId){
  const habit = state.habits.find(h=>h.id===habitId);
  if(!habit || !habit.pendingReview) return;
  const pr = habit.pendingReview;
  habit.target = pr.newTarget;
  habit.level = pr.newLevel;
  state.reviewHistory.push({habitId, date: todayStr(), ...pr});
  habit.periodStart = todayStr();
  habit.pendingReview = null;
  saveState();
}

function postponeReview(habitId){
  const habit = state.habits.find(h=>h.id===habitId);
  if(!habit || !habit.pendingReview) return;
  habit.periodStart = todayStr();
  habit.pendingReview = null;
  saveState();
}

/* ---------- Journey stats ---------- */
function journeyStats(){
  const today = todayStr();
  const elapsed = Math.min(TOTAL_DAYS, Math.max(0, dayDiff(state.startDate, today)));
  let required=0, done=0;
  for(const habit of state.habits){
    if(!habit.active) continue;
    let day = habit.createdAt;
    while(dayDiff(day, today) > 0){
      if(isScheduled(habit, day)){
        required++;
        if(isHit(habit, day)) done++;
      }
      day = addDays(day,1);
    }
  }
  const adherence = required>0 ? done/required : 1;
  const effectiveDays = Math.min(TOTAL_DAYS, Math.round(elapsed*adherence));
  let phase='phase_establish', phaseIdx=0;
  if(elapsed>=270){ phase='phase_master'; phaseIdx=2; }
  else if(elapsed>=90){ phase='phase_build'; phaseIdx=1; }
  return {elapsed, effectiveDays, adherence, phase, phaseIdx, remaining: TOTAL_DAYS-elapsed};
}

/* ---------- Heatmap ---------- */
function buildHeatmap(habit){
  const cells = [];
  const start = state.startDate;
  const end = todayStr();
  const total = Math.min(TOTAL_DAYS, dayDiff(start, end)+1);
  
  for(let i=0; i<TOTAL_DAYS; i++){
    const ds = addDays(start, i);
    const inRange = i < total;
    const sched = inRange && isScheduled(habit, ds);
    const hit = sched && isHit(habit, ds);
    let rate = 0;
    if(sched){
      const log = getLog(habit, ds);
      if(habit.goalType === 'open') rate = log && log.value > 0 ? 100 : 0;
      else if(habit.goalType === 'binary') rate = hit ? 100 : 0;
      else if(habit.goalType === 'duration'){
        const target = habit.target || 1;
        rate = log ? Math.min(100, (log.value / target) * 100) : 0;
      } else {
        const target = habit.target || 1;
        rate = log ? Math.min(100, (log.value / target) * 100) : 0;
      }
    }
    cells.push({
      date: ds,
      scheduled: sched,
      hit: hit,
      rate: sched ? Math.round(rate) : -1,
      inRange: inRange,
      isToday: ds === end
    });
  }
  return cells;
}

/* ============================================================
   RENDERING
============================================================ */
function el(sel){ return document.querySelector(sel); }
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function t(key){ return I18N[lang]?.[key] || key; }

function render(){
  renderTopbar();
  if(currentView==='home') renderHome();
  else if(currentView==='stats') renderStats();
  else if(currentView==='manage') renderManage();
  else if(currentView==='reviews') renderReviews();
  renderNav();
  updateI18n();
}

function updateI18n(){
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    el.textContent = t(key);
  });
}

function renderTopbar(){
  const pendingCount = state.habits.filter(h=>h.pendingReview).length;
  el('#reviewDot').style.display = pendingCount>0 ? 'block' : 'none';
}

function ringSvg(pct, size=64){
  const r=(size/2)-5, c=2*Math.PI*r, off=c*(1-Math.min(1,pct));
  return `<svg viewBox="0 0 ${size} ${size}">
    <circle class="ring-bg" cx="${size/2}" cy="${size/2}" r="${r}"></circle>
    <circle class="ring-fg" cx="${size/2}" cy="${size/2}" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${off}"></circle>
  </svg>`;
}

function renderHome(){
  checkReviews();
  saveState();
  const today = todayStr();
  const js = journeyStats();
  const pct = js.effectiveDays/TOTAL_DAYS*100;

  const milestonesHtml = MILESTONES.map(m=>{
    const pos = m/TOTAL_DAYS*100;
    const passed = js.elapsed>=m;
    return `<div class="journey-milestone ${passed?'passed':''}" style="right:${pos}%" title="${t('day')} ${m}"></div>`;
  }).join('');

  const pending = state.habits.filter(h=>h.pendingReview);
  const reviewBanner = pending.length ? `
    <div class="glass-card review-banner fade-up" onclick="goto('reviews')">
      <div class="rb-icon">◆</div>
      <div class="rb-text">${pending.length} ${t('reviews_pending')}
        <small>${t('click_to_review')}</small>
      </div>
    </div>` : '';

  const todays = state.habits.filter(h=>h.active);
  const scheduledToday = todays.filter(h=>isScheduled(h, today));
  const doneToday = scheduledToday.filter(h=>isHit(h, today)).length;
  const dayPct = scheduledToday.length ? doneToday/scheduledToday.length : 0;

  let habitsHtml = '';
  if(todays.length===0){
    habitsHtml = `<div class="glass-card empty-state fade-up">
      <div class="em-icon">◆</div>
      <div class="em-title">${t('no_habits')}</div>
      <div class="em-sub">${t('add_first')}</div>
      <button class="btn" onclick="openAddHabit()">+ ${t('add_habit')}</button>
    </div>`;
  } else {
    habitsHtml = todays.map(h=>{
      const scheduled = isScheduled(h, today);
      const log = getLog(h, today);
      if(!scheduled){
        return `<div class="glass-card habit-card rest">
          <div class="habit-monogram" style="background:${getHabitColor(h)}">${h.monogram}</div>
          <div class="habit-info">
            <div class="habit-name">${esc(h.name)}</div>
            <div class="habit-meta"><span class="rest-tag">${t('rest_day')}</span></div>
          </div>
        </div>`;
      }
      const hit = isHit(h, today);
      const goalDisplay = h.goalType==='open' ? '∞' : formatTarget(h.target, h.goalType);
      const unitDisplay = h.goalType==='binary' ? '' : h.unit;
      
      if(h.goalType==='binary'){
        return `<div class="glass-card habit-card" onclick="toggleBinary('${h.id}')">
          <div class="habit-monogram" style="background:${getHabitColor(h)}">${h.monogram}</div>
          <div class="habit-info">
            <div class="habit-name">${esc(h.name)}</div>
            <div class="habit-meta"><span class="habit-level-badge">${t('level')} ${h.level}</span><span>🔥 ${h.streak}</span></div>
          </div>
          <div class="habit-check ${hit?'done':''}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>
        </div>`;
      }
      const val = log ? log.value : 0;
      const displayVal = h.goalType==='duration' ? formatTarget(val, 'duration') : fmt(val);
      return `<div class="glass-card habit-card">
        <div class="habit-monogram" style="background:${getHabitColor(h)}">${h.monogram}</div>
        <div class="habit-info">
          <div class="habit-name">${esc(h.name)}</div>
          <div class="habit-meta"><span class="habit-level-badge">${t('level')} ${h.level}</span><span>${t('goal')} ${goalDisplay} ${unitDisplay}</span><span>🔥 ${h.streak}</span></div>
        </div>
        <div class="habit-qty">
          <button class="qty-btn" onclick="event.stopPropagation();adjustQty('${h.id}',-1)">−</button>
          <span class="qty-val" style="color:${hit?'var(--good)':'var(--t60)'}">${displayVal}</span>
          <button class="qty-btn" onclick="event.stopPropagation();adjustQty('${h.id}',1)">+</button>
        </div>
      </div>`;
    }).join('');
  }

  el('#homeView').innerHTML = `
    <div class="glass-card journey-card fade-up">
      <div class="journey-top">
        <span class="journey-phase">${t('phase_'+js.phase)} · ${t('day')} ${js.elapsed} / ${TOTAL_DAYS}</span>
        <span class="journey-days">${Math.round(js.adherence*100)}% ${t('adherence')}</span>
      </div>
      <div class="journey-track">
        <div class="journey-fill" style="width:${pct}%"></div>
        ${milestonesHtml}
      </div>
      <div class="journey-labels"><span>${t('start')}</span><span>${t('phase_establish')}</span><span>${t('phase_build')}</span><span>${t('phase_master')}</span></div>
    </div>
    ${reviewBanner}
    <div class="glass-card today-row fade-up">
      <div class="ring-wrap">${ringSvg(dayPct)}<div class="ring-label">${scheduledToday.length? Math.round(dayPct*100)+'%':'—'}</div></div>
      <div class="today-text">
        <div class="today-title">${t('today')} — ${getWeekdays()[weekdayOf(today)]}</div>
        <div class="today-sub">${scheduledToday.length? `${t('done')} ${doneToday} ${t('of')} ${scheduledToday.length} ${t('habits')}` : t('no_habits_scheduled')}</div>
      </div>
    </div>
    <div class="section-label"><span>${t('today_habits')}</span></div>
    ${habitsHtml}
  `;
}

function fmt(n){
  if(Number.isInteger(n)) return n;
  return Math.round(n*10)/10;
}

function getHabitColor(habit){
  if(habit.color) return habit.color;
  const colors = ['#D4A017','#B8C2D0','#2060D0','#197A46','#7235A0','#BE1A38','#8B7355','#2C3E50'];
  const idx = state.habits.indexOf(habit) % colors.length;
  return colors[idx];
}

function toggleBinary(id){
  const h = state.habits.find(x=>x.id===id);
  const today = todayStr();
  const hit = isHit(h, today);
  setLog(h, today, !hit, hit?0:1);
  recomputeStreak(h);
  saveState();
  renderHome();
  if(!hit) showToast('✓ '+t('done'));
}

function adjustQty(id, dir){
  const h = state.habits.find(x=>x.id===id);
  const today = todayStr();
  const log = getLog(h, today) || {completed:false, value:0};
  let step = 1;
  if(h.unit && (h.unit.includes('كم') || h.unit.includes('km') || h.unit.includes('كيلو'))) step = 0.1;
  if(h.goalType==='duration') step = 30; // 30 seconds
  let val = Math.max(0, Math.round((log.value + dir*step)*10)/10);
  const wasHit = log.value >= h.target;
  setLog(h, today, val>=h.target, val);
  recomputeStreak(h);
  saveState();
  renderHome();
  const nowHit = val>=h.target;
  if(nowHit && !wasHit) showToast('✓ '+t('done'));
}

/* ---------- Stats view ---------- */
function renderStats(){
  const habits = state.habits.filter(h=>h.active);
  if(!habits.length){
    el('#statsView').innerHTML = `<div class="glass-card empty-state fade-up" style="margin-top:12px;">
      <div class="em-icon">◆</div><div class="em-title">${t('no_data')}</div>
      <div class="em-sub">${t('add_first')}</div>
    </div>`;
    return;
  }

  const habit = habits[0]; // show first habit stats for simplicity, can be extended

  // Heatmap
  const cells = buildHeatmap(habit);
  const heatmapHtml = cells.map((c,i)=>{
    if(!c.inRange) return `<div class="heatmap-cell empty"></div>`;
    if(!c.scheduled) return `<div class="heatmap-cell" style="background:var(--subtle-bg);"></div>`;
    const intensity = c.rate/100;
    const color = c.rate >= 0 ? `hsla(var(--theme-hue),var(--theme-sat),${20 + intensity*40}%,${0.2 + intensity*0.6})` : 'var(--subtle-bg)';
    return `<div class="heatmap-cell" style="background:${color};position:relative;" title="${formatDate(c.date)}: ${c.rate}%">
      <div class="h-tooltip">${formatDate(c.date)}: ${c.rate}%</div>
    </div>`;
  }).join('');

  // Recent bars
  const today = todayStr();
  let totalDone=0, totalReq=0;
  let day = habit.createdAt;
  while(dayDiff(day, today) >= 0){
    if(isScheduled(habit, day)){ totalReq++; if(isHit(habit,day)) totalDone++; }
    day = addDays(day,1);
  }
  const last30 = [];
  for(let i=29;i>=0;i--){
    const ds = addDays(today, -i);
    last30.push(ds);
  }
  const bars = last30.map(ds=>{
    const sched = isScheduled(habit, ds);
    const hit = sched && isHit(habit, ds);
    const log = getLog(habit, ds);
    const val = log ? log.value : 0;
    let pct = 8;
    if(habit.goalType==='binary') pct = hit ? 100 : (sched ? 12 : 8);
    else if(habit.goalType==='open') pct = val > 0 ? 100 : (sched ? 12 : 8);
    else if(habit.goalType==='duration'){
      const target = habit.target || 1;
      pct = sched ? Math.min(100, Math.max(8, (val/target)*100)) : 8;
    } else {
      const target = habit.target || 1;
      pct = sched ? Math.min(100, Math.max(8, (val/target)*100)) : 8;
    }
    return `<div class="bar-col">
      <div class="bar-fill ${hit?'':'low'}" style="height:${sched?pct:6}%"></div>
      <div class="bar-day">${getWeekdaysShort()[weekdayOf(ds)]}</div>
    </div>`;
  }).join('');

  const adherence = totalReq? Math.round(totalDone/totalReq*100):0;

  el('#statsView').innerHTML = `
    <div class="section-label" style="margin-top:8px;"><span>${esc(habit.name)}</span></div>
    <div class="glass-card habit-detail-hero fade-up">
      <div class="hd-icon" style="color:${getHabitColor(habit)}">${habit.monogram}</div>
      <div class="hd-name">${esc(habit.name)}</div>
      <div class="hd-level">${t('level')} ${habit.level} ${habit.goalType!=='binary'&&habit.goalType!=='open'? '· '+t('goal')+' '+formatTarget(habit.target, habit.goalType)+' '+esc(habit.unit):''}</div>
      <div class="streak-row">
        <div class="streak-item"><div class="streak-num">${habit.streak}🔥</div><div class="streak-lbl">${t('current_streak')}</div></div>
        <div class="streak-item"><div class="streak-num">${habit.bestStreak}</div><div class="streak-lbl">${t('best_streak')}</div></div>
        <div class="streak-item"><div class="streak-num">${adherence}%</div><div class="streak-lbl">${t('adherence')}</div></div>
      </div>
    </div>
    <div class="section-label"><span>${t('last_30_days')}</span></div>
    <div class="glass-card bar-chart fade-up">${bars}</div>
    <div class="section-label"><span>${t('heatmap_title')}</span></div>
    <div class="glass-card fade-up">
      <div class="heatmap-grid">${heatmapHtml}</div>
    </div>
    <div style="margin-top:16px;">
      <button class="btn btn-ghost btn-block btn-sm" onclick="confirmDeleteHabit('${habit.id}')">${t('delete_habit')}</button>
    </div>
  `;
}

/* ---------- Manage view ---------- */
function renderManage(){
  const rows = state.habits.map(h=>`
    <div class="glass-card habit-card" style="cursor:default;">
      <div class="habit-monogram" style="background:${getHabitColor(h)}">${h.monogram}</div>
      <div class="habit-info">
        <div class="habit-name">${esc(h.name)}</div>
        <div class="habit-meta"><span class="habit-level-badge">${t('level')} ${h.level}</span><span>${h.days.map(d=>getWeekdaysShort()[d]).join(' ')}</span></div>
      </div>
      <button class="btn btn-sm btn-ghost" onclick="goto('stats')">${t('details')}</button>
    </div>
  `).join('');

  el('#manageView').innerHTML = `
    <div class="section-label" style="margin-top:8px;"><span>${t('habits')} (${state.habits.length})</span></div>
    ${rows || `<div class="glass-card empty-state fade-up"><div class="em-icon">◆</div><div class="em-title">${t('no_habits')}</div></div>`}
    <button class="btn btn-block" style="margin-top:16px;" onclick="openAddHabit()">+ ${t('add_habit')}</button>
  `;
}

/* ---------- Reviews view ---------- */
function renderReviews(){
  const pending = state.habits.filter(h=>h.pendingReview);
  let html='';
  if(!pending.length){
    html = `<div class="glass-card empty-state fade-up">
      <div class="em-icon">◆</div>
      <div class="em-title">${t('no_reviews')}</div>
      <div class="em-sub">${t('reviews_auto')}</div>
    </div>`;
  } else {
    html = pending.map(h=>{
      const pr = h.pendingReview;
      const actionLabel = {up:t('upgrade'), hold:t('hold'), down:t('down'), deload:t('deload')}[pr.action] || pr.action;
      const actionColor = {up:'var(--good)', hold:'var(--warn)', down:'var(--bad)', deload:'var(--t60)'}[pr.action] || 'var(--t)';
      const detail = h.goalType==='binary'||h.goalType==='open' ? '' :
        `<div class="habit-meta" style="margin-top:8px;">${t('current_goal')}: ${formatTarget(h.target, h.goalType)} ${esc(h.unit)} → ${t('proposed')}: ${formatTarget(pr.newTarget, h.goalType)} ${esc(h.unit)}</div>`;
      return `<div class="glass-card fade-up" style="padding:16px;margin-bottom:12px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div class="habit-monogram" style="background:${getHabitColor(h)};width:36px;height:36px;font-size:1rem;">${h.monogram}</div>
          <div style="flex:1;">
            <div class="habit-name">${esc(h.name)}</div>
            <div class="habit-meta">${pr.rate}% ${t('adherence')} (${pr.done}/${pr.required} ${t('days')})</div>
          </div>
          <span style="font-size:.7rem;font-weight:800;color:${actionColor};">${actionLabel}</span>
        </div>
        <div class="habit-meta" style="margin-top:10px;line-height:1.7;">${pr.note}</div>
        ${detail}
        <div style="display:flex;gap:10px;margin-top:14px;">
          <button class="btn btn-sm" style="flex:1;" onclick="acceptReview('${h.id}');render()">${t('accept')}</button>
          <button class="btn btn-sm btn-ghost" style="flex:1;" onclick="postponeReview('${h.id}');render()">${t('postpone')}</button>
        </div>
      </div>`;
    }).join('');
  }
  el('#reviewsView').innerHTML = `<div class="section-label" style="margin-top:8px;"><span>${t('reviews')}</span></div>${html}`;
}

/* ---------- Add habit ---------- */
function openAddHabit(){
  openModal(`
    <div class="modal-handle"></div>
    <div class="modal-title">${t('add_habit')}</div>
    <div class="modal-sub">${t('add_habit_sub')}</div>
    <div class="form-group">
      <label>${t('ob_name')}</label>
      <input type="text" id="ahName" placeholder="${t('name_placeholder')}">
    </div>
    <div class="form-group">
      <label>${t('ob_goal_type')}</label>
      <select id="ahGoalType" onchange="ahGoalTypeChange()">
        <option value="number">${t('goal_number')}</option>
        <option value="duration">${t('goal_duration')}</option>
        <option value="binary">${t('goal_binary')}</option>
        <option value="open">${t('goal_open')}</option>
      </select>
    </div>
    <div class="form-group" id="ahUnitGroup">
      <label>${t('ob_unit')}</label>
      <input type="text" id="ahUnit" placeholder="${t('unit_placeholder')}">
    </div>
    <div class="form-group" id="ahTargetGroup">
      <label>${t('ob_target')}</label>
      <input type="text" id="ahTarget" placeholder="${t('target_placeholder')}">
    </div>
    <div class="form-group">
      <label>${t('ob_days')}</label>
      <div class="day-picker" id="ahDaysPicker">
        ${getWeekdaysShort().map((d,i)=>`<div class="day-chip on" data-d="${i}">${d}</div>`).join('')}
      </div>
    </div>
    <div class="form-group">
      <label>${t('ob_progression')}</label>
      <select id="ahProgression" onchange="ahProgChange()">
        <option value="smart">${t('prog_smart')}</option>
        <option value="range">${t('prog_range')}</option>
        <option value="fixed">${t('prog_fixed')}</option>
      </select>
    </div>
    <div class="form-group" id="ahRangeGroup" style="display:none;">
      <label>${t('ob_range')}</label>
      <div style="display:flex;gap:10px;">
        <input type="number" id="ahRangeMin" placeholder="${t('min')}" value="3">
        <input type="number" id="ahRangeMax" placeholder="${t('max')}" value="5">
      </div>
    </div>
    <div class="form-group">
      <label>${t('ob_review_period')}</label>
      <input type="number" id="ahReviewPeriod" value="15" min="3" max="90">
    </div>
    <button class="btn btn-block" onclick="confirmAddHabit()">${t('add')}</button>
  `);
  // Setup day picker
  document.querySelectorAll('#ahDaysPicker .day-chip').forEach(c=>{
    c.onclick = function(){ this.classList.toggle('on'); };
  });
}

function ahGoalTypeChange(){
  const type = document.getElementById('ahGoalType').value;
  document.getElementById('ahUnitGroup').style.display = (type==='binary'||type==='open') ? 'none' : 'block';
  document.getElementById('ahTargetGroup').style.display = (type==='binary'||type==='open') ? 'none' : 'block';
}

function ahProgChange(){
  document.getElementById('ahRangeGroup').style.display = document.getElementById('ahProgression').value==='range' ? 'block' : 'none';
}

function confirmAddHabit(){
  const name = document.getElementById('ahName').value.trim();
  if(!name){ showToast('الرجاء إدخال اسم العادة'); return; }
  const goalType = document.getElementById('ahGoalType').value;
  const unit = document.getElementById('ahUnit').value.trim();
  const targetVal = document.getElementById('ahTarget').value.trim();
  const days = [...document.querySelectorAll('#ahDaysPicker .day-chip.on')].map(c=>parseInt(c.dataset.d));
  if(!days.length){ showToast('اختر يومًا واحدًا على الأقل'); return; }
  const progression = document.getElementById('ahProgression').value;
  const rangeMin = parseInt(document.getElementById('ahRangeMin').value) || 1;
  const rangeMax = parseInt(document.getElementById('ahRangeMax').value) || 5;
  const reviewPeriodDays = parseInt(document.getElementById('ahReviewPeriod').value) || 15;

  const data = {
    name, goalType, unit, initialTarget: targetVal || (goalType==='duration'?'0:30':1),
    days, progression, rangeMin, rangeMax, reviewPeriodDays
  };
  const habit = makeHabit(data);
  state.habits.push(habit);
  saveState();
  closeModal();
  goto('home');
  showToast('✓ '+t('added'));
}

/* ---------- Delete habit ---------- */
function confirmDeleteHabit(id){
  openModal(`
    <div class="modal-handle"></div>
    <div class="modal-title">${t('confirm_delete')}</div>
    <div class="modal-sub">${t('confirm_delete_sub')}</div>
    <div style="display:flex;gap:10px;">
      <button class="btn btn-danger" style="flex:1;" onclick="deleteHabit('${id}')">${t('delete')}</button>
      <button class="btn btn-ghost" style="flex:1;" onclick="closeModal()">${t('cancel')}</button>
    </div>
  `);
}

function deleteHabit(id){
  state.habits = state.habits.filter(h=>h.id!==id);
  saveState();
  closeModal();
  render();
}

/* ---------- Navigation ---------- */
function goto(view){
  currentView = view;
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  const target = document.getElementById(view+'View');
  if(target) target.classList.add('active');
  render();
  window.scrollTo({top:0, behavior:'smooth'});
}

function renderNav(){
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.toggle('active', n.dataset.view===currentView));
}

/* ---------- Modal / Toast ---------- */
function openModal(html){
  document.getElementById('modalSheet').innerHTML = html;
  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal(){ document.getElementById('modalOverlay').classList.remove('open'); }

let toastTimer;
function showToast(msg){
  const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.classList.remove('show'), 2200);
}

/* ---------- Sidebar ---------- */
function toggleSidebar(){
  document.getElementById('sidebarPanel').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('open');
}

/* ---------- Language ---------- */
function toggleLanguage(){
  lang = lang === 'ar' ? 'en' : 'ar';
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.body.classList.toggle('ltr', lang === 'en');
  document.getElementById('langLabel').textContent = lang === 'ar' ? 'العربية' : 'English';
  document.getElementById('langPill').classList.toggle('on', lang === 'en');
  state.lang = lang;
  saveState();
  render();
}

/* ---------- Colors ---------- */
function applyPrimaryColor(hex){
  state.primaryColor = hex;
  const hsl = hexToHsl(hex);
  document.documentElement.style.setProperty('--theme-hue', hsl.h);
  document.documentElement.style.setProperty('--theme-sat', hsl.s + '%');
  document.documentElement.style.setProperty('--theme-light', (hsl.l/2) + '%');
  saveState();
}

function applySaturation(val){
  state.saturation = parseInt(val);
  document.documentElement.style.setProperty('--theme-sat', state.saturation + '%');
  saveState();
}

function applyBrightness(val){
  state.lightness = parseInt(val);
  document.documentElement.style.setProperty('--theme-light', (state.lightness/2) + '%');
  saveState();
}

function applyThemePreset(hex, sat, light){
  document.getElementById('primaryColorPicker').value = hex;
  applyPrimaryColor(hex);
  document.getElementById('saturationSlider').value = sat;
  applySaturation(sat);
  document.getElementById('brightnessSlider').value = light;
  applyBrightness(light);
}

function hexToHsl(hex){
  let r=0,g=0,b=0;
  if(hex.length===4){
    r=parseInt(hex[1]+hex[1],16); g=parseInt(hex[2]+hex[2],16); b=parseInt(hex[3]+hex[3],16);
  } else if(hex.length===7){
    r=parseInt(hex.substr(1,2),16); g=parseInt(hex.substr(3,2),16); b=parseInt(hex.substr(5,2),16);
  }
  r/=255; g/=255; b/=255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b);
  let h=0,s=0,l=(max+min)/2;
  if(max!==min){
    const d=max-min;
    s = l>0.5 ? d/(2-max-min) : d/(max+min);
    switch(max){
      case r: h=((g-b)/d + (g<b?6:0))/6; break;
      case g: h=((b-r)/d + 2)/6; break;
      case b: h=((r-g)/d + 4)/6; break;
    }
  }
  return {h: Math.round(h*360), s: Math.round(s*100), l: Math.round(l*100)};
}

/* ---------- Background styles ---------- */
function setBgStyle(style){
  bgStyle = style;
  state.bgStyle = style;
  const layer = document.getElementById('bgLayer');
  layer.className = 'bg-layer ' + style;
  document.querySelectorAll('.bg-option').forEach(el=>{
    el.classList.toggle('active', el.dataset.bg === style);
  });
  saveState();
}

/* ---------- Export / Reset ---------- */
function exportData(){
  const blob = new Blob([JSON.stringify(state,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'habit-455-backup.json';
  a.click();
  URL.revokeObjectURL(url);
}

function confirmReset(){
  openModal(`
    <div class="modal-handle"></div>
    <div class="modal-title">${t('reset_confirm')}</div>
    <div class="modal-sub">${t('reset_confirm_sub')}</div>
    <div style="display:flex;gap:10px;">
      <button class="btn btn-danger" style="flex:1;" onclick="doReset()">${t('reset')}</button>
      <button class="btn btn-ghost" style="flex:1;" onclick="closeModal()">${t('cancel')}</button>
    </div>
  `);
}

function doReset(){
  localStorage.removeItem(STORAGE_KEY);
  closeModal();
  location.reload();
}

/* ---------- Onboarding ---------- */
let obStep = 0;

function startOnboarding(){
  document.getElementById('onboardOverlay').style.display = 'block';
  obStep = 0;
  renderOb();
}

function renderOb(){
  document.querySelectorAll('.ob-step').forEach((s,i)=>s.classList.toggle('active', i===obStep));
  document.querySelectorAll('.ob-progress i').forEach((s,i)=>s.classList.toggle('done', i<=obStep));
}

function obNext(){ if(obStep<1){ obStep++; renderOb(); } }
function obBack(){ if(obStep>0){ obStep--; renderOb(); } }

function obGoalTypeChange(){
  const type = document.getElementById('obGoalType').value;
  document.getElementById('obUnitGroup').style.display = (type==='binary'||type==='open') ? 'none' : 'block';
  document.getElementById('obTargetGroup').style.display = (type==='binary'||type==='open') ? 'none' : 'block';
}

function obProgChange(){
  document.getElementById('obRangeGroup').style.display = document.getElementById('obProgression').value==='range' ? 'block' : 'none';
}

function obFinish(){
  const name = document.getElementById('obHabitName').value.trim();
  if(!name){ showToast('الرجاء إدخال اسم العادة'); return; }
  const goalType = document.getElementById('obGoalType').value;
  const unit = document.getElementById('obUnit').value.trim();
  const targetVal = document.getElementById('obTarget').value.trim();
  const days = [...document.querySelectorAll('#obDaysPicker .day-chip.on')].map(c=>parseInt(c.dataset.d));
  if(!days.length){ showToast('اختر يومًا واحدًا على الأقل'); return; }
  const progression = document.getElementById('obProgression').value;
  const rangeMin = parseInt(document.getElementById('obRangeMin').value) || 1;
  const rangeMax = parseInt(document.getElementById('obRangeMax').value) || 5;
  const reviewPeriodDays = parseInt(document.getElementById('obReviewPeriod').value) || 15;

  const data = {
    name, goalType, unit, initialTarget: targetVal || (goalType==='duration'?'0:30':1),
    days, progression, rangeMin, rangeMax, reviewPeriodDays
  };
  const habit = makeHabit(data);
  state.habits.push(habit);
  state.onboarded = true;
  state.startDate = todayStr();
  saveState();
  document.getElementById('onboardOverlay').style.display = 'none';
  applyPrimaryColor(state.primaryColor);
  applySaturation(state.saturation);
  applyBrightness(state.lightness);
  setBgStyle(state.bgStyle || 'grid');
  goto('home');
}

/* ---------- Init ---------- */
function init(){
  loadState();
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.body.classList.toggle('ltr', lang === 'en');
  document.getElementById('langLabel').textContent = lang === 'ar' ? 'العربية' : 'English';
  document.getElementById('langPill').classList.toggle('on', lang === 'en');
  document.getElementById('primaryColorPicker').value = state.primaryColor || '#D4A017';
  document.getElementById('saturationSlider').value = state.saturation || 82;
  document.getElementById('brightnessSlider').value = state.lightness || 50;
  setBgStyle(state.bgStyle || 'grid');

  if(!state.onboarded){
    startOnboarding();
  } else {
    goto('home');
  }

  // Setup onboarding day picker
  document.querySelectorAll('#obDaysPicker .day-chip').forEach(c=>{
    c.onclick = function(){ this.classList.toggle('on'); };
  });

  // Mouse glow
  document.addEventListener('pointermove', e=>{
    const color = state.primaryColor || '#D4A017';
    const hsl = hexToHsl(color);
    document.getElementById('mouseGlow').style.background =
      `radial-gradient(circle 480px at ${e.clientX}px ${e.clientY}px,hsla(${hsl.h},${hsl.s}%,50%,0.05),transparent 45%)`;
  });

  // PWA install
  let deferredPrompt=null;
  window.addEventListener('beforeinstallprompt', (e)=>{
    e.preventDefault(); deferredPrompt=e;
    document.getElementById('installBanner').style.display='flex';
  });
  document.getElementById('installBtn').addEventListener('click', async ()=>{
    if(!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt=null;
    document.getElementById('installBanner').style.display='none';
  });

  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  }
}

document.addEventListener('DOMContentLoaded', init);

// Expose functions globally
window.goto = goto;
window.toggleSidebar = toggleSidebar;
window.toggleLanguage = toggleLanguage;
window.applyPrimaryColor = applyPrimaryColor;
window.applySaturation = applySaturation;
window.applyBrightness = applyBrightness;
window.applyThemePreset = applyThemePreset;
window.setBgStyle = setBgStyle;
window.exportData = exportData;
window.confirmReset = confirmReset;
window.openAddHabit = openAddHabit;
window.confirmAddHabit = confirmAddHabit;
window.deleteHabit = deleteHabit;
window.confirmDeleteHabit = confirmDeleteHabit;
window.acceptReview = acceptReview;
window.postponeReview = postponeReview;
window.toggleBinary = toggleBinary;
window.adjustQty = adjustQty;
window.closeModal = closeModal;
window.showToast = showToast;
window.obNext = obNext;
window.obBack = obBack;
window.obGoalTypeChange = obGoalTypeChange;
window.obProgChange = obProgChange;
window.obFinish = obFinish;
window.ahGoalTypeChange = ahGoalTypeChange;
window.ahProgChange = ahProgChange;
window.render = render;
window.renderStats = renderStats;