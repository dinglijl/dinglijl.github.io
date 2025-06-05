import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";

const container = document.getElementById("mixjs-container");
const sceneMeshOnly = new THREE.Scene();
const sceneSkeletonOnly = new THREE.Scene();
const sceneBoth = new THREE.Scene();
let activeScene = sceneBoth;
sceneBoth.background = new THREE.Color(0xFFFFFF);
sceneMeshOnly.background = new THREE.Color(0xFFFFFF);
sceneSkeletonOnly.background = new THREE.Color(0xFFFFFF);
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

// Display the skeleton or mesh
const meshCheckbox = document.getElementById('toggleMesh');

let skeletonHelper = null;
let mixerFBX;
let mixerMesh;
let mesh = null;
let animationAction;
let animationPlaying = true;
let animationMixers = [];
const animationActions = [];
const textureLoader = new THREE.TextureLoader();
const grassTexture = textureLoader.load('textures/Grass_Block_(top_texture).webp');
grassTexture.magFilter = THREE.NearestFilter; // makes pixels sharp like Minecraft
grassTexture.wrapS = THREE.RepeatWrapping;
grassTexture.wrapT = THREE.RepeatWrapping;
grassTexture.repeat.set(50, 50); 
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(800, 800),
  new THREE.MeshBasicMaterial({ map: grassTexture })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
ground.userData.isGround = true;
sceneBoth.add(ground);

const skyTexture = textureLoader.load('textures/sky.jpg');
sceneBoth.background = skyTexture;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
sceneBoth.add(ambientLight.clone());

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 5);
sceneBoth.add(directionalLight.clone());

sceneMeshOnly.add(ambientLight.clone());
sceneMeshOnly.add(directionalLight.clone());
const skyTexture1 = textureLoader.load('textures/sky.jpg');
sceneMeshOnly.background = skyTexture1;
sceneMeshOnly.add(ground.clone());

const fbxLoader = new FBXLoader();
fbxLoader.load(
    fbxFile,
    (object) => {
      sceneBoth.add(object);

        object.traverse(function (child) {
            if (child.isSkinnedMesh) {
                if (child.material.map) {
                  child.material.map.encoding = THREE.sRGBEncoding;
                  child.material.needsUpdate = true;
                }
                if (child.skeleton) {
                  console.log("🦴 Skeleton found:");
                  console.log("   - Bone count:", child.skeleton.bones.length);
                  console.log("   - First bone name:", child.skeleton.bones[0]?.name ?? "N/A");
                }
                console.log("🎯 SkinnedMesh:", child.name);
                console.log("🔗 Bound to skeleton with", child.skeleton?.bones.length, "bones");
                console.log("💡 Influenced by bones:", child.skeleton?.boneInverses.length);
                
                child.material.side = THREE.DoubleSide;
                mesh = child;
                skeletonHelper = new THREE.SkeletonHelper(child.skeleton.bones[0]);
                skeletonHelper.renderOrder = 999;
                sceneBoth.add(skeletonHelper);
                mixerFBX = new THREE.AnimationMixer(object);
                animationAction = mixerFBX.clipAction(object.animations[0]);
                animationAction.play();
                
                animationActions.push(animationAction);

            }
            
        });

        // updateVisibility()
        animationMixers = [mixerFBX, mixerMesh];
        const box = new THREE.Box3().setFromObject(object);
        const center = new THREE.Vector3();
        box.getCenter(center);
        controls.target.copy(center); 
        controls.update();
        const size = box.getSize(new THREE.Vector3()).length();
        const distance = size * 1.5;

        camera.position.set(center.x, center.y + size * 0.2, center.z + distance);
        updateVisibility();


    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
    },
    (error) => {
        console.log(error);
    }
    
);
fbxLoader.load(
  fbxFile,
  (object) => {
    sceneMeshOnly.add(object);

      object.traverse(function (child) {
          if (child.isSkinnedMesh) {
              if (child.material.map) {
                child.material.map.encoding = THREE.sRGBEncoding;
                child.material.needsUpdate = true;
              }
              child.material.side = THREE.DoubleSide;
              mesh = child;
              mixerMesh = new THREE.AnimationMixer(object);
              animationAction = mixerMesh.clipAction(object.animations[0]);
              animationAction.play();
              animationActions.push(animationAction);
          }
      });

      // updateVisibility()
      animationMixers = [mixerFBX, mixerMesh];
      const box = new THREE.Box3().setFromObject(object);
      const center = new THREE.Vector3();
      box.getCenter(center);
      controls.target.copy(center); 
      controls.update();
      const size = box.getSize(new THREE.Vector3()).length();
      const distance = size * 1.5;

      camera.position.set(center.x, center.y + size * 0.2, center.z + distance);


  },
  (xhr) => {
      console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
  },
  (error) => {
      console.log(error);
  }
  
);


function updateVisibility() {
  sceneBoth.traverse((child) => {
        if ((child.isMesh || child.isSkinnedMesh) && !child.userData.isGround) {
          child.visible = meshCheckbox.checked;
        }
      });
    if (skeletonHelper){
        console.log("Toggling helper visibility");
        skeletonHelper.visible = false;
        console.log("came");
    }
    
  }

  function playAnimation() {
    animationActions.forEach(action => {
      action.paused = false;
      action.play();
    });
  }
  
  function pauseAnimation() {
    animationActions.forEach(action => {
      action.paused = true;
    });
  }
  
  function rewindAnimation() {
    animationActions.forEach(action => {
      action.reset();      // jump to start
      action.play();       // resume playing
      action.paused = false;
    });
  }
  
  function stepForward() {
    animationMixers.forEach(mixer => {
      mixer.update(5 / 30); // move forward by one frame at 30fps
    });
  }


const clock = new THREE.Clock();  

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    animationMixers.forEach((mixer) => {
      mixer.update(delta);
    });
    controls.update();
    render();
}
function render() {
    renderer.render(activeScene, camera)
}

document.getElementById("viewMode").addEventListener("change", (e) => {
  switch (e.target.value) {
    case "mesh":
      // sceneMeshOnly.add(object);
      activeScene = sceneMeshOnly;
      break;
    case "both":
    default:
      // sceneBoth.add(object);
      activeScene = sceneBoth;
      break;
  }
});

document.getElementById("btnPlay").addEventListener("click", playAnimation);
document.getElementById("btnPause").addEventListener("click", pauseAnimation);
document.getElementById("btnRewind").addEventListener("click", rewindAnimation);
document.getElementById("btnStep").addEventListener("click", stepForward);


animate()

meshCheckbox.addEventListener('change', updateVisibility);
window.playAnimation = playAnimation;
window.pauseAnimation = pauseAnimation;
window.rewindAnimation = rewindAnimation;
window.stepForward = stepForward;