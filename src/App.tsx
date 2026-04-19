import { useState, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Physics, RigidBody } from '@react-three/rapier'
import { KeyboardControls, useKeyboardControls, Html, OrbitControls, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import './App.css'

const CREEPY_LINES = [
  "You should smile more.",
  "Where's your boyfriend?",
  "Nice aesthetic, babe.",
  "You're so exotic.",
  "Can I buy you a drink?",
  "Why so serious?",
  "Let me help you with that.",
  "You look tired."
];

const keyboardMap = [
  { name: "forward", keys: ["ArrowUp", "w", "W"] },
  { name: "backward", keys: ["ArrowDown", "s", "S"] },
  { name: "left", keys: ["ArrowLeft", "a", "A"] },
  { name: "right", keys: ["ArrowRight", "d", "D"] },
  { name: "jump", keys: ["Space"] },
  { name: "attack", keys: ["k", "K", "Enter"] },
];

function KarateMan({ onAttack, playerPosRef }: any) {
  const bodyRef = useRef<any>(null);
  const groupRef = useRef<any>(null);
  const [, getKeys] = useKeyboardControls();
  const speed = 8;
  const jumpStrength = 9;
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
       setTimeout(() => setIsAttacking(false), 200); 
    }

    const direction = new THREE.Vector3();
    if (forward) direction.z -= 1;
    if (backward) direction.z += 1;
    if (left) direction.x -= 1;
    if (right) direction.x += 1;

    if (direction.lengthSq() > 0) {
      direction.normalize().multiplyScalar(speed);
      const angle = Math.atan2(direction.x, direction.z);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, angle, 0.15);
    }
    
    bodyRef.current.setLinvel({ x: direction.x, y: linvel.y, z: direction.z }, true);

    if (jump && Math.abs(linvel.y) < 0.1 && pos.y < 1.5) {
       bodyRef.current.setLinvel({ x: linvel.x, y: jumpStrength, z: linvel.z }, true);
    }
  });

  return (
    <RigidBody ref={bodyRef} position={[0, 2, 0]} colliders="cuboid" lockRotations mass={1}>
      <group ref={groupRef}>
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
        <mesh position={[0.15, 0.75, 0.31]}>
          <boxGeometry args={[0.08, 0.08, 0.08]} />
          <meshStandardMaterial color="#000" />
        </mesh>
        <mesh position={[-0.15, 0.75, 0.31]}>
          <boxGeometry args={[0.08, 0.08, 0.08]} />
          <meshStandardMaterial color="#000" />
        </mesh>
        {isAttacking && (
           <mesh position={[0, -0.1, 0.7]}>
             <boxGeometry args={[0.4, 0.4, 1.2]} />
             <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={0.5} />
           </mesh>
        )}
      </group>
    </RigidBody>
  );
}

function Creep({ data, creepRef, playerPosRef }: any) {
  const modelRef = useRef<any>(null);
  
  useFrame((state) => {
     if (!creepRef.current || !playerPosRef.current) return;
     const pos = creepRef.current.translation();
     const pPos = playerPosRef.current;
     
     const direction = new THREE.Vector3(pPos.x - pos.x, 0, pPos.z - pos.z);
     if (direction.lengthSq() > 4) { 
        direction.normalize().multiplyScalar(1.8);
        const linvel = creepRef.current.linvel();
        creepRef.current.setLinvel({ x: direction.x, y: linvel.y, z: direction.z }, true);
        
        const angle = Math.atan2(pPos.x - pos.x, pPos.z - pos.z);
        modelRef.current.rotation.y = angle;
     }
     modelRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 4) * 0.05;
  });

  return (
    <RigidBody ref={creepRef} position={data.position} colliders="cuboid" lockRotations mass={2}>
      <group ref={modelRef}>
        <mesh position={[0, 0.1, 0]} castShadow>
          <boxGeometry args={[0.7, 1.2, 0.6]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        <mesh position={[0, 0.9, 0.1]} castShadow>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color="#555" />
        </mesh>
        <mesh position={[0, 1.15, 0.1]} castShadow>
          <boxGeometry args={[0.8, 0.1, 0.8]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <mesh position={[0, 1.25, 0.1]} castShadow>
          <boxGeometry args={[0.4, 0.2, 0.4]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      </group>
      <Html position={[0, 1.8, 0]} center transform distanceFactor={12}>
         <div className="creep-dialogue">
           "{data.message}"
         </div>
      </Html>
    </RigidBody>
  );
}

function Scene() {
  const creeps = useRef(Array.from({length: 15}).map((_, i) => ({
    id: i,
    position: [(Math.random() - 0.5) * 40, 2, (Math.random() - 0.5) * 40],
    message: CREEPY_LINES[Math.floor(Math.random() * CREEPY_LINES.length)],
  })));

  const creepRefs = useRef(new Map());
  const playerPosRef = useRef(new THREE.Vector3());
  const [score, setScore] = useState(0);

  const handleAttack = (playerPos: any) => {
    creepRefs.current.forEach((ref) => {
      if (ref) {
        const enemyPos = ref.translation();
        const dist = new THREE.Vector3().subVectors(enemyPos, playerPos).length();
        if (dist < 4.5) {
          const impulse = new THREE.Vector3().subVectors(enemyPos, playerPos).normalize().multiplyScalar(50);
          impulse.y = 25; 
          ref.applyImpulse(impulse, true);
          setScore(s => s + 1);
        }
      }
    });
  };

  useFrame((state) => {
    if (playerPosRef.current) {
      const targetPos = playerPosRef.current;
      const cameraOffset = new THREE.Vector3(0, 8, 12);
      state.camera.position.lerp(targetPos.clone().add(cameraOffset), 0.1);
      state.camera.lookAt(targetPos);
    }
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[15, 25, 10]} castShadow intensity={1.2} shadow-mapSize={[2048, 2048]} />
      <pointLight position={[-10, 10, -10]} intensity={0.5} color="#ff00ff" />
      
      <Physics gravity={[0, -20, 0]}>
        <KarateMan onAttack={handleAttack} playerPosRef={playerPosRef} />
        
        {creeps.current.map((c) => (
          <Creep 
            key={c.id} 
            data={c} 
            creepRef={(el: any) => {
              if (el) creepRefs.current.set(c.id, el);
              else creepRefs.current.delete(c.id);
            }} 
            playerPosRef={playerPosRef} 
          />
        ))}

        <RigidBody type="fixed" colliders="cuboid" position={[0, -1, 0]}>
          <mesh receiveShadow>
            <boxGeometry args={[100, 2, 100]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          <gridHelper args={[100, 50, "#333", "#222"]} position={[0, 1.01, 0]} />
        </RigidBody>
      </Physics>

      <OrbitControls 
        enablePan={false} 
        enableZoom={true} 
        maxPolarAngle={Math.PI / 2.1} 
        makeDefault 
      />

      <Html fullscreen zIndexRange={[100, 0]}>
         <div className="ui-overlay">
           <h1>PARADA.QUEST</h1>
           <p style={{color: 'var(--pixels-green)'}}>SYSTEM_STABLE // 3D_ACTIVE</p>
           <p>CREEPS_DEFEATED: {score}</p>
           <div className="controls">
             [WASD] MOVE<br/>
             [SPACE] JUMP<br/>
             [K] PINK_DROPKICK<br/>
             [MOUSE] ORBIT_CAMERA
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
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[0, 10, 15]} fov={50} />
          <Scene />
        </Canvas>
      </KeyboardControls>
      <div className="crt-overlay"></div>
    </div>
  )
}

export default App
