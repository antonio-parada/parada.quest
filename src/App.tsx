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
  const [, getKeys] = useKeyboardControls();
  const speed = 9;
  const jumpStrength = 12;
  const [isAttacking, setIsAttacking] = useState(false);

  useFrame(() => {
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

    if (direction.lengthSq() > 0) {
      direction.normalize().multiplyScalar(speed);
      const angle = Math.atan2(direction.x, direction.z);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, angle, 0.2);
    }
    
    bodyRef.current.setLinvel({ x: direction.x, y: linvel.y, z: direction.z }, true);

    if (jump && Math.abs(linvel.y) < 0.1 && pos.y < 1.5) {
       bodyRef.current.setLinvel({ x: linvel.x, y: jumpStrength, z: linvel.z }, true);
    }
  });

  return (
    <RigidBody ref={bodyRef} position={[0, 2, 0]} colliders="cuboid" lockRotations mass={1}>
      <group ref={groupRef}>
        {/* Karate Man: Disciplined Aesthetic */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.8, 1, 0.6]} />
          <meshStandardMaterial color="#fff" />
        </mesh>
        <mesh position={[0, -0.1, 0]} castShadow>
          <boxGeometry args={[0.85, 0.15, 0.65]} />
          <meshStandardMaterial color="#000" />
        </mesh>
        <mesh position={[0, 0.75, 0]} castShadow>
          <boxGeometry args={[0.6, 0.5, 0.6]} />
          <meshStandardMaterial color="#ff00ff" />
        </mesh>
        <mesh position={[0, 0.7, 0.05]} castShadow>
          <boxGeometry args={[0.55, 0.4, 0.55]} />
          <meshStandardMaterial color="#fdd" />
        </mesh>
        {/* Pink Purification Strike - Scaled by kickRange */}
        {isAttacking && (
           <mesh position={[0, -0.1, (kickRange + 0.5) / 2]}>
             <boxGeometry args={[0.5, 0.5, kickRange]} />
             <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={5} transparent opacity={0.8} />
           </mesh>
        )}
      </group>
    </RigidBody>
  );
}

function ToxicNoise({ data, creepRef, playerPosRef }: any) {
  const modelRef = useRef<any>(null);
  const innerGroupRef = useRef<any>(null);
  
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
        innerGroupRef.current.rotation.y = angle;
     }
     modelRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 3) * 0.1;
  });

  return (
    <RigidBody ref={creepRef} position={data.position} colliders="cuboid" lockRotations mass={data.type === 'CORPORATE' ? 3 : 5}>
      <group ref={innerGroupRef}>
        <group ref={modelRef}>
          {/* TOXIC CORPORATE ARCHETYPE */}
          <mesh position={[0, 0.4, 0]} castShadow>
            <boxGeometry args={[0.7, 1.2, 0.5]} />
            <meshStandardMaterial color={data.type === 'CORPORATE' ? "#1a1a1a" : "#444"} />
          </mesh>
          {/* Gold Bar Accessory (Greed) */}
          <mesh position={[0.4, 0.2, 0.3]} castShadow>
            <boxGeometry args={[0.2, 0.1, 0.4]} />
            <meshStandardMaterial color="#ffd700" metalness={1} />
          </mesh>
          <mesh position={[0, 1.1, 0]} castShadow>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshStandardMaterial color="#333" />
          </mesh>
          {/* Glowing Greed Eyes */}
          <mesh position={[0.12, 1.15, 0.26]}>
            <sphereGeometry args={[0.04]} />
            <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={2} />
          </mesh>
          <mesh position={[-0.12, 1.15, 0.26]}>
            <sphereGeometry args={[0.04]} />
            <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={2} />
          </mesh>
        </group>

        <Billboard position={[0, 2.5, 0]}>
          <Text
            fontSize={0.25}
            color="#fff"
            anchorX="center"
            anchorY="middle"
            maxWidth={3}
            textAlign="center"
          >
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
  const [kickRange, setKickRange] = useState(1.5);
  const [shards, setShards] = useState(() => Array.from({length: 5}).map((_, i) => ({
    id: i,
    position: [(Math.random() - 0.5) * 40, 1.5, (Math.random() - 0.5) * 40]
  })));
  
  const creeps = useRef(Array.from({length: 10}).map((_, i) => ({
    id: i,
    type: Math.random() > 0.5 ? 'CORPORATE' : 'GLUTTON',
    position: [(Math.random() - 0.5) * 60, 2, (Math.random() - 0.5) * 60],
    message: CREEPY_LINES[Math.floor(Math.random() * CREEPY_LINES.length)],
  })));

  const creepRefs = useRef(new Map());
  const playerPosRef = useRef(new THREE.Vector3());

  const handleAttack = (playerPos: any) => {
    creepRefs.current.forEach((ref) => {
      if (ref) {
        const enemyPos = ref.translation();
        const dist = new THREE.Vector3().subVectors(enemyPos, playerPos).length();
        // Attack range increases with power-ups
        if (dist < kickRange + 2) {
          const impulse = new THREE.Vector3().subVectors(enemyPos, playerPos).normalize().multiplyScalar(100);
          impulse.y = 50; 
          ref.applyImpulse(impulse, true);
          setScore(s => s + 1);
        }
      }
    });
  };

  const collectShard = (id: number) => {
    setShards(prev => prev.filter(s => s.id !== id));
    setKickRange(prev => prev + 1.5);
  };

  useFrame((state) => {
    if (playerPosRef.current) {
      const targetPos = playerPosRef.current;
      const cameraOffset = new THREE.Vector3(0, 12, 18);
      state.camera.position.lerp(targetPos.clone().add(cameraOffset), 0.08);
      state.camera.lookAt(targetPos);
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[20, 40, 10]} castShadow intensity={1.5} shadow-mapSize={[2048, 2048]} />
      <pointLight position={[0, 10, 0]} intensity={2} color="#ff00ff" />
      
      <Physics gravity={[0, -30, 0]}>
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

        {/* Big City Streets Floor */}
        <RigidBody type="fixed" colliders="cuboid" position={[0, -1, 0]}>
          <mesh receiveShadow>
            <boxGeometry args={[200, 2, 200]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          {/* Concrete & Vine Grid */}
          <gridHelper args={[200, 100, "#00ff00", "#111"]} position={[0, 1.01, 0]} />
        </RigidBody>

        {/* Brutalist "Walls" of Capital */}
        <RigidBody type="fixed" position={[0, 10, -50]}>
          <mesh><boxGeometry args={[100, 20, 5]} /><meshStandardMaterial color="#0a0a0a" /></mesh>
        </RigidBody>
        <RigidBody type="fixed" position={[0, 10, 50]}>
          <mesh><boxGeometry args={[100, 20, 5]} /><meshStandardMaterial color="#0a0a0a" /></mesh>
        </RigidBody>
      </Physics>

      <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.2} makeDefault />

      <Html fullscreen zIndexRange={[100, 0]}>
         <div className="ui-overlay">
           <h1>PARADA.QUEST</h1>
           <p style={{color: 'var(--pixels-pink)'}}>THE_UPLIFT_PROTOCOL // ACTIVE</p>
           <p>TOXIC_NOISE_PURGED: {score}</p>
           <p>KICK_EXTENSION: {((kickRange - 1.5) / 1.5).toFixed(1)}x</p>
           <div className="controls">
             [WASD] MOVE // [K] PURIFYING_KICK<br/>
             COLLECT [UPLIFT_SHARDS] TO EXTEND THE LIGHT
           </div>
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
          <PerspectiveCamera makeDefault position={[0, 20, 30]} fov={35} />
          <Scene />
        </Canvas>
      </KeyboardControls>
      <div className="crt-overlay"></div>
    </div>
  )
}

export default App
