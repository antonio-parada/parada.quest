import { useState, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Physics, RigidBody } from '@react-three/rapier'
import { KeyboardControls, useKeyboardControls, Html } from '@react-three/drei'
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
  const [, getKeys] = useKeyboardControls();
  const speed = 7;
  const jumpStrength = 8;
  const [isAttacking, setIsAttacking] = useState(false);

  useFrame(({ camera }) => {
    if (!bodyRef.current) return;
    const { forward, backward, left, right, jump, attack } = getKeys();
    
    const pos = bodyRef.current.translation();
    const linvel = bodyRef.current.linvel();
    
    playerPosRef.current.copy(pos); // Share pos for creeps

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
    }
    
    bodyRef.current.setLinvel({ x: direction.x, y: linvel.y, z: direction.z }, true);

    // Jump
    if (jump && Math.abs(linvel.y) < 0.1 && pos.y < 1.5) {
       bodyRef.current.setLinvel({ x: linvel.x, y: jumpStrength, z: linvel.z }, true);
    }

    // Camera follow (isometric 3rd person)
    camera.position.lerp(new THREE.Vector3(pos.x, pos.y + 8, pos.z + 12), 0.1);
    camera.lookAt(pos.x, pos.y, pos.z);
  });

  return (
    <RigidBody ref={bodyRef} position={[0, 2, 0]} colliders="cuboid" lockRotations mass={1}>
      <group>
        {/* Body */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshStandardMaterial color="#fff" />
        </mesh>
        {/* Head - Pink Buzz Cut */}
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[0.6, 0.4, 0.6]} />
          <meshStandardMaterial color="#ff00ff" />
        </mesh>
        {/* Eyes */}
        <mesh position={[0.15, 0.6, 0.31]}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshStandardMaterial color="#000" />
        </mesh>
        <mesh position={[-0.15, 0.6, 0.31]}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshStandardMaterial color="#000" />
        </mesh>
        {/* Kicking Leg */}
        {isAttacking && (
           <mesh position={[0, -0.2, 0.6]}>
             <boxGeometry args={[0.3, 0.3, 0.8]} />
             <meshStandardMaterial color="#00ff00" />
           </mesh>
        )}
      </group>
    </RigidBody>
  );
}

function Creep({ data, creepRef, playerPosRef }: any) {
  useFrame(() => {
     if (!creepRef.current || !playerPosRef.current) return;
     const pos = creepRef.current.translation();
     const pPos = playerPosRef.current;
     
     // Move slowly towards player
     const direction = new THREE.Vector3(pPos.x - pos.x, 0, pPos.z - pos.z);
     if (direction.lengthSq() > 6) { 
        direction.normalize().multiplyScalar(1.5);
        const linvel = creepRef.current.linvel();
        // Allow physics to handle Y, only control X and Z
        creepRef.current.setLinvel({ x: direction.x, y: linvel.y, z: direction.z }, true);
     }
  });

  return (
    <RigidBody ref={creepRef} position={data.position} colliders="cuboid" lockRotations mass={2}>
      <mesh castShadow>
        <boxGeometry args={[0.8, 1.4, 0.8]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <Html position={[0, 1.5, 0]} center transform distanceFactor={15}>
         <div className="creep-dialogue">
           "{data.message}"
         </div>
      </Html>
    </RigidBody>
  );
}

function Scene() {
  const [creeps, setCreeps] = useState(() => Array.from({length: 12}).map((_, i) => ({
    id: i,
    position: [(Math.random() - 0.5) * 30, 2, (Math.random() - 0.5) * 30],
    message: CREEPY_LINES[Math.floor(Math.random() * CREEPY_LINES.length)],
  })));

  const creepRefs = useRef(new Map());
  const playerPosRef = useRef(new THREE.Vector3());
  const [score, setScore] = useState(0);

  const handleAttack = (playerPos: any) => {
    creepRefs.current.forEach((ref, id) => {
      if (ref) {
        const enemyPos = ref.translation();
        const dist = new THREE.Vector3().subVectors(enemyPos, playerPos).length();
        if (dist < 4) {
          // Massive dropkick impulse
          const impulse = new THREE.Vector3().subVectors(enemyPos, playerPos).normalize().multiplyScalar(40);
          impulse.y = 20; // Uppercut
          ref.applyImpulse(impulse, true);
          setScore(s => s + 1);
        }
      }
    });
  };

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} castShadow intensity={1} shadow-mapSize={[2048, 2048]} />
      
      <Physics>
        <KarateMan onAttack={handleAttack} playerPosRef={playerPosRef} />
        
        {creeps.map((c) => (
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

        {/* Floor */}
        <RigidBody type="fixed" colliders="cuboid" position={[0, -1, 0]}>
          <mesh receiveShadow>
            <boxGeometry args={[100, 2, 100]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
        </RigidBody>
        
        {/* Invisible Walls to keep them in arena */}
        <RigidBody type="fixed" position={[0, 5, -25]}>
          <boxGeometry args={[50, 10, 1]} />
          <meshStandardMaterial transparent opacity={0} />
        </RigidBody>
        <RigidBody type="fixed" position={[0, 5, 25]}>
          <boxGeometry args={[50, 10, 1]} />
          <meshStandardMaterial transparent opacity={0} />
        </RigidBody>
        <RigidBody type="fixed" position={[-25, 5, 0]}>
          <boxGeometry args={[1, 10, 50]} />
          <meshStandardMaterial transparent opacity={0} />
        </RigidBody>
        <RigidBody type="fixed" position={[25, 5, 0]}>
          <boxGeometry args={[1, 10, 50]} />
          <meshStandardMaterial transparent opacity={0} />
        </RigidBody>
      </Physics>

      <Html fullscreen zIndexRange={[100, 0]}>
         <div className="ui-overlay">
           <h1>PARADA.QUEST</h1>
           <p style={{color: 'var(--pixels-cyan)'}}>STATUS: EMULATION_ACTIVE</p>
           <p>TARGETS_NEUTRALIZED: {score}</p>
           <div className="controls">
             [WASD / ARROWS] MOVE<br/>
             [SPACE] JUMP<br/>
             [K / ENTER] DROPKICK
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
        <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
          <Scene />
        </Canvas>
      </KeyboardControls>
      <div className="crt-overlay"></div>
    </div>
  )
}

export default App