const GRAVITY = -20;

function approach(current, target, maxDelta) {
  if (current < target) return Math.min(target, current + maxDelta);
  if (current > target) return Math.max(target, current - maxDelta);
  return target;
}

function wrapAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function approachAngle(current, target, maxDelta) {
  const delta = wrapAngle(target - current);
  if (Math.abs(delta) <= maxDelta) return wrapAngle(target);
  return wrapAngle(current + Math.sign(delta) * maxDelta);
}

function cloneState(state) {
  return {
    ...state,
    position: { ...state.position },
    velocity: { ...state.velocity },
    capsule: { ...state.capsule },
  };
}

export function createCharacterState({ position, maxSpeed, acceleration, braking, radius, height, heading = 0, turnRate = 8.5 }) {
  return {
    position: { x: position.x, y: position.y, z: position.z },
    velocity: { x: 0, y: 0, z: 0 },
    maxSpeed,
    acceleration,
    braking,
    capsule: { radius, height },
    grounded: true,
    heading: Number.isFinite(heading) ? heading : 0,
    turnRate: Number.isFinite(turnRate) ? turnRate : 8.5,
    locomotionState: 'idle',
  };
}

export function jumpCharacter(state, impulse) {
  if (!state.grounded) return state;
  const next = cloneState(state);
  next.velocity.y = impulse;
  next.grounded = false;
  next.locomotionState = 'airborne';
  return next;
}

export function stepCharacter(state, intent, dt, world, options = {}) {
  const next = cloneState(state);
  const safeDt = Number.isFinite(dt) && dt > 0 ? dt : 0;
  const wasGrounded = Boolean(next.grounded);
  const ix = Number(intent?.x) || 0;
  const iz = Number(intent?.z) || 0;
  const inputMagnitude = Math.hypot(ix, iz);
  const moving = inputMagnitude > 1e-6;
  const rate = moving ? next.acceleration : next.braking;
  next.velocity.x = approach(next.velocity.x, ix * next.maxSpeed, rate * safeDt);
  next.velocity.z = approach(next.velocity.z, iz * next.maxSpeed, rate * safeDt);

  if (moving) {
    const targetHeading = Math.atan2(ix, iz);
    const currentHeading = Number.isFinite(next.heading) ? next.heading : 0;
    const turnRate = Number.isFinite(next.turnRate) ? next.turnRate : 8.5;
    next.heading = approachAngle(currentHeading, targetHeading, turnRate * safeDt);
  } else if (!Number.isFinite(next.heading)) {
    next.heading = 0;
  }

  const floorBefore = world.groundHeightAt(next.position.x, next.position.z);
  if (next.grounded && next.position.y <= floorBefore + 1e-6) {
    next.position.y = floorBefore;
    next.velocity.y = 0;
  } else {
    next.velocity.y += GRAVITY * safeDt;
  }

  const desired = {
    x: next.position.x + next.velocity.x * safeDt,
    y: next.position.y + next.velocity.y * safeDt,
    z: next.position.z + next.velocity.z * safeDt,
  };
  const resolved = world.resolveCharacterMove(next.position, desired, next.capsule) || desired;
  next.position = { x: resolved.x, y: resolved.y, z: resolved.z };

  const floor = world.groundHeightAt(next.position.x, next.position.z);
  if (next.position.y <= floor) {
    next.position.y = floor;
    next.velocity.y = 0;
    next.grounded = true;
  } else {
    next.grounded = false;
  }

  const speed = Math.hypot(next.velocity.x, next.velocity.z);
  const landed = !wasGrounded && next.grounded;
  if (!next.grounded) next.locomotionState = 'airborne';
  else if (landed) next.locomotionState = 'landing';
  else if (options.crouching) next.locomotionState = 'crouch';
  else if (speed < 0.08) next.locomotionState = 'idle';
  else if (options.sprinting) next.locomotionState = 'sprint';
  else if (speed < next.maxSpeed * 0.45) next.locomotionState = 'walk';
  else next.locomotionState = 'run';
  return next;
}

export const LIBI_MOVEMENT_DEFAULTS = Object.freeze({
  maxSpeed: 4.6,
  acceleration: 16,
  braking: 22,
  radius: 0.32,
  height: 1.15,
});
