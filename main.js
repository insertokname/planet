import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@v0.149.0/examples/jsm/loaders/GLTFLoader';

let camera_radius = 20;
let is_dialogue_open = false;

var locations = [
	[47.07123, 21.944729, "pers1"],
	[61.863863, 15.038113, "pers2"],
	[-21.782963, 125.265263, "pers3"]
]  

//util function
function isMobileDevice() {
	return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

//Scene creation
const scene = new THREE.Scene();
//scene.add(new THREE.GridHelper(200, 50));
scene.background = new THREE.Color(0xdddddd);

//Sphere for testing
/*
const geometry = new THREE.SphereGeometry(3, 64, 64);
const material = new THREE.MeshStandardMaterial({
	color: '#00ff83',
});

const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);
*/

//loading each location on the planet surface

let radius = 5.2;
let dot_radius = 0.2;
let dot_interaction_radius = 0.9;
if (isMobileDevice()) {
	dot_interaction_radius *= 1.3;
}
let latitude_offset = 0;
let longitude_offset = -129.5; 
	

locations.forEach((elem) => {
	const dot_interaction_geometry = new THREE.SphereGeometry(dot_interaction_radius, 8, 8);
	const dot_interaction_material = new THREE.MeshStandardMaterial({
		color: '#cc66ff',
		transparent: true,
		opacity: 0,
	});
	dot_interaction_material.locations_index = locations.indexOf(elem);
	
	const dot_geometry = new THREE.SphereGeometry(dot_radius, 8, 8);
	const dot_material = new THREE.MeshStandardMaterial({
		color: '#cc66ff',
	});
	
	let latitude = latitude_offset + elem[0]; 
	let longitude = longitude_offset - elem[1]; 

	// Convert latitude and longitude to radians
	let latRad = THREE.MathUtils.degToRad(latitude);
	let lonRad = THREE.MathUtils.degToRad(longitude);

	// Calculate the position of the point on the imaginary sphere
	//bag picioru in trigo
	let x = radius * Math.cos(latRad) * Math.cos(lonRad);
	let y = radius * Math.sin(latRad);
	let z = radius * Math.cos(latRad) * Math.sin(lonRad);

	//create a obj for the dot and place it in the right spot

	const dot_mesh = new THREE.Mesh(dot_geometry, dot_material);
	dot_mesh.position.set(x,y,z);
	scene.add(dot_mesh);

	const dot_interaction_mesh = new THREE.Mesh(dot_interaction_geometry, dot_interaction_material);
	dot_interaction_mesh.position.set(x, y, z);
	scene.add(dot_interaction_mesh);
})


//Earth model importing
const fbxLoader = new GLTFLoader()
fbxLoader.load("./assets/earth.gltf", (gltfScene) => {
	gltfScene.scene.scale.set(0.05, 0.05, 0.05)
	scene.add(gltfScene.scene);
})


//Sizes of the renderering window
const sizes = {
	width: window.innerWidth*0.5,
	heigth: 500
}


//Light initing -not going to explain this <3
let HemiLight  = new THREE.HemisphereLight(0xffeeb1, 0x080820, 4);
HemiLight.intensity = 1;

let spotlight = new THREE.SpotLight(0xffa95c, 4);
spotlight.castShadow = true;
spotlight.intensity = 0.6

let lightHolder = new THREE.Group();
lightHolder.add(HemiLight);
lightHolder.add(spotlight);
scene.add(lightHolder);
scene.add(new THREE.PointLightHelper(HemiLight))


//Camera - neither this
const camera = new THREE.PerspectiveCamera(45, sizes.width/ sizes.heigth);
camera.position.z = camera_radius;
scene.add(camera);


//Renderer -or this
const canvas = document.querySelector(".webgl");
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(sizes.width, sizes.heigth);
renderer.render(scene, camera);
renderer.setPixelRatio(1);
renderer.toneMapping = THREE.ReinhardToneMapping
renderer.toneMappingExposure = 3.3;
renderer.gammaOutput = true;
renderer.gammaFactor = 2.2;


//Camera controls

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enablePan = false;
controls.enableZoom = false;
controls.autoRotate = true;
//fuck this
controls.autoRotateSpeed = isMobileDevice() ? 2 : 1;


let zoom_in_radius_magnitude = 2;
let focused_obj = "";
let zoom_in_duration = 0.7;
let zoom_out_duration = 0.7;

//makes a dialogue box
function showDialogue(event, name) {
	var container = document.querySelector('body');

	var remove_dialogue = (dialogue) => {
		container.removeChild(dialogue);
		controls.autoRotate = true;
		controls.enableRotate = true;
		focused_obj = "";

		let temp_camera_pos = new THREE.Vector3(
			camera.position.x,
			camera.position.y,
			camera.position.z
		)
		temp_camera_pos.normalize()
		gsap.fromTo(camera.position, { x: camera.position.x, y: camera.position.y, z: camera.position.z }
		, { x: temp_camera_pos.x * camera_radius, y: temp_camera_pos.y * camera_radius, z: temp_camera_pos.z * camera_radius, duration: zoom_out_duration })
		is_dialogue_open = false;
	};

	// Remove any existing dialogue boxes
	var existingDialogues = document.querySelectorAll('.dialog-box');
	for (var i = 0; i < existingDialogues.length; i++) {
		container.removeChild(existingDialogues[i]);
	}

	// We use this so we can t interact while dialogue is open
	is_dialogue_open = true;

	// Create the dialogue box element
	var dialogueBox = document.createElement('div');
	dialogueBox.className = 'dialog-box';
	dialogueBox.innerHTML = name;
	

	// Create the close button element
	var closeButton = document.createElement('span');
	closeButton.className = 'close-button';
	closeButton.innerHTML = 'x';

	// Add an event listener to the close button
	closeButton.addEventListener('click', function () {
		remove_dialogue(dialogueBox);
	});

	// Append the close button to the dialogue box
	dialogueBox.appendChild(closeButton);

	// Set the position of the dialogue box based on the mouse click
	dialogueBox.style.right = window.innerWidth - event.clientX  + 'px'; // Subtract boxWidth from clientX to position the box to the left
	dialogueBox.style.top = event.clientY + 'px';
	

	// Append the dialogue box to the container
	container.appendChild(dialogueBox);

	document.addEventListener('mousedown', function (e) {
		if (!dialogueBox.contains(e.target) && e.target !== closeButton) {
			try {
				remove_dialogue(dialogueBox);				
			}
			catch (error) {
				//gives an error but works so dont worry abt it
			}
		}
	});
}


//Update scene and camera sizes on resize
window.addEventListener('resize', () => {
	//update size
	sizes.width = window.innerWidth* 0.5;

	camera.useQuaternion = true;
	camera.aspect = sizes.width / sizes.heigth;
	camera.updateProjectionMatrix();
	renderer.setSize(sizes.width, sizes.heigth);
})


//checks if the canvas is visible - used to not have to animate the planet while its not visible
function isCanvasVisible() {
  const rect = canvas.getBoundingClientRect();
  const viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
  const viewWidth = Math.max(document.documentElement.clientWidth, window.innerWidth);
  
  const isVisible = (
    rect.bottom >= 0 &&
    rect.right >= 0 &&
    rect.top <= viewHeight &&
    rect.left <= viewWidth
  );
  
  return isVisible;
}


//raycaster (detect clicks(kys))
const pointer = new THREE.Vector2();
const raycaster = new THREE.Raycaster();


window.addEventListener('mousedown', event => {
	//calc pointer pos in device cords ✨magie✨
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(scene.children);

	if (is_dialogue_open == true) {
		return;
	}
	for (let i = 0; i < intersects.length; i++) {
		if (intersects[i].object.material.locations_index !== undefined) {
			let elem = locations[intersects[i].object.material.locations_index]
			focused_obj = elem[2];
			showDialogue(event, elem[2]);
			controls.autoRotate = false;
			controls.enableRotate = false;

			const targetPosition = new THREE.Vector3
			(intersects[i].object.position.x * zoom_in_radius_magnitude,
			intersects[i].object.position.y * zoom_in_radius_magnitude,
			intersects[i].object.position.z * zoom_in_radius_magnitude);
	
			gsap.fromTo(camera.position, { x: camera.position.x, y: camera.position.y, z: camera.position.z }
			, { x: targetPosition.x, y: targetPosition.y, z: targetPosition.z, duration: zoom_in_duration })
			break;
		}
		else if (intersects[i].object.type != "Grid" && intersects[i].object.type != "GridHelper"){
			break;
		}
	}
});

//render each frame (basically the main animation loop)
const loop = () => {
	if (isCanvasVisible()) {
		lightHolder.quaternion.copy(camera.quaternion);
		controls.update();
		renderer.render(scene, camera);
	}
	window.requestAnimationFrame(loop);
};

loop();


//gsap timeline - old dw abt it
//const tl = gsap.timeline({ defaults: { duration: 1 } });
//tl.fromTo(mesh.scale, {z:0, x:0, y:0}, {z:1,x:1,y:1})
//tl.fromTo('nav', {y: '-100%'}, {y:'100%'})
