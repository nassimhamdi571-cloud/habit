/* ========================================================
   طريق 455 — Habit progression engine
   All data stored locally (localStorage). Works fully offline.
======================================================== */

const STORAGE_KEY = 'h455_state_v1';
const TOTAL_DAYS = 455;
const MILESTONES = [15,45,90,180,270,365,455];
const WEEKDAYS = ['أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'];
const WEEKDAYS_SHORT = ['ح','ن','ث','ر','خ','ج','س'];

/* ---------- Themes (reused luxury palette) ---------- */
const THEMES = [
  {id:'royal-gold', name:'ذهبي ملكي', hex:'#D4A017', h:43, s:82, gem:'linear-gradient(135deg,#FFF4A3 0%,#F5C842 18%,#C8960A 46%,#8A6200 78%,#3A2800 100%)'},
  {id:'platinum', name:'بلاتيني', hex:'#B8C2D0', h:215, s:18, gem:'linear-gradient(135deg,#FFFFFF 0%,#DEE8F5 18%,#AABACE 46%,#6A7A90 78%,#283848 100%)'},
  {id:'sapphire', name:'ياقوت أزرق', hex:'#2060D0', h:219, s:76, gem:'linear-gradient(135deg,#B0D8FF 0%,#3878F0 22%,#0A38B8 50%,#041880 78%,#010830 100%)'},
  {id:'emerald', name:'زمردي', hex:'#197A46', h:148, s:62, gem:'linear-gradient(135deg,#7AFFC0 0%,#18C860 22%,#087840 50%,#024018 78%,#001008 100%)'},
  {id:'amethyst', name:'جمشتي', hex:'#7235A0', h:282, s:48, gem:'linear-gradient(135deg,#ECC8FF 0%,#A848E8 22%,#6018B0 50%,#380878 78%,#160030 100%)'},
  {id:'ruby', name:'ياقوت أحمر', hex:'#BE1A38', h:348, s:74, gem:'linear-gradient(135deg,#FFA0A8 0%,#E81838 22%,#980018 50%,#500008 78%,#1A0002 100%)'},
];

/* ---------- Habit templates ---------- */
const TEMPLATES = [
  {key:'run', name:'الجري / المشي', icon:'🏃', category:'رياضة', kind:'quantity', unit:'كم', isSport:true, sportType:'endurance', start:1, days:[0,2,4]},
  {key:'pushup', name:'تمارين ضغط', icon:'💪', category:'رياضة', kind:'quantity', unit:'تكرار', isSport:true, sportType:'bodyweight', start:5, days:[0,2,4]},
  {key:'read', name:'القراءة', icon:'📖', category:'تعلّم', kind:'quantity', unit:'صفحة', isSport:false, start:10, days:[0,1,2,3,4,5,6]},
  {key:'water', name:'شرب الماء', icon:'💧', category:'صحة', kind:'quantity', unit:'كوب', isSport:false, start:6, days:[0,1,2,3,4,5,6]},
  {key:'meditate', name:'التأمل', icon:'🧘', category:'صحة نفسية', kind:'quantity', unit:'دقيقة', isSport:false, start:5, days:[0,1,2,3,4,5,6]},
  {key:'wake', name:'الاستيقاظ المبكر', icon:'🌅', category:'إنتاجية', kind:'binary', unit:'', isSport:false, start:1, days:[0,1,2,3,4,5,6]},
  {key:'custom', name:'عادة مخصصة', icon:'✦', category:'مخصص', kind:'quantity', unit:'مرة', isSport:false, start:1, days:[0,1,2,3,4,5,6]},
];

/* ---------- State ---------- */
let state = null;

function defaultState(){
  return {
    onboarded:false,
    startDate: todayStr(),
    theme:'royal-gold',
    light:false,
    reminderTime:'20:00',
    habits:[],
    reviewHistory:[]
  };
}

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    state = raw ? JSON.parse(raw) : defaultState();
  }catch(e){ state = defaultState(); }
}
function saveState(){
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

/* ---------- Habit factory ---------- */
function makeHabit(tpl, overrides={}){
  const id = 'h'+Date.now()+Math.floor(Math.random()*1000);
  return Object.assign({
    id,
    name: tpl.name,
    icon: tpl.icon,
    category: tpl.category,
    kind: tpl.kind,
    unit: tpl.unit,
    isSport: !!tpl.isSport,
    sportType: tpl.sportType || null,
    days: tpl.days.slice(),
    level: 1,
    target: tpl.start,
    reviewPeriodDays: tpl.isSport ? 7 : 15,
    periodStart: todayStr(),
    createdAt: todayStr(),
    logs: {},
    streak: 0,
    bestStreak: 0,
    sportUpStreak: 0,
    pendingReview: null,
    active: true
  }, overrides);
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
  if(habit.kind==='binary') return !!log.completed;
  return log.value >= habit.target;
}

/* ---------- Streak calculation ---------- */
function recomputeStreak(habit){
  let streak=0, best=0, cur=0;
  let d = habit.createdAt;
  const end = todayStr();
  // walk forward from createdAt to today
  let day = d;
  const seq = [];
  while(dayDiff(day, end) >= 0){
    seq.push(day);
    day = addDays(day,1);
  }
  for(const ds of seq){
    if(!isScheduled(habit, ds)) continue; // rest days don't affect streak
    if(dayDiff(ds, end) === 0 && !habit.logs[ds]){
      // today, not logged yet -> don't break, just stop counting today
      break;
    }
    if(isHit(habit, ds)){ cur++; best=Math.max(best,cur); }
    else { cur = 0; }
  }
  streak = cur;
  habit.streak = streak;
  habit.bestStreak = Math.max(habit.bestStreak||0, best);
}

/* ---------- Progression / Review engine ---------- */
function growthTarget(habit){
  if(habit.isSport){
    // +10% rule
    let next = Math.ceil(habit.target * 1.10 * 10)/10;
    if(habit.unit==='تكرار' || habit.unit==='مرة') next = Math.ceil(habit.target*1.10);
    return Math.max(next, habit.target + (habit.unit==='كم'?0.1:1));
  }
  // general habits
  if(habit.kind==='binary') return habit.target;
  let next = Math.ceil(habit.target * 1.35);
  return Math.max(next, habit.target+1);
}
function deloadTarget(habit){
  return Math.max(1, Math.round(habit.target*0.55*10)/10);
}

function computeAdherence(habit, periodStart, periodEnd){
  let required=0, done=0;
  let day = periodStart;
  while(dayDiff(day, periodEnd) > 0){ // [periodStart, periodEnd)
    if(isScheduled(habit, day)){
      required++;
      if(isHit(habit, day)) done++;
    }
    day = addDays(day,1);
  }
  const rate = required>0 ? (done/required*100) : 100;
  return {required, done, rate};
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

      if(habit.isSport){
        if(rate>=80){
          habit.sportUpStreak = (habit.sportUpStreak||0)+1;
          if(habit.sportUpStreak>=5){
            action='deload'; newTarget=deloadTarget(habit); habit.sportUpStreak=0;
            note='أسبوع تفريغ (Deload) لمنح جسمك فرصة الاستشفاء قبل استئناف التقدم.';
          }else{
            action='up'; newTarget=growthTarget(habit); newLevel=habit.level+1;
            note='أداء ممتاز! جاهز لزيادة الحمل.';
          }
        } else if(rate>=50){
          action='hold'; note='التزام جيد، حافظ على نفس المستوى فترة إضافية.';
        } else {
          action='down'; newTarget=Math.max(1, Math.round(habit.target*0.85*10)/10);
          habit.sportUpStreak=0;
          note='الأداء أقل من المتوقع — تم تخفيف الحمل مؤقتًا.';
        }
      } else {
        if(rate>=80){
          action='up'; newLevel=habit.level+1; newTarget=growthTarget(habit);
          note='التزام رائع! حان وقت رفع المستوى.';
        } else if(rate>=50){
          action='hold'; note='التزام مقبول، سنبقي المستوى الحالي فترة أخرى.';
        } else {
          action='down'; note='التزام منخفض — سنثبّت المستوى حتى يستقر أداؤك.';
        }
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

/* ---------- Journey (455-day) progress ---------- */
function journeyStats(){
  const today = todayStr();
  const elapsed = Math.min(TOTAL_DAYS, Math.max(0, dayDiff(state.startDate, today)));
  let required=0, done=0;
  for(const habit of state.habits){
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
  let phase='التأسيس', phaseIdx=0;
  if(elapsed>=270){ phase='الإتقان'; phaseIdx=2; }
  else if(elapsed>=90){ phase='البناء'; phaseIdx=1; }
  return {elapsed, effectiveDays, adherence, phase, phaseIdx, remaining: TOTAL_DAYS-elapsed};
}

/* ============================================================
   RENDERING
============================================================ */
let currentView='home';
let statsHabitId=null;

function el(sel){ return document.querySelector(sel); }
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function render(){
  renderTopbar();
  if(currentView==='home') renderHome();
  else if(currentView==='stats') renderStats();
  else if(currentView==='manage') renderManage();
  else if(currentView==='reviews') renderReviews();
  renderNav();
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
    return `<div class="journey-milestone ${passed?'passed':''}" style="right:${pos}%" title="يوم ${m}"></div>`;
  }).join('');

  const pending = state.habits.filter(h=>h.pendingReview);
  const reviewBanner = pending.length ? `
    <div class="glass-card review-banner fade-up" onclick="goto('reviews')">
      <div class="rb-icon">🏅</div>
      <div class="rb-text">لديك ${pending.length} ${pending.length===1?'ترقية جاهزة':'ترقيات جاهزة'} للمراجعة
        <small>اضغط لعرض التفاصيل وقبول أو تأجيل التغييرات</small>
      </div>
    </div>` : '';

  const todays = state.habits.filter(h=>h.active);
  const scheduledToday = todays.filter(h=>isScheduled(h, today));
  const doneToday = scheduledToday.filter(h=>isHit(h, today)).length;
  const dayPct = scheduledToday.length ? doneToday/scheduledToday.length : 0;

  let habitsHtml = '';
  if(todays.length===0){
    habitsHtml = `<div class="glass-card empty-state fade-up">
      <div class="em-icon">✦</div>
      <div class="em-title">لم تُضِف أي عادة بعد</div>
      <div class="em-sub">ابدأ رحلتك بإضافة عادة واحدة أو اثنتين فقط — التدرج الذكي سيتكفل بالباقي.</div>
      <button class="btn" onclick="goto('manage')">إضافة عادة</button>
    </div>`;
  } else {
    habitsHtml = todays.map(h=>{
      const scheduled = isScheduled(h, today);
      const log = getLog(h, today);
      if(!scheduled){
        return `<div class="glass-card habit-card rest">
          <div class="habit-icon">${h.icon}</div>
          <div class="habit-info">
            <div class="habit-name">${esc(h.name)}</div>
            <div class="habit-meta"><span class="rest-tag">يوم راحة</span></div>
          </div>
        </div>`;
      }
      const hit = isHit(h, today);
      if(h.kind==='binary'){
        return `<div class="glass-card habit-card" onclick="toggleBinary('${h.id}')">
          <div class="habit-icon">${h.icon}</div>
          <div class="habit-info">
            <div class="habit-name">${esc(h.name)}</div>
            <div class="habit-meta"><span class="habit-level-badge">المستوى ${h.level}</span><span>🔥 ${h.streak}</span></div>
          </div>
          <div class="habit-check ${hit?'done':''}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>
        </div>`;
      }
      const val = log ? log.value : 0;
      return `<div class="glass-card habit-card">
        <div class="habit-icon">${h.icon}</div>
        <div class="habit-info">
          <div class="habit-name">${esc(h.name)}</div>
          <div class="habit-meta"><span class="habit-level-badge">المستوى ${h.level}</span><span>الهدف ${fmt(h.target)} ${esc(h.unit)}</span><span>🔥 ${h.streak}</span></div>
        </div>
        <div class="habit-qty">
          <button class="qty-btn" onclick="event.stopPropagation();adjustQty('${h.id}',-1)">−</button>
          <span class="qty-val" style="color:${hit?'var(--good)':'var(--t60)'}">${fmt(val)}</span>
          <button class="qty-btn" onclick="event.stopPropagation();adjustQty('${h.id}',1)">+</button>
        </div>
      </div>`;
    }).join('');
  }

  el('#homeView').innerHTML = `
    <div class="glass-card journey-card fade-up">
      <div class="journey-top">
        <span class="journey-phase">مرحلة ${js.phase} · اليوم ${js.elapsed} / ${TOTAL_DAYS}</span>
        <span class="journey-days">${Math.round(js.adherence*100)}% التزام</span>
      </div>
      <div class="journey-track">
        <div class="journey-fill" style="width:${pct}%"></div>
        ${milestonesHtml}
      </div>
      <div class="journey-labels"><span>البداية</span><span>التأسيس</span><span>البناء</span><span>الإتقان</span></div>
    </div>
    ${reviewBanner}
    <div class="glass-card today-row fade-up">
      <div class="ring-wrap">${ringSvg(dayPct)}<div class="ring-label">${scheduledToday.length? Math.round(dayPct*100)+'%':'—'}</div></div>
      <div class="today-text">
        <div class="today-title">اليوم — ${WEEKDAYS[weekdayOf(today)]}</div>
        <div class="today-sub">${scheduledToday.length? `أنجزت ${doneToday} من ${scheduledToday.length} عادات` : 'لا عادات مجدولة اليوم'}</div>
      </div>
    </div>
    <div class="section-label"><span>عادات اليوم</span></div>
    ${habitsHtml}
  `;
}

function fmt(n){
  if(Number.isInteger(n)) return n;
  return Math.round(n*10)/10;
}

function toggleBinary(id){
  const h = state.habits.find(x=>x.id===id);
  const today = todayStr();
  const hit = isHit(h, today);
  setLog(h, today, !hit, hit?0:1);
  recomputeStreak(h);
  saveState();
  renderHome();
  if(!hit) showToast('أحسنت! تم تسجيل الإنجاز ✦');
}
function adjustQty(id, dir){
  const h = state.habits.find(x=>x.id===id);
  const today = todayStr();
  const log = getLog(h, today) || {completed:false, value:0};
  const step = h.unit==='كم' ? 0.1 : 1;
  let val = Math.max(0, Math.round((log.value + dir*step)*10)/10);
  const wasHit = log.value >= h.target;
  setLog(h, today, val>=h.target, val);
  recomputeStreak(h);
  saveState();
  renderHome();
  const nowHit = val>=h.target;
  if(nowHit && !wasHit) showToast('هدف اليوم مكتمل ✦');
}

/* ---------- Reviews view ---------- */
function renderReviews(){
  const pending = state.habits.filter(h=>h.pendingReview);
  let html='';
  if(!pending.length){
    html = `<div class="glass-card empty-state fade-up">
      <div class="em-icon">🏅</div>
      <div class="em-title">لا توجد ترقيات حاليًا</div>
      <div class="em-sub">سيظهر هنا اقتراح الترقية في نهاية كل فترة مراجعة حسب نسبة التزامك.</div>
    </div>`;
  } else {
    html = pending.map(h=>{
      const pr = h.pendingReview;
      const actionLabel = {up:'⬆ ترقية', hold:'⏸ تثبيت', down:'⬇ تخفيض', deload:'♻ أسبوع تفريغ'}[pr.action];
      const actionColor = {up:'var(--good)', hold:'var(--warn)', down:'var(--bad)', deload:'var(--t60)'}[pr.action];
      const detail = h.kind==='binary' ? '' :
        `<div class="habit-meta" style="margin-top:8px;">الهدف الحالي: ${fmt(h.target)} ${esc(h.unit)} ← المقترح: ${fmt(pr.newTarget)} ${esc(h.unit)}</div>`;
      return `<div class="glass-card fade-up" style="padding:16px;margin-bottom:12px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div class="habit-icon">${h.icon}</div>
          <div style="flex:1;">
            <div class="habit-name">${esc(h.name)}</div>
            <div class="habit-meta">${pr.rate}% التزام (${pr.done}/${pr.required} أيام)</div>
          </div>
          <span style="font-size:.7rem;font-weight:800;color:${actionColor};">${actionLabel}</span>
        </div>
        <div class="habit-meta" style="margin-top:10px;line-height:1.7;">${pr.note}</div>
        ${detail}
        <div style="display:flex;gap:10px;margin-top:14px;">
          <button class="btn btn-sm" style="flex:1;" onclick="acceptReview('${h.id}');render()">قبول</button>
          <button class="btn btn-sm btn-ghost" style="flex:1;" onclick="postponeReview('${h.id}');render()">تأجيل</button>
        </div>
      </div>`;
    }).join('');
  }
  el('#reviewsView').innerHTML = `<div class="section-label" style="margin-top:8px;"><span>الترقيات</span></div>${html}`;
}

/* ---------- Stats view ---------- */
function renderStats(){
  const habits = state.habits.filter(h=>h.active);
  if(!statsHabitId && habits.length) statsHabitId = habits[0].id;
  const tabs = habits.map(h=>`<button class="btn btn-sm ${h.id===statsHabitId?'':'btn-ghost'}" style="margin:0 6px 8px 0;" onclick="statsHabitId='${h.id}';renderStats()">${h.icon} ${esc(h.name)}</button>`).join('');

  if(!habits.length){
    el('#statsView').innerHTML = `<div class="glass-card empty-state fade-up" style="margin-top:12px;">
      <div class="em-icon">📊</div><div class="em-title">لا بيانات بعد</div>
      <div class="em-sub">أضف عادة وابدأ بتسجيل إنجازك ليظهر تقدمك هنا.</div>
    </div>`;
    return;
  }
  const h = state.habits.find(x=>x.id===statsHabitId);
  const today = todayStr();

  // overall counts
  let totalDone=0, totalReq=0;
  let day = h.createdAt;
  const last14 = [];
  while(dayDiff(day, today) >= 0){
    if(isScheduled(h, day)){ totalReq++; if(isHit(h,day)) totalDone++; }
    day = addDays(day,1);
  }
  for(let i=13;i>=0;i--){
    const ds = addDays(today, -i);
    last14.push(ds);
  }
  const bars = last14.map(ds=>{
    const sched = isScheduled(h, ds);
    const hit = sched && isHit(h, ds);
    const log = getLog(h, ds);
    const val = log ? log.value : 0;
    const pctH = h.kind==='binary' ? (hit?100:(sched?8:8)) : Math.max(8, Math.min(100, h.target? (val/h.target*100):0));
    return `<div class="bar-col">
      <div class="bar-fill ${hit?'':'low'}" style="height:${sched?pctH:6}%"></div>
      <div class="bar-day">${WEEKDAYS_SHORT[weekdayOf(ds)]}</div>
    </div>`;
  }).join('');

  // month calendar (current month)
  const now = new Date();
  const y=now.getFullYear(), m=now.getMonth();
  const first = new Date(y,m,1);
  const daysInMonth = new Date(y,m+1,0).getDate();
  const startOffset = first.getDay();
  let calCells='';
  for(let i=0;i<startOffset;i++) calCells+=`<div></div>`;
  for(let d=1;d<=daysInMonth;d++){
    const ds = todayStr(new Date(y,m,d));
    let cls='';
    if(dayDiff(ds,today)<0 && dayDiff(ds, h.createdAt) >=0){
      cls = !isScheduled(h,ds) ? '' : (isHit(h,ds)?'done':'missed');
    } else if(ds===today){
      cls = isScheduled(h,ds) ? (isHit(h,ds)?'done':'partial') : '';
    } else if(dayDiff(ds,today)>0){
      cls='future';
    }
    calCells += `<div class="cal-day ${cls}">${d}</div>`;
  }

  const adherence = totalReq? Math.round(totalDone/totalReq*100):0;

  el('#statsView').innerHTML = `
    <div class="section-label" style="margin-top:8px;"><span>العادة</span></div>
    <div style="margin-bottom:6px;">${tabs}</div>
    <div class="glass-card habit-detail-hero fade-up">
      <div class="hd-icon">${h.icon}</div>
      <div class="hd-name">${esc(h.name)}</div>
      <div class="hd-level">المستوى ${h.level} ${h.kind!=='binary'? '· الهدف الحالي '+fmt(h.target)+' '+esc(h.unit):''}</div>
      <div class="streak-row">
        <div class="streak-item"><div class="streak-num">${h.streak}🔥</div><div class="streak-lbl">التتابع الحالي</div></div>
        <div class="streak-item"><div class="streak-num">${h.bestStreak}</div><div class="streak-lbl">أفضل تتابع</div></div>
        <div class="streak-item"><div class="streak-num">${adherence}%</div><div class="streak-lbl">إجمالي الالتزام</div></div>
      </div>
    </div>
    <div class="section-label"><span>آخر 14 يوم</span></div>
    <div class="glass-card bar-chart fade-up">${bars}</div>
    <div class="section-label"><span>هذا الشهر</span></div>
    <div class="glass-card fade-up">
      <div class="calendar-grid">${calCells}</div>
    </div>
    <div style="margin-top:16px;">
      <button class="btn btn-ghost btn-block btn-sm" onclick="confirmDeleteHabit('${h.id}')">حذف هذه العادة</button>
    </div>
  `;
}

function confirmDeleteHabit(id){
  openModal(`
    <div class="modal-title">حذف العادة؟</div>
    <div class="modal-sub">سيتم حذف العادة وكل سجلاتها نهائيًا. هذا الإجراء لا يمكن التراجع عنه.</div>
    <div style="display:flex;gap:10px;">
      <button class="btn btn-danger" style="flex:1;" onclick="deleteHabit('${id}')">حذف نهائي</button>
      <button class="btn btn-ghost" style="flex:1;" onclick="closeModal()">إلغاء</button>
    </div>
  `);
}
function deleteHabit(id){
  state.habits = state.habits.filter(h=>h.id!==id);
  saveState();
  statsHabitId = state.habits.length? state.habits[0].id : null;
  closeModal();
  render();
}

/* ---------- Manage view (add/list habits) ---------- */
function renderManage(){
  const rows = state.habits.map(h=>`
    <div class="glass-card habit-card" style="cursor:default;">
      <div class="habit-icon">${h.icon}</div>
      <div class="habit-info">
        <div class="habit-name">${esc(h.name)}</div>
        <div class="habit-meta"><span class="habit-level-badge">المستوى ${h.level}</span><span>${h.days.map(d=>WEEKDAYS_SHORT[d]).join(' ')}</span></div>
      </div>
      <button class="btn btn-sm btn-ghost" onclick="goto('stats');statsHabitId='${h.id}';renderStats()">تفاصيل</button>
    </div>
  `).join('');

  el('#manageView').innerHTML = `
    <div class="section-label" style="margin-top:8px;"><span>عاداتك (${state.habits.length})</span></div>
    ${rows || `<div class="glass-card empty-state fade-up"><div class="em-icon">✦</div><div class="em-title">لا عادات بعد</div></div>`}
    <button class="btn btn-block" style="margin-top:16px;" onclick="openAddHabit()">+ إضافة عادة جديدة</button>
  `;
}

function openAddHabit(){
  const cards = TEMPLATES.map(t=>`
    <div class="template-card" data-key="${t.key}" onclick="selectAddTemplate('${t.key}')">
      <span class="t-icon">${t.icon}</span>
      <span class="t-name">${t.name}</span>
    </div>
  `).join('');
  openModal(`
    <div class="modal-title">إضافة عادة</div>
    <div class="modal-sub">اختر نوع العادة، وسنبدأ من مستوى مناسب للمبتدئين ويتدرج تلقائيًا.</div>
    <div class="template-grid" id="addTplGrid">${cards}</div>
    <div id="addTplForm"></div>
  `);
}

let _addTplKey=null, _addDays=new Set([0,1,2,3,4,5,6]), _customName='';
function selectAddTemplate(key){
  _addTplKey = key;
  document.querySelectorAll('#addTplGrid .template-card').forEach(c=>c.classList.toggle('sel', c.dataset.key===key));
  const tpl = TEMPLATES.find(t=>t.key===key);
  _addDays = new Set(tpl.days);
  const dayChips = [0,1,2,3,4,5,6].map(d=>`<div class="day-chip ${_addDays.has(d)?'on':''}" data-d="${d}" onclick="toggleAddDay(${d})">${WEEKDAYS_SHORT[d]}</div>`).join('');
  const nameField = key==='custom' ? `
    <div style="margin-top:14px;"><span class="field-label">اسم العادة</span>
    <input type="text" id="customNameInput" placeholder="مثال: كتابة يومية" oninput="_customName=this.value"></div>` : '';
  el('#addTplForm').innerHTML = `
    ${nameField}
    <div style="margin-top:14px;"><span class="field-label">أيام الأسبوع</span>
      <div class="day-picker">${dayChips}</div>
    </div>
    <button class="btn btn-block" style="margin-top:18px;" onclick="confirmAddHabit()">إضافة العادة</button>
  `;
}
function toggleAddDay(d){
  if(_addDays.has(d)) _addDays.delete(d); else _addDays.add(d);
  document.querySelector(`.day-chip[data-d="${d}"]`).classList.toggle('on');
}
function confirmAddHabit(){
  if(!_addTplKey || _addDays.size===0){ showToast('اختر نوع العادة والأيام'); return; }
  const tpl = TEMPLATES.find(t=>t.key===_addTplKey);
  const overrides = {days:[..._addDays].sort()};
  if(_addTplKey==='custom'){
    overrides.name = _customName.trim() || 'عادة مخصصة';
  }
  const habit = makeHabit(tpl, overrides);
  state.habits.push(habit);
  saveState();
  closeModal();
  goto('home');
  showToast('تمت إضافة العادة ✦');
}

/* ---------- Nav / views ---------- */
function goto(view){
  currentView = view;
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  el('#'+view+'View').classList.add('active');
  render();
  window.scrollTo({top:0, behavior:'smooth'});
}
function renderNav(){
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.toggle('active', n.dataset.view===currentView));
}

/* ---------- Modal / toast ---------- */
function openModal(html){
  el('#modalSheet').innerHTML = `<div class="modal-handle"></div>${html}`;
  el('#modalOverlay').classList.add('open');
}
function closeModal(){ el('#modalOverlay').classList.remove('open'); }
let toastTimer;
function showToast(msg){
  const t = el('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.classList.remove('show'), 2200);
}

/* ============================================================
   THEME / SETTINGS
============================================================ */
function buildThemeGrid(){
  el('#themeGrid').innerHTML = THEMES.map(t=>`
    <div class="sb-card ${t.id===state.theme?'active':''}" onclick="applyTheme('${t.id}')">
      <div class="sb-swatch" style="background:${t.gem}"></div>
      <span class="sb-name">${t.name}</span>
      <div class="sb-dot"></div>
    </div>
  `).join('');
}
function applyTheme(id){
  const t = THEMES.find(x=>x.id===id); if(!t) return;
  state.theme = id; saveState();
  document.documentElement.style.setProperty('--theme-hue', t.h);
  document.documentElement.style.setProperty('--theme-sat', t.s+'%');
  document.querySelectorAll('.sb-card').forEach(c=>c.classList.remove('active'));
  buildThemeGrid();
  render();
}
function toggleLight(){
  state.light = !state.light; saveState();
  document.body.classList.toggle('light-mode', state.light);
  el('#lightPill').classList.toggle('on', state.light);
  el('#lightLabel').textContent = state.light ? 'الوضع الفاتح' : 'الوضع الداكن';
}

function openSidebar(){
  el('#sidebarPanel').classList.add('open');
  el('#sidebarOverlay').classList.add('open');
}
function closeSidebar(){
  el('#sidebarPanel').classList.remove('open');
  el('#sidebarOverlay').classList.remove('open');
}

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
    <div class="modal-title">إعادة تعيين البيانات؟</div>
    <div class="modal-sub">سيتم حذف جميع العادات والسجلات والبدء من جديد. لا يمكن التراجع عن هذا.</div>
    <div style="display:flex;gap:10px;">
      <button class="btn btn-danger" style="flex:1;" onclick="doReset()">تأكيد الحذف</button>
      <button class="btn btn-ghost" style="flex:1;" onclick="closeModal()">إلغاء</button>
    </div>
  `);
}
function doReset(){
  localStorage.removeItem(STORAGE_KEY);
  closeModal();
  location.reload();
}

/* ============================================================
   ONBOARDING
============================================================ */
let obStep=0;
let obSelected = new Map(); // key -> {days:Set}
function startOnboarding(){
  el('#onboardOverlay').style.display='block';
  obStep=0; renderOb();
}
function renderOb(){
  document.querySelectorAll('.ob-step').forEach((s,i)=>s.classList.toggle('active', i===obStep));
  document.querySelectorAll('.ob-progress i').forEach((s,i)=>s.classList.toggle('done', i<=obStep));
  if(obStep===1) renderObTemplates();
  if(obStep===2) renderObDays();
}
function obNext(){ if(obStep<3){ obStep++; renderOb(); } }
function obBack(){ if(obStep>0){ obStep--; renderOb(); } }

function renderObTemplates(){
  el('#obTplGrid').innerHTML = TEMPLATES.filter(t=>t.key!=='custom').map(t=>`
    <div class="template-card ${obSelected.has(t.key)?'sel':''}" data-key="${t.key}" onclick="obToggleTemplate('${t.key}')">
      <span class="t-icon">${t.icon}</span>
      <span class="t-name">${t.name}</span>
      <span class="t-lvl">يبدأ من ${t.start}${t.unit?(' '+t.unit):''}</span>
    </div>
  `).join('');
}
function obToggleTemplate(key){
  if(obSelected.has(key)) obSelected.delete(key);
  else {
    if(obSelected.size>=3){ showToast('يُنصح بالبدء بـ 1-3 عادات فقط'); return; }
    const tpl = TEMPLATES.find(t=>t.key===key);
    obSelected.set(key, {days:new Set(tpl.days)});
  }
  renderObTemplates();
}
function renderObDays(){
  const wrap = el('#obDaysWrap');
  if(obSelected.size===0){
    wrap.innerHTML = `<div class="em-sub" style="text-align:center;padding:20px 0;">لم تختر أي عادة — عد للخطوة السابقة.</div>`;
    return;
  }
  wrap.innerHTML = [...obSelected.entries()].map(([key,cfg])=>{
    const tpl = TEMPLATES.find(t=>t.key===key);
    const chips = [0,1,2,3,4,5,6].map(d=>`<div class="day-chip ${cfg.days.has(d)?'on':''}" onclick="obToggleDay('${key}',${d})">${WEEKDAYS_SHORT[d]}</div>`).join('');
    return `<div class="ob-list-item" style="flex-direction:column;align-items:stretch;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
        <span style="font-size:1.2rem;">${tpl.icon}</span><strong style="font-size:.85rem;">${tpl.name}</strong>
      </div>
      <div class="day-picker">${chips}</div>
    </div>`;
  }).join('');
}
function obToggleDay(key,d){
  const cfg = obSelected.get(key);
  if(cfg.days.has(d)) cfg.days.delete(d); else cfg.days.add(d);
  renderObDays();
}
function finishOnboarding(){
  const time = el('#obReminderTime').value;
  state.reminderTime = time || '20:00';
  state.startDate = todayStr();
  for(const [key,cfg] of obSelected.entries()){
    const tpl = TEMPLATES.find(t=>t.key===key);
    const days = [...cfg.days].sort();
    if(days.length===0) continue;
    state.habits.push(makeHabit(tpl, {days}));
  }
  state.onboarded = true;
  saveState();
  el('#onboardOverlay').style.display='none';
  applyTheme(state.theme);
  document.body.classList.toggle('light-mode', state.light);
  goto('home');
}

/* ============================================================
   INIT
============================================================ */
function init(){
  loadState();
  document.documentElement.style.setProperty('--theme-hue', THEMES.find(t=>t.id===state.theme).h);
  document.documentElement.style.setProperty('--theme-sat', THEMES.find(t=>t.id===state.theme).s+'%');
  document.body.classList.toggle('light-mode', state.light);
  buildThemeGrid();
  el('#lightPill').classList.toggle('on', state.light);
  el('#lightLabel').textContent = state.light ? 'الوضع الفاتح' : 'الوضع الداكن';

  if(!state.onboarded){
    startOnboarding();
  } else {
    goto('home');
  }

  // mouse/touch glow
  document.addEventListener('pointermove', e=>{
    const t = THEMES.find(x=>x.id===state.theme);
    document.getElementById('mouseGlow').style.background =
      `radial-gradient(circle 480px at ${e.clientX}px ${e.clientY}px,hsla(${t.h},${t.s}%,50%,0.05),transparent 45%)`;
  });

  // PWA install
  let deferredPrompt=null;
  window.addEventListener('beforeinstallprompt', (e)=>{
    e.preventDefault(); deferredPrompt=e;
    el('#installBanner').style.display='flex';
  });
  el('#installBtn').addEventListener('click', async ()=>{
    if(!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt=null;
    el('#installBanner').style.display='none';
  });

  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  }
}
document.addEventListener('DOMContentLoaded', init);
