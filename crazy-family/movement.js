const GRAVITY = -20;

function approach(current, target, maxDelta) {
  if (current < target) return Math.min(target, current + maxDelta);
  if (current > target) return Math.max(target, current - maxDelta);
  return target;
}

function cloneState(state) {
  return {
    ...state,
    position: { ...state.position },
    velocity: { ...state.velocity },
    capsule: { ...state.capsule },
  };
}

export function createCharacterState({ position, maxSpeed, acceleration, braking, radius, height }) {
  return {
    position: { x: position.x, y: position.y, z: position.z },
    velocity: { x: 0, y: 0, z: 0 },
    maxSpeed,
    acceleration,
    braking,
    capsule: { radius, height },
    grounded: true,
  };
}

export function jumpCharacter(state, impulse) {
  if (!state.grounded) return state;
  const next = cloneState(state);
  next.velocity.y = impulse;
  next.grounded = false;
  return next;
}

export function stepCharacter(state, intent, dt, world) {
  const next = cloneState(state);
  const ix = Number(intent?.x) || 0;
  const iz = Number(intent?.z) || 0;
  const moving = Math.hypot(ix, iz) > 1e-6;
  const rate = moving ? next.acceleration : next.braking;
  next.velocity.x = approach(next.velocity.x, ix * next.maxSpeed, rate * dt);
  next.velocity.z = approach(next.velocity.z, iz * next.maxSpeed, rate * dt);

  const floorBefore = world.groundHeightAt(next.position.x, next.position.z);
  if (next.grounded && next.position.y <= floorBefore + 1e-6) {
    next.position.y = floorBefore;
    next.velocity.y = 0;
  } else {
    next.velocity.y += GRAVITY * dt;
  }

  const desired = {
    x: next.position.x + next.velocity.x * dt,
    y: next.position.y + next.velocity.y * dt,
    z: next.position.z + next.velocity.z * dt,
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
  return next;
}

export const LIBI_MOVEMENT_DEFAULTS = Object.freeze({
  maxSpeed: 4.6,
  acceleration: 16,
  braking: 22,
  radius: 0.32,
  height: 1.15,
});
