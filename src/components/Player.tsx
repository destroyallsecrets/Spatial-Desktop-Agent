import { useRef, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import {
  RigidBody,
  CapsuleCollider,
  useRapier,
  RapierRigidBody,
} from "@react-three/rapier";
import * as THREE from "three";
import { usePlayerControls } from "../hooks/usePlayerControls";

const SPEED = {
  walk: 5,
  sprint: 9,
  crouch: 2.5,
  prone: 1.5,
};

const HEIGHTS = {
  stand: 1.6,
  crouch: 0.8,
  prone: 0.3,
};

export function Player({
  onLock,
  onUnlock,
}: {
  onLock: () => void;
  onUnlock: () => void;
}) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const { rapier, world } = useRapier();
  const { camera } = useThree();
  const controls = usePlayerControls();

  const [posture, setPosture] = useState<"stand" | "crouch" | "prone">("stand");

  // Toggle states
  useEffect(() => {
    if (controls.prone) {
      setPosture((p) => (p === "prone" ? "stand" : "prone"));
    } else if (controls.crouch) {
      setPosture((p) => (p === "crouch" ? "stand" : "crouch"));
    }
  }, [controls.crouch, controls.prone]);

  const direction = new THREE.Vector3();
  const frontVector = new THREE.Vector3();
  const sideVector = new THREE.Vector3();

  useFrame((state, delta) => {
    if (!rigidBodyRef.current) return;

    // Movement speeds
    const currentSpeed =
      posture === "prone"
        ? SPEED.prone
        : posture === "crouch"
          ? SPEED.crouch
          : controls.sprint
            ? SPEED.sprint
            : SPEED.walk;

    const velocity = rigidBodyRef.current.linvel();

    // calculate movement vectors based on camera's world direction
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3()
      .crossVectors(forward, new THREE.Vector3(0, 1, 0))
      .normalize();

    direction.set(0, 0, 0);
    if (controls.forward) direction.add(forward);
    if (controls.backward) direction.sub(forward);
    if (controls.right) direction.add(right);
    if (controls.left) direction.sub(right);

    direction.normalize().multiplyScalar(currentSpeed);

    // Provide snappy horizontal movement, retain vertical falling/jumping
    rigidBodyRef.current.setLinvel(
      { x: direction.x, y: velocity.y, z: direction.z },
      true,
    );

    // Jump logic - simple raycast to check if grounded
    const playerPos = rigidBodyRef.current.translation();

    // Note: To prevent multiple jumps, check ground contact.
    // We shoot a tiny ray downwards from the player origin.
    // Origin is at center, so cast dist is half height + small buffer.
    const currentHeightOffset =
      posture === "stand" ? 1.0 : posture === "crouch" ? 0.6 : 0.3; // Approx capsule half heights

    if (controls.jump && posture === "stand") {
      const ray = new rapier.Ray(
        { x: playerPos.x, y: playerPos.y, z: playerPos.z },
        { x: 0, y: -1, z: 0 },
      );
      const hit = world.castRay(ray, currentHeightOffset + 0.1, true);

      // We only allow jumping if very close to the ground
      if (hit && Math.abs(velocity.y) < 0.1) {
        rigidBodyRef.current.setLinvel(
          { x: velocity.x, y: 7, z: velocity.z },
          true,
        );
      }
    }

    // Vaulting/Parkour logic (simplified)
    // Raycast forward horizontally
    if (controls.forward && velocity.y < 2) {
      const forwardDir = new THREE.Vector3(0, 0, -1).applyEuler(
        new THREE.Euler(0, camera.rotation.y, 0),
      );
      const rayOrigin = {
        x: playerPos.x,
        y: playerPos.y + currentHeightOffset - 0.2,
        z: playerPos.z,
      };
      const ray = new rapier.Ray(rayOrigin, {
        x: forwardDir.x,
        y: forwardDir.y,
        z: forwardDir.z,
      });
      const hit = world.castRay(ray, 1.0, true);

      // If obstructed ahead but we are jumping or trying to run at it, lift player slightly up
      // In a real parkour script, you'd check a higher raycast to see if it clears to know it's a vaultable ledge.
      if (hit && controls.jump) {
        // Vault impulse
        rigidBodyRef.current.applyImpulse({ x: 0, y: 2.5, z: 0 }, true);
      }
    }

    // Camera height interpolation
    const targetHeight = HEIGHTS[posture];
    camera.position.y = THREE.MathUtils.lerp(
      camera.position.y,
      targetHeight,
      10 * delta,
    );

    // Leaning logic
    const targetLeanX = controls.leanLeft ? -0.5 : controls.leanRight ? 0.5 : 0;

    // We apply lean by adjusting local X position of the camera
    // but preserving the world position tracking of the rigid body + local offsets.
    // However, camera.position is driven by rigidBody + targetHeight for Y.
    // So we must set camera to rigidly follow player pos and then apply local offsets.

    // Re-anchor camera to rigid body first
    camera.position.x = playerPos.x;
    camera.position.z = playerPos.z;
    camera.position.y = THREE.MathUtils.lerp(
      camera.position.y,
      playerPos.y + targetHeight - currentHeightOffset,
      10 * delta,
    );

    // Then apply lean as a local shift
    const leanShift = new THREE.Vector3(targetLeanX, 0, 0).applyEuler(
      new THREE.Euler(0, camera.rotation.y, 0),
    );
    camera.position.add(leanShift);
  });

  return (
    <>
      <PointerLockControls onLock={onLock} onUnlock={onUnlock} />
      <RigidBody
        ref={rigidBodyRef}
        colliders={false}
        mass={1}
        type="dynamic"
        position={[0, HEIGHTS.stand, 0]}
        enabledRotations={[false, false, false]}
        canSleep={false}
      >
        <CapsuleCollider args={[0.5, 0.5]} />
      </RigidBody>
    </>
  );
}
