// Face position (left -> right) scrubs eyeVid.mp4 from start to finish.
// The video is pre-extracted to frames/ so we can crossfade between
// neighbouring frames for sub-frame smoothness.

const NUM_FRAMES = 54;
const SMOOTHING = 0.08; // lower = smoother/slower follow

let faceMesh;
let video;
let faces = [];
let frames = [];

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
  video = createCapture(VIDEO, { flipped: true });
  video.size(640, 480);
  video.hide();
  faceMesh.detectStart(video, gotFaces);
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

// draw an image scaled to cover the canvas
function drawCover(img, alpha) {
  let s = max(width / img.width, height / img.height);
  let w = img.width * s;
  let h = img.height * s;
  tint(255, alpha);
  image(img, (width - w) / 2, (height - h) / 2, w, h);
}

// small webcam preview with the face box
function drawPreview() {
  let pw = 200;
  let ph = pw * video.height / video.width;
  let px = 16;
  let py = height - ph - 16;
  let s = pw / video.width;

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
