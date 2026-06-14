import { RigidBody } from "@react-three/rapier";
import { Grid } from "@react-three/drei";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function DataPillar({
  position,
  scale,
  color,
}: {
  position: [number, number, number];
  scale: [number, number, number];
  color: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Subtle hovering effect
      meshRef.current.position.y =
        position[1] +
        Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.2;
    }
  });

  return (
    <RigidBody type="fixed" colliders="cuboid" position={position}>
      <mesh ref={meshRef} castShadow receiveShadow>
        <boxGeometry args={scale} />
        <meshStandardMaterial
          color="#000000"
          emissive={color}
          emissiveIntensity={2.5}
          wireframe={true}
          transparent
          opacity={0.3}
          toneMapped={false}
        />
        {/* Core solid part so it blocks vision slightly */}
        <mesh>
          <boxGeometry
            args={[scale[0] * 0.98, scale[1] * 0.98, scale[2] * 0.98]}
          />
          <meshStandardMaterial color="#020813" />
        </mesh>
      </mesh>
    </RigidBody>
  );
}

export function WorldEnvironment() {
  return (
    <>
      <color attach="background" args={["#010409"]} />
      <fog attach="fog" args={["#010409", 5, 45]} />

      <ambientLight intensity={0.2} color="#4ade80" />
      <directionalLight
        position={[10, 20, 10]}
        intensity={0.5}
        color="#3b82f6"
      />
      <pointLight
        position={[0, 5, 0]}
        intensity={2.0}
        color="#10b981"
        distance={20}
      />

      {/* Ground Plane */}
      <RigidBody type="fixed" name="ground">
        <mesh receiveShadow position={[0, -0.5, 0]}>
          <boxGeometry args={[200, 1, 200]} />
          {/* Very dark almost black ground */}
          <meshStandardMaterial
            color="#010409"
            roughness={0.1}
            metalness={0.8}
          />
        </mesh>
      </RigidBody>

      {/* Cyber Grid */}
      <Grid
        position={[0, 0.01, 0]}
        args={[200, 200]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#10b981"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#3b82f6"
        fadeDistance={40}
        fadeStrength={1}
      />

      {/* Concentric rings in the sky (Dive gate aesthetic) */}
      <group position={[0, 20, -50]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
          <ringGeometry args={[20, 20.2, 64]} />
          <meshBasicMaterial
            color="#3b82f6"
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, 0, -5]}>
          <ringGeometry args={[15, 15.3, 64]} />
          <meshBasicMaterial
            color="#10b981"
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, 0, -10]}>
          <ringGeometry args={[10, 10.5, 64]} />
          <meshBasicMaterial
            color="#8b5cf6"
            transparent
            opacity={0.4}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Background Data Pillars */}
      <DataPillar position={[-15, 5, -20]} scale={[3, 15, 3]} color="#10b981" />
      <DataPillar position={[15, 8, -25]} scale={[4, 20, 4]} color="#3b82f6" />
      <DataPillar position={[-25, 4, -10]} scale={[2, 10, 2]} color="#8b5cf6" />
      <DataPillar position={[20, 3, -5]} scale={[2, 8, 2]} color="#10b981" />
      <DataPillar position={[-10, 6, 20]} scale={[3, 12, 3]} color="#3b82f6" />
      <DataPillar position={[12, 5, 15]} scale={[2, 10, 2]} color="#10b981" />
    </>
  );
}
