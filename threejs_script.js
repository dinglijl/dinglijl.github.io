import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { BVHLoader } from "three/addons/loaders/BVHLoader.js";

const container = document.getElementById("threejs-container");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xFFFFFF);
const camera = new THREE.PerspectiveCamera( 75, 1, 0.1, 1000 );

const urlParams = new URLSearchParams(window.location.search);
const bvhFile = urlParams.get('bvh'); // fallback if no param

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


let skeletonHelper;
let mixer;
const loader = new BVHLoader();
loader.load(bvhFile, (result) => {
    
    skeletonHelper = new THREE.SkeletonHelper(result.skeleton.bones[0]);

    skeletonHelper.material.linewidth = 3;  
    skeletonHelper.material.color.set(0x75e6da);  
    scene.add( result.skeleton.bones[0]);
    scene.add( skeletonHelper );


    const bbox = new THREE.Box3().setFromObject(skeletonHelper);
    const center = bbox.getCenter(new THREE.Vector3());

    camera.position.set(center.x, center.y + 100, center.z + 500);
    controls.target.copy(center); 
    controls.update();

    if (result.clip) {
        mixer = new THREE.AnimationMixer(result.skeleton.bones[0]); 
        const action = mixer.clipAction(result.clip);
        action.play();
    }
});

const clock = new THREE.Clock();  


function animate() {
    requestAnimationFrame(animate);
    if (mixer) mixer.update(clock.getDelta());

    renderer.render(scene, camera);
}
animate();


// camera.position.set(0, 0, 500); 
