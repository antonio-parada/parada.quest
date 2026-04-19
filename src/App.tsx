import { useState, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Physics, RigidBody } from '@react-three/rapier'
import { KeyboardControls, useKeyboardControls, Html, OrbitControls, PerspectiveCamera, Text, Billboard, Float } from '@react-three/drei'
import * as THREE from 'three'
import './App.css'

const CREEPY_LINES = [
  "Maximize your ROI.",
  "It's just business, babe.",
  "Market disruption is key.",
  "You're underperforming.",
  "Smile for the shareholders.",
  "Leverage your assets.",
  "Why so emotional?",
  "I'm a high-value male."
];

const keyboardMap = [
  { name: "forward", keys: ["ArrowUp", "w", "W"] },
  { name: "backward", keys: ["ArrowDown", "s", "S"] },
  { name: "left", keys: ["ArrowLeft", "a", "A"] },
  { name: "right", keys: ["ArrowRight", "d", "D"] },
  { name: "jump", keys: ["Space"] },
  { name: "attack", keys: ["k", "K", "Enter"] },
];

function KarateMan({ onAttack, playerPosRef, kickRange }: any) {
  const bodyRef = useRef<any>(null);
  const groupRef = useRef<any>(null);
  const leftArm = useRef<any>(null);
  const rightArm = useRef<any>(null);
  const leftLeg = useRef<any>(null);
  const rightLeg = useRef<any>(null);
  
  const [, getKeys] = useKeyboardControls();
  const speed = 10;
  const jumpStrength = 13;
  const [isAttacking, setIsAttacking] = useState(false);

  useFrame((state) => {
    if (!bodyRef.current) return;
    const { forward, backward, left, right, jump, attack } = getKeys();
    const pos = bodyRef.current.translation();
    const linvel = bodyRef.current.linvel();
    playerPosRef.current.copy(pos);

    if (attack && !isAttacking) {
       setIsAttacking(true);
       onAttack(pos); 
       setTimeout(() => setIsAttacking(false), 250); 
    }

    const direction = new THREE.Vector3();
    if (forward) direction.z -= 1;
    if (backward) direction.z += 1;
    if (left) direction.x -= 1;
    if (right) direction.x += 1;

    const isMoving = direction.lengthSq() > 0;
    if (isMoving) {
      direction.normalize().multiplyScalar(speed);
      const angle = Math.atan2(direction.x, direction.z);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, angle, 0.2);
    }
    
    bodyRef.current.setLinvel({ x: direction.x, y: linvel.y, z: direction.z }, true);

    if (jump && Math.abs(linvel.y) < 0.1 && pos.y < 1.5) {
       bodyRef.current.setLinvel({ x: linvel.x, y: jumpStrength, z: linvel.z }, true);
    }

    const t = state.clock.elapsedTime;
    if (isMoving) {
      leftArm.current.rotation.x = Math.sin(t * 15) * 0.8;
      rightArm.current.rotation.x = Math.sin(t * 15 + Math.PI) * 0.8;
      leftLeg.current.rotation.x = Math.sin(t * 15 + Math.PI) * 0.6;
      rightLeg.current.rotation.x = Math.sin(t * 15) * 0.6;
      groupRef.current.position.y = Math.abs(Math.sin(t * 15)) * 0.1;
    } else {
      leftArm.current.rotation.x = THREE.MathUtils.lerp(leftArm.current.rotation.x, 0.2, 0.1);
      rightArm.current.rotation.x = THREE.MathUtils.lerp(rightArm.current.rotation.x, 0.2, 0.1);
      leftLeg.current.rotation.x = THREE.MathUtils.lerp(leftLeg.current.rotation.x, 0, 0.1);
      rightLeg.current.rotation.x = THREE.MathUtils.lerp(rightLeg.current.rotation.x, 0, 0.1);
      groupRef.current.position.y = Math.sin(t * 2) * 0.05;
    }

    if (Math.abs(linvel.y) > 1) {
       leftLeg.current.rotation.x = -0.5;
       rightLeg.current.rotation.x = 0.5;
       leftArm.current.rotation.z = 0.8;
       rightArm.current.rotation.z = -0.8;
    } else {
       leftArm.current.rotation.z = 0;
       rightArm.current.rotation.z = 0;
    }
  });

  return (
    <RigidBody ref={bodyRef} position={[0, 2, 0]} colliders="cuboid" lockRotations mass={1}>
      <group ref={groupRef}>
        <mesh position={[0, 0.3, 0]} castShadow>
          <boxGeometry args={[0.7, 0.9, 0.5]} />
          <meshStandardMaterial color="#fff" />
        </mesh>
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.75, 0.15, 0.55]} />
          <meshStandardMaterial color="#000" />
        </mesh>
        <group position={[0, 1, 0.05]}>
          <mesh castShadow>
            <boxGeometry args={[0.55, 0.45, 0.55]} />
            <meshStandardMaterial color="#ff00ff" />
          </mesh>
          <mesh position={[0, -0.1, 0.02]} castShadow>
            <boxGeometry args={[0.5, 0.3, 0.5]} />
            <meshStandardMaterial color="#fdd" />
          </mesh>
          <mesh position={[0.12, -0.05, 0.26]}>
             <boxGeometry args={[0.06, 0.06, 0.06]} />
             <meshStandardMaterial color="#000" />
          </mesh>
          <mesh position={[-0.12, -0.05, 0.26]}>
             <boxGeometry args={[0.06, 0.06, 0.06]} />
             <meshStandardMaterial color="#000" />
          </mesh>
        </group>
        <group ref={leftArm} position={[0.45, 0.6, 0]}>
          <mesh position={[0, -0.3, 0]} castShadow>
            <boxGeometry args={[0.2, 0.6, 0.2]} />
            <meshStandardMaterial color="#fff" />
          </mesh>
        </group>
        <group ref={rightArm} position={[-0.45, 0.6, 0]}>
          <mesh position={[0, -0.3, 0]} castShadow>
            <boxGeometry args={[0.2, 0.6, 0.2]} />
            <meshStandardMaterial color="#fff" />
          </mesh>
        </group>
        <group ref={leftLeg} position={[0.2, -0.2, 0]}>
          <mesh position={[0, -0.3, 0]} castShadow>
            <boxGeometry args={[0.25, 0.6, 0.25]} />
            <meshStandardMaterial color="#fff" />
          </mesh>
        </group>
        <group ref={rightLeg} position={[-0.2, -0.2, 0]}>
          <mesh position={[0, -0.3, 0]} castShadow>
            <boxGeometry args={[0.25, 0.6, 0.25]} />
            <meshStandardMaterial color="#fff" />
          </mesh>
        </group>
        {isAttacking && (
           <mesh position={[0, 0, (kickRange + 0.5) / 2]}>
             <boxGeometry args={[0.6, 0.6, kickRange]} />
             <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={10} transparent opacity={0.6} />
           </mesh>
        )}
      </group>
    </RigidBody>
  );
}

function ToxicNoise({ data, creepRef, playerPosRef }: any) {
  const modelRef = useRef<any>(null);
  
  useFrame((state) => {
     if (!creepRef.current || !playerPosRef.current) return;
     const pos = creepRef.current.translation();
     const pPos = playerPosRef.current;
     const direction = new THREE.Vector3(pPos.x - pos.x, 0, pPos.z - pos.z);
     if (direction.lengthSq() > 4) { 
        direction.normalize().multiplyScalar(data.type === 'CORPORATE' ? 3.0 : 1.8);
        const linvel = creepRef.current.linvel();
        creepRef.current.setLinvel({ x: direction.x, y: linvel.y, z: direction.z }, true);
        const angle = Math.atan2(pPos.x - pos.x, pPos.z - pos.z);
        modelRef.current.rotation.y = angle;
     }
     modelRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 3) * 0.1;
  });

  return (
    <RigidBody ref={creepRef} position={data.position} colliders="cuboid" lockRotations mass={data.type === 'CORPORATE' ? 3 : 5}>
      <group ref={modelRef}>
        <mesh position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[0.7, 1.2, 0.5]} />
          <meshStandardMaterial color={data.type === 'CORPORATE' ? "#111" : "#333"} />
        </mesh>
        <mesh position={[0.4, 0.2, 0.3]} castShadow>
          <boxGeometry args={[0.2, 0.1, 0.4]} />
          <meshStandardMaterial color="#ffd700" metalness={1} />
        </mesh>
        <mesh position={[0, 1.1, 0]} castShadow>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh position={[0.12, 1.15, 0.26]}>
          <sphereGeometry args={[0.04]} />
          <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={2} />
        </mesh>
        <mesh position={[-0.12, 1.15, 0.26]}>
          <sphereGeometry args={[0.04]} />
          <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={2} />
        </mesh>
        <Billboard position={[0, 2.5, 0]}>
          <Text fontSize={0.25} color="#fff" anchorX="center" anchorY="middle" maxWidth={3} textAlign="center">
            {data.message}
          </Text>
        </Billboard>
      </group>
    </RigidBody>
  );
}

function UpliftShard({ position, onCollect }: any) {
  return (
    <Float speed={5} rotationIntensity={2} floatIntensity={2}>
      <RigidBody type="fixed" position={position} sensor onIntersectionEnter={onCollect}>
        <mesh castShadow>
          <octahedronGeometry args={[0.5]} />
          <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={2} />
        </mesh>
        <Text position={[0, 1, 0]} fontSize={0.3} color="#00ff00">UPLIFT</Text>
      </RigidBody>
    </Float>
  );
}

function Scene() {
  const [score, setScore] = useState(0);
  const [kickRange, setKickRange] = useState(2);
  const [shards, setShards] = useState(() => Array.from({length: 5}).map((_, i) => ({
    id: i,
    position: [(Math.random() - 0.5) * 50, 1.5, (Math.random() - 0.5) * 50]
  })));
  const creeps = useRef(Array.from({length: 12}).map((_, i) => ({
    id: i,
    type: Math.random() > 0.5 ? 'CORPORATE' : 'GLUTTON',
    position: [(Math.random() - 0.5) * 80, 2, (Math.random() - 0.5) * 80],
    message: CREEPY_LINES[Math.floor(Math.random() * CREEPY_LINES.length)],
  })));
  const creepRefs = useRef(new Map());
  const playerPosRef = useRef(new THREE.Vector3());
  const camSmooth = useRef(new THREE.Vector3(0, 20, 30));
  const lookSmooth = useRef(new THREE.Vector3(0, 0, 0));

  const handleAttack = (playerPos: any) => {
    creepRefs.current.forEach((ref) => {
      if (ref) {
        const enemyPos = ref.translation();
        const dist = new THREE.Vector3().subVectors(enemyPos, playerPos).length();
        if (dist < kickRange + 2.5) {
          const impulse = new THREE.Vector3().subVectors(enemyPos, playerPos).normalize().multiplyScalar(120);
          impulse.y = 60; 
          ref.applyImpulse(impulse, true);
          setScore(s => s + 1);
        }
      }
    });
  };

  const collectShard = (id: number) => {
    setShards(prev => prev.filter(s => s.id !== id));
    setKickRange(prev => prev + 2);
  };

  useFrame((state) => {
    if (playerPosRef.current) {
      const targetPos = playerPosRef.current;
      const idealOffset = new THREE.Vector3(0, 14, 20);
      const idealTarget = targetPos.clone().add(idealOffset);
      camSmooth.current.lerp(idealTarget, 0.05);
      state.camera.position.copy(camSmooth.current);
      lookSmooth.current.lerp(targetPos, 0.1);
      state.camera.lookAt(lookSmooth.current);
      const currentVel = playerPosRef.current.distanceTo(lookSmooth.current) * 10;
      if ((state.camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
        (state.camera as THREE.PerspectiveCamera).fov = THREE.MathUtils.lerp((state.camera as THREE.PerspectiveCamera).fov, 40 + currentVel, 0.05);
        (state.camera as THREE.PerspectiveCamera).updateProjectionMatrix();
      }
    }
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[30, 50, 20]} castShadow intensity={2} shadow-mapSize={[4096, 4096]} />
      <pointLight position={[0, 15, 0]} intensity={3} color="#ff00ff" />
      <Physics gravity={[0, -35, 0]}>
        <KarateMan onAttack={handleAttack} playerPosRef={playerPosRef} kickRange={kickRange} />
        {creeps.current.map((c) => (
          <ToxicNoise 
            key={c.id} 
            data={c} 
            creepRef={(el: any) => {
              if (el) creepRefs.current.set(c.id, el);
              else creepRefs.current.delete(c.id);
            }} 
            playerPosRef={playerPosRef} 
          />
        ))}
        {shards.map((s) => (
          <UpliftShard key={s.id} position={s.position} onCollect={() => collectShard(s.id)} />
        ))}
        <RigidBody type="fixed" colliders="cuboid" position={[0, -1, 0]}>
          <mesh receiveShadow>
            <boxGeometry args={[300, 2, 300]} />
            <meshStandardMaterial color="#050505" />
          </mesh>
          <gridHelper args={[300, 150, "#00ff00", "#111"]} position={[0, 1.01, 0]} />
        </RigidBody>
      </Physics>
      <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.2} minDistance={10} maxDistance={50} makeDefault />
      <Html fullscreen zIndexRange={[100, 0]}>
         <div className="ui-overlay">
           <h1>PARADA.QUEST</h1>
           <p style={{color: 'var(--pixels-green)'}}>SYSTEM_ARCHITECT // UPLIFT_MODE</p>
           <p>NOISE_FILTERED: {score}</p>
           <p>RESONANCE_STRENGTH: {((kickRange - 2) / 2 + 1).toFixed(1)}x</p>
           <div className="controls">[WASD] NAVIGATE // [K] UPLIFT_KICK<br/>THE QUIET IS THE ONLY TRUTH.</div>
         </div>
      </Html>
    </>
  );
}

function App() {
  return (
    <div className="quest-container">
      <KeyboardControls map={keyboardMap}>
        <Canvas shadows dpr={[1, 2]}>
          <PerspectiveCamera makeDefault position={[0, 20, 30]} fov={40} />
          <Scene />
        </Canvas>
      </KeyboardControls>
      <div className="crt-overlay"></div>
    </div>
  )
}

export default App
