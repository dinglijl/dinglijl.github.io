import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";

const container = document.getElementById("container");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xFFFFFF);
const camera = new THREE.PerspectiveCamera( 75, 1, 0.1, 1000 );

const urlParams = new URLSearchParams(window.location.search);
const fbxFile = urlParams.get('fbx');

const renderer = new THREE.WebGLRenderer();
renderer.setSize(container.clientWidth, container.clientWidth);
container.appendChild(renderer.domElement);


const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.rotateSpeed = 0.5;
controls.target.set(0, 1, 0);
controls.minPolarAngle = Math.PI / 2.5;  
controls.maxPolarAngle = Math.PI / 1.5; 
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

let mixer;

const fbxLoader = new FBXLoader();
fbxLoader.load(
    fbxFile,
    (object) => {
        scene.add(object);
        mixer = new THREE.AnimationMixer(object);
        const action = mixer.clipAction(object.animations[0]);
        action.play();

        const box = new THREE.Box3().setFromObject(object);
        const center = new THREE.Vector3();
        box.getCenter(center);
        controls.target.copy(center); 
        controls.update();
        const size = box.getSize(new THREE.Vector3()).length();
        const distance = size * 1.2;

        camera.position.set(center.x, center.y + size * 0.2, center.z + distance);


    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
    },
    (error) => {
        console.log(error);
    }
    
);

const clock = new THREE.Clock();  

function animate() {
    requestAnimationFrame(animate);
    if (mixer) {
        mixer.update(clock.getDelta()); 
    }
    controls.update();
    render();
}
function render() {
    renderer.render(scene, camera)
}
animate()

const generateBtn = document.getElementById("generate");
if (!generateBtn) {
  console.error("❌ 'generate' button not found");
}

generateBtn.addEventListener("click", () => {
  // console.log("Generate button clicked");

  const gif = new window.GIF({ 
    workers: 2,
    quality: 10,
    width: renderer.domElement.width,
    height: renderer.domElement.height,
    workerScript: 'gif.worker.js'
  });

  let duration = 5; // seconds
  let frameRate = 10;
  let totalFrames = duration * frameRate;
  let captured = 0;

  function captureFrame() {
    if (captured >= totalFrames) {
      console.log("🟡 Done capturing frames, rendering...");
      gif.render();
      return;
    }

    if (mixer) mixer.update(1 / frameRate);
    renderer.render(scene, camera);

    gif.addFrame(renderer.domElement, { copy: true, delay: 1000 / frameRate });
    console.log(`🟢 Captured frame ${captured + 1}/${totalFrames}`);
    captured++;
    requestAnimationFrame(captureFrame);
  }

  gif.on('finished', (blob) => {
    console.log("✅ GIF rendering finished");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    console.log(url);
    a.download = "animation.gif";
    a.click();
    console.log("✅ GIF download triggered:", url);
  });

  captureFrame();
});