// Face position (left -> right) scrubs eyeVid.mp4 from start to finish.
// The video is pre-extracted to frames/ so we can crossfade between
// neighbouring frames for sub-frame smoothness.

const NUM_FRAMES = 54;
const SMOOTHING = 0.08; // lower = smoother/slower follow
const SIZE = 0.5;       // eye fits within this fraction of the screen

let faceMesh;
let video;
let faces = [];
let frames = [];

let showPreview = true;
let previewRect = { x: 0, y: 0, w: 0, h: 0 };

let target = 0;   // 0..1 from face position
let pos = 0;      // smoothed 0..1

function preload() {
  faceMesh = ml5.faceMesh({ maxFaces: 1, refineLandmarks: false, flipped: true });
  for (let i = 1; i <= NUM_FRAMES; i++) {
    frames.push(loadImage('frames/' + nf(i, 3) + '.jpg'));
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  video = createCapture(
    { video: { facingMode: 'user', width: 640, height: 480 }, audio: false },
    { flipped: true }
  );
  video.elt.setAttribute('playsinline', '');
  video.elt.muted = true;
  video.size(640, 480);
  video.hide();
  faceMesh.detectStart(video, gotFaces);

  // tap the webcam preview to hide it, tap the same corner to bring it back
  // (pointerdown avoids the double touch + mouse events on iPad)
  document.querySelector('canvas').addEventListener('pointerdown', (e) => {
    let r = previewRect;
    if (e.clientX >= r.x && e.clientX <= r.x + r.w &&
        e.clientY >= r.y && e.clientY <= r.y + r.h) {
      showPreview = !showPreview;
    }
  });

  setupFullscreenButton();
}

function setupFullscreenButton() {
  let overlay = document.getElementById('start');
  let el = document.documentElement;

  overlay.querySelector('button').addEventListener('click', () => {
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    overlay.classList.add('hidden');
  });

  // show the button again if fullscreen is exited
  let onChange = () => {
    let fs = document.fullscreenElement || document.webkitFullscreenElement;
    if (!fs) overlay.classList.remove('hidden');
  };
  document.addEventListener('fullscreenchange', onChange);
  document.addEventListener('webkitfullscreenchange', onChange);
}

function draw() {
  background(0);

  if (faces.length > 0) {
    let b = faces[0].box;
    let cx = b.xMin + b.width / 2;
    // use the middle 70% of the camera view as the full range
    target = constrain(map(cx, video.width * 0.15, video.width * 0.85, 0, 1), 0, 1);
  }

  // frame-rate independent easing
  let k = 1 - pow(1 - SMOOTHING, deltaTime / 16.67);
  pos += (target - pos) * k;

  // crossfade between the two nearest frames
  let f = pos * (NUM_FRAMES - 1);
  let i = floor(f);
  let t = f - i;
  drawCover(frames[i], 255);
  if (t > 0.001 && i + 1 < NUM_FRAMES) drawCover(frames[i + 1], t * 255);
  noTint();

  drawPreview();
}

// draw an image centred, fitting within SIZE of the canvas (black border around)
function drawCover(img, alpha) {
  let s = min(width / img.width, height / img.height) * SIZE;
  let w = img.width * s;
  let h = img.height * s;
  tint(255, alpha);
  image(img, (width - w) / 2, (height - h) / 2, w, h);
}

// small webcam preview with the face box
function drawPreview() {
  let pw = 200;
  let ph = pw * video.height / video.width;
  let px = 24;
  let py = height - ph - 40; // clear of iPhone corners / home bar
  let s = pw / video.width;
  previewRect = { x: px, y: py, w: pw, h: ph };
  if (!showPreview) return;

  image(video, px, py, pw, ph);
  noFill();
  stroke(0, 255, 0);
  strokeWeight(2);
  for (let face of faces) {
    let b = face.box;
    rect(px + b.xMin * s, py + b.yMin * s, b.width * s, b.height * s);
  }
  stroke(255);
  rect(px, py, pw, ph);
}

function gotFaces(results) {
  faces = results;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
