const socket = io();

// UI refs
const createBtn = document.getElementById('createBtn');
const joinBtn = document.getElementById('joinBtn');
const roomInput = document.getElementById('roomInput');
const roomInfo = document.getElementById('roomInfo');
const raceEl = document.querySelector('.race');
const roomIdEl = document.getElementById('roomId');
const playersCountEl = document.getElementById('playersCount');
const startBtn = document.getElementById('startBtn');
const wordsEl = document.getElementById('words');
const inputEl = document.getElementById('input');
const progressEl = document.getElementById('progress');
const opponentsEl = document.getElementById('opponents');
const resultEl = document.getElementById('result');
const fingersEl = document.getElementById('fingers');
const hintEl = document.getElementById('hint');

let room = null;
let words = [];
let index = 0;
let correctCount = 0;
let started = false;
let fingerSet = new Set();

// finger mapping (approx) for lowercase letters and space
const FINGER_MAP = {
  // left pinky
  q: 'LP', a: 'LP', z: 'LP',
  // left ring
  w: 'LR', s: 'LR', x: 'LR',
  // left middle
  e: 'LM', d: 'LM', c: 'LM',
  // left index
  r: 'LI', t: 'LI', f: 'LI', g: 'LI', v: 'LI', b: 'LI',
  // right index
  y: 'RI', u: 'RI', h: 'RI', j: 'RI', n: 'RI', m: 'RI',
  // right middle
  i: 'RM', k: 'RM',
  // right ring
  o: 'RR', l: 'RR',
  // right pinky
  p: 'RP', ';': 'RP', '/': 'RP',
  // thumbs
  ' ': 'TH'
};

const ALL_FINGERS = ['LP','LR','LM','LI','TH','RI','RM','RR','RP'];

createBtn.addEventListener('click', () => {
  socket.emit('create-room', (roomId) => {
    room = roomId;
    roomIdEl.textContent = room;
    roomInfo.innerHTML = `Sala creada: <strong>${room}</strong> - comparte el código o la URL`;
    showRace();
  });
});

joinBtn.addEventListener('click', () => {
  const r = roomInput.value.trim();
  if (!r) return alert('Introduce código de sala');
  socket.emit('join-room', { room: r }, (res) => {
    if (res && res.error) return alert(res.error);
    room = r;
    roomIdEl.textContent = room;
    showRace();
  });
});

startBtn.addEventListener('click', () => {
  if (!room) return;
  socket.emit('start-race', { room, wordsCount: 30 });
});

socket.on('room-update', ({ players }) => {
  playersCountEl.textContent = players.length;
});

socket.on('race-start', ({ words: w }) => {
  words = w;
  index = 0;
  correctCount = 0;
  started = true;
  fingerSet.clear();
  renderWords();
  inputEl.value = '';
  inputEl.focus();
  resultEl.textContent = '';
});

socket.on('opponent-progress', ({ id, progress }) => {
  let el = document.querySelector(`#op-${id}`);
  if (!el) {
    el = document.createElement('div');
    el.id = 'op-' + id;
    opponentsEl.appendChild(el);
  }
  el.textContent = `Jugador ${id.substring(0,6)}: ${Math.round(progress*100)}%`;
});

socket.on('player-finished', ({ id, result }) => {
  const div = document.createElement('div');
  div.textContent = `Jugador ${id.substring(0,6)} terminó: ${result.wpm} WPM, precisión ${Math.round(result.acc*100)}%`;
  opponentsEl.appendChild(div);
});

function showRace(){
  document.querySelector('.lobby').style.display = 'none';
  raceEl.style.display = 'block';
}

function renderWords(){
  wordsEl.innerHTML = '';
  words.forEach((w,i) => {
    const span = document.createElement('span');
    span.className = 'word' + (i===0? ' active':'');
    span.textContent = w;
    wordsEl.appendChild(span);
  });
}

inputEl.addEventListener('input', (e) => {
  if (!started) return;
  const val = e.target.value;
  // track fingers used
  trackFingers(val);

  const current = words[index];
  if (val.endsWith(' ')){
    const typed = val.trim();
    const span = wordsEl.children[index];
    if (typed === current){
      span.classList.remove('active');
      span.classList.add('correct');
      correctCount++;
    } else {
      span.classList.remove('active');
      span.classList.add('wrong');
    }
    index++;
    e.target.value = '';
    if (index < words.length){
      wordsEl.children[index].classList.add('active');
    } else {
      finishRace();
    }
    reportProgress();
  } else {
    // live check
    const span = wordsEl.children[index];
    if (current.startsWith(val)){
      span.classList.remove('wrong');
    } else {
      span.classList.add('wrong');
    }
  }
});

function reportProgress(){
  const progress = index/words.length;
  progressEl.textContent = Math.round(progress*100) + '%';
  socket.emit('progress', { room, progress });
}

function finishRace(){
  started = false;
  const accuracy = correctCount/words.length;
  const wpm = Math.round((correctCount/5) / (1/60)); // approximate assume 1 minute session — simplified
  const fingersUsed = getFingersUsedCount();
  const passFingerCheck = fingersUsed >= ALL_FINGERS.length;
  hintEl.textContent = passFingerCheck ? 'Buen uso de dedos' : 'No usaste todos los dedos durante la carrera';
  fingersEl.textContent = `${fingersUsed}/${ALL_FINGERS.length}`;

  const result = { wpm, acc: accuracy, fingersUsed };
  socket.emit('finished', { room, result });
  resultEl.textContent = `Terminaste: ${wpm} WPM - Precisión ${Math.round(accuracy*100)}% - Dedos ${fingersUsed}/${ALL_FINGERS.length}`;
}

function trackFingers(text){
  for (const ch of text.toLowerCase()){
    const f = FINGER_MAP[ch];
    if (f) fingerSet.add(f);
  }
  fingersEl.textContent = `${getFingersUsedCount()}/${ALL_FINGERS.length}`;
}

function getFingersUsedCount(){
  return ALL_FINGERS.filter(f => fingerSet.has(f)).length;
}

// Friendly shortcut: join room from URL like ?room=abc123
(function tryAutoJoin(){
  const params = new URLSearchParams(location.search);
  const r = params.get('room');
  if (r){
    roomInput.value = r;
    joinBtn.click();
  }
})();
