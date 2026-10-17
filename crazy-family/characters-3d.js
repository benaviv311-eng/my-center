import * as THREE from 'three';
import { getCharacter3DCanon } from './character-3d-canon.js';

function material(color, roughness = 0.78) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
}

function mesh(geometry, mat, name) {
  const node = new THREE.Mesh(geometry, mat);
  node.name = name;
  node.castShadow = true;
  node.receiveShadow = true;
  return node;
}

function addPart(parent, child) {
  parent.add(child);
  return child;
}

function buildLibi(root, canon, mats, parts) {
  const torso = new THREE.Group(); torso.name = 'torso'; torso.position.y = 0.70; root.add(torso); parts.torso = torso;
  addPart(torso, mesh(new THREE.BoxGeometry(0.34, 0.38, 0.20), mats.top, 'libi-top'));
  const bib = mesh(new THREE.BoxGeometry(0.25, 0.24, 0.215), mats.overalls, 'libi-overalls-bib'); bib.position.y = -0.05; torso.add(bib);

  const head = new THREE.Group(); head.name = 'head'; head.position.y = 1.02; root.add(head); parts.head = head;
  addPart(head, mesh(new THREE.SphereGeometry(canon.headRadius, 18, 14), mats.skin, 'libi-head'));
  const hair = mesh(new THREE.SphereGeometry(canon.headRadius * 1.03, 18, 14), mats.hair, 'libi-hair'); hair.position.y = 0.045; hair.scale.set(1.02, 0.78, 1.02); head.add(hair);
  for (const side of [-1, 1]) {
    const pig = mesh(new THREE.SphereGeometry(0.085, 14, 10), mats.hair, `libi-pigtail-${side < 0 ? 'left' : 'right'}`);
    pig.position.set(side * 0.17, 0.015, 0); head.add(pig);
  }
  const flower = mesh(new THREE.SphereGeometry(0.035, 12, 8), mats.flower, 'libi-flower'); flower.position.set(0.16, 0.10, 0.11); head.add(flower);

  parts.arms = []; parts.legs = [];
  for (const side of [-1, 1]) {
    const arm = new THREE.Group(); arm.name = `arm-${side < 0 ? 'left' : 'right'}`; arm.position.set(side * 0.22, 0.82, 0); root.add(arm); parts.arms.push(arm);
    const armMesh = mesh(new THREE.CylinderGeometry(canon.limbRadius, canon.limbRadius, 0.34, 12), mats.skin, `${arm.name}-mesh`); armMesh.position.y = -0.17; arm.add(armMesh);

    const leg = new THREE.Group(); leg.name = `leg-${side < 0 ? 'left' : 'right'}`; leg.position.set(side * 0.10, 0.52, 0); root.add(leg); parts.legs.push(leg);
    const pants = mesh(new THREE.CylinderGeometry(0.067, 0.06, 0.35, 12), mats.overalls, `${leg.name}-overalls`); pants.position.y = -0.17; leg.add(pants);
    const sock = mesh(new THREE.CylinderGeometry(0.058, 0.052, 0.18, 12), mats.socksLight, `${leg.name}-striped-sock`); sock.position.y = -0.42; leg.add(sock);
    for (const y of [-0.36, -0.43, -0.50]) {
      const stripe = mesh(new THREE.CylinderGeometry(0.059, 0.054, 0.026, 12), mats.socksDark, `${leg.name}-sock-stripe`); stripe.position.y = y; leg.add(stripe);
    }
    const shoe = mesh(new THREE.BoxGeometry(0.14, 0.08, 0.24), mats.shoes, `${leg.name}-shoe`); shoe.position.set(0, -0.55, -0.04); leg.add(shoe);
  }
}

function buildDad(root, canon, mats, parts) {
  const torso = new THREE.Group(); torso.name = 'torso'; torso.position.y = 1.03; root.add(torso); parts.torso = torso;
  addPart(torso, mesh(new THREE.BoxGeometry(0.56, 0.62, 0.29), mats.overshirt, 'dad-overshirt'));
  const undershirt = mesh(new THREE.BoxGeometry(0.30, 0.50, 0.305), mats.undershirt, 'dad-undershirt'); undershirt.position.z = 0.015; torso.add(undershirt);

  const head = new THREE.Group(); head.name = 'head'; head.position.y = 1.54; root.add(head); parts.head = head;
  addPart(head, mesh(new THREE.SphereGeometry(canon.headRadius, 20, 16), mats.skin, 'dad-head'));
  const hair = mesh(new THREE.SphereGeometry(canon.headRadius * 1.04, 18, 14), mats.hair, 'dad-hair'); hair.position.y = 0.07; hair.scale.set(1.03, 0.70, 1.02); head.add(hair);
  const stubble = mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.10, 18), mats.stubble, 'dad-stubble'); stubble.rotation.x = Math.PI / 2; stubble.position.set(0, -0.075, -0.155); head.add(stubble);

  parts.arms = []; parts.legs = [];
  for (const side of [-1, 1]) {
    const arm = new THREE.Group(); arm.name = `arm-${side < 0 ? 'left' : 'right'}`; arm.position.set(side * 0.35, 1.20, 0); root.add(arm); parts.arms.push(arm);
    const armMesh = mesh(new THREE.CylinderGeometry(canon.limbRadius, canon.limbRadius * 0.92, 0.50, 12), mats.skin, `${arm.name}-mesh`); armMesh.position.y = -0.25; arm.add(armMesh);

    const leg = new THREE.Group(); leg.name = `leg-${side < 0 ? 'left' : 'right'}`; leg.position.set(side * 0.16, 0.72, 0); root.add(leg); parts.legs.push(leg);
    const pants = mesh(new THREE.CylinderGeometry(0.10, 0.085, 0.58, 12), mats.pants, `${leg.name}-pajama-pants`); pants.position.y = -0.28; leg.add(pants);
    const slipper = mesh(new THREE.BoxGeometry(0.20, 0.09, 0.32), mats.slippers, `${leg.name}-slipper`); slipper.position.set(0, -0.60, -0.055); leg.add(slipper);
  }
}

function normalizeAngle(angle) {
  let value = angle;
  while (value > Math.PI) value -= Math.PI * 2;
  while (value < -Math.PI) value += Math.PI * 2;
  return value;
}

export function createCharacter3D({ scene, kind }) {
  const canon = getCharacter3DCanon(kind);
  const root = new THREE.Group();
  root.name = `${kind}-character-3d`;
  root.userData.semanticId = root.name;
  root.userData.renderMode = 'volumetric-3d';
  root.userData.canonKind = kind;
  root.userData.height = canon.height;

  const colors = canon.colors;
  const mats = Object.fromEntries(Object.entries(colors).map(([key, color]) => [key, material(color)]));
  const parts = { arms: [], legs: [] };
  if (kind === 'libi') buildLibi(root, canon, mats, parts);
  else buildDad(root, canon, mats, parts);
  scene.add(root);

  const torsoBaseY = parts.torso?.position.y ?? 0;
  let state = 'idle';
  let speed = 0;
  let grounded = true;
  let lastHeading = 0;
  let targetHeading = 0;

  function setTransform({ position, heading, state: nextState = state, speed: nextSpeed = speed, grounded: nextGrounded = grounded }) {
    root.position.set(position.x, position.y, position.z);
    if (Number.isFinite(heading)) {
      lastHeading = heading;
      targetHeading = heading;
    }
    if (!Number.isFinite(root.rotation.y)) root.rotation.y = lastHeading;
    state = nextState;
    speed = Number.isFinite(nextSpeed) ? nextSpeed : 0;
    grounded = Boolean(nextGrounded);
    root.userData.state = state;
  }

  function update(dt = 0, now = 0) {
    const safeDt = Math.max(0, Number(dt) || 0);
    const delta = normalizeAngle(targetHeading - root.rotation.y);
    const turn = Math.min(Math.abs(delta), (kind === 'dad' ? 5.5 : 8.5) * safeDt);
    root.rotation.y = normalizeAngle(root.rotation.y + Math.sign(delta || 0) * turn);

    const moving = speed > 0.05 && grounded;
    const phase = (Number(now) || 0) * (state === 'sprint' ? 0.016 : kind === 'dad' ? 0.008 : 0.011);
    const stride = moving ? Math.min(0.72, 0.18 + speed * 0.10) : 0;
    parts.arms.forEach((arm, index) => { arm.rotation.x = Math.sin(phase + index * Math.PI) * stride; });
    parts.legs.forEach((leg, index) => { leg.rotation.x = Math.sin(phase + (index + 1) * Math.PI) * stride; });
    if (parts.torso) {
      parts.torso.rotation.z = state === 'sing' ? Math.sin((Number(now) || 0) * 0.006) * 0.08 : 0;
      parts.torso.scale.y = state === 'crouch' ? 0.76 : state === 'pant' ? 0.94 + Math.sin((Number(now) || 0) * 0.012) * 0.05 : 1;
      parts.torso.position.y = torsoBaseY + (state === 'landing' ? -0.01 : 0);
    }
    if (parts.head) {
      parts.head.rotation.x = state === 'yawn' ? -0.16 : state === 'sneeze' ? 0.24 : 0;
      parts.head.rotation.z = state === 'sing' ? Math.sin((Number(now) || 0) * 0.005) * 0.05 : 0;
    }
    root.userData.grounded = grounded;
  }

  return {
    root,
    setTransform,
    update,
    setVisible(value) { root.visible = Boolean(value); },
    dispose() {
      scene.remove(root);
      root.traverse((node) => node.geometry?.dispose?.());
      Object.values(mats).forEach((mat) => mat.dispose());
    },
  };
}
