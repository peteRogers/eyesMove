let faceMesh;
let video;
let faces = [];
let options = { maxFaces: 1, refineLandmarks: false, flipped: true };

function preload() {
  faceMesh = ml5.faceMesh(options);
}

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO, { flipped: true });
  video.size(640, 480);
  video.hide();
  faceMesh.detectStart(video, gotFaces);
}

function draw() {
  image(video, 0, 0, width, height);

  noFill();
  stroke(0, 255, 0);
  strokeWeight(3);
  for (let face of faces) {
    let b = face.box;
    rect(b.xMin, b.yMin, b.width, b.height);
  }
}

function gotFaces(results) {
  faces = results;
}
