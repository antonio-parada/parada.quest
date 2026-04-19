import { useState, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Physics, RigidBody } from '@react-three/rapier'
import { KeyboardControls, useKeyboardControls, Html, OrbitControls, PerspectiveCamera, Text, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import './App.css'

const CREEPY_LINES = [
  "You should smile more.",
  "Where's your boyfriend?",
  "Nice aesthetic, babe.",
  "You're so exotic.",
  "Can I buy you a drink?",
  "Why so serious?",
  "I can make you famous.",
  "Just one photo?",
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
  const speed = 9;
  const jumpStrength = 11;
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
             <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={3} />
           </mesh>
        )}
      </group>
    </RigidBody>
  );
}

function Creep({ data, creepRef, playerPosRef }: any) {
  const modelRef = useRef<any>(null);
  const innerGroupRef = useRef<any>(null);
  
  useFrame((state) => {
     if (!creepRef.current || !playerPosRef.current) return;
     const pos = creepRef.current.translation();
     const pPos = playerPosRef.current;
     
     const direction = new THREE.Vector3(pPos.x - pos.x, 0, pPos.z - pos.z);
     if (direction.lengthSq() > 4) { 
        direction.normalize().multiplyScalar(data.type === 'GREED' ? 2.8 : 1.8);
        const linvel = creepRef.current.linvel();
        creepRef.current.setLinvel({ x: direction.x, y: linvel.y, z: direction.z }, true);
        const angle = Math.atan2(pPos.x - pos.x, pPos.z - pos.z);
        innerGroupRef.current.rotation.y = angle;
     }
     modelRef.current.rotation.z = Math.sin(state.clock.elapsedTime * (data.type === 'GLUTTONY' ? 2 : 4)) * 0.1;
  });

  return (
    <RigidBody 
      ref={creepRef} 
      position={data.position} 
      colliders="cuboid" 
      lockRotations 
      mass={data.type === 'GLUTTONY' ? 6 : 2}
    >
      <group ref={innerGroupRef}>
        <group ref={modelRef}>
          {data.type === 'GLUTTONY' ? (
            <>
              <mesh position={[0, 0, 0]} castShadow>
                <sphereGeometry args={[0.9, 12, 12]} />
                <meshStandardMaterial color="#222" />
              </mesh>
              <mesh position={[0, 0.5, 0]} castShadow>
                <sphereGeometry args={[0.7, 12, 12]} />
                <meshStandardMaterial color="#222" />
              </mesh>
              <mesh position={[0, 1, 0]} castShadow>
                <boxGeometry args={[0.4, 0.4, 0.4]} />
                <meshStandardMaterial color="#111" />
              </mesh>
              <mesh position={[0.1, 1.05, 0.21]}>
                <sphereGeometry args={[0.05]} />
                <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2} />
              </mesh>
              <mesh position={[-0.1, 1.05, 0.21]}>
                <sphereGeometry args={[0.05]} />
                <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2} />
              </mesh>
            </>
          ) : (
            <>
              <mesh position={[0, 0.5, 0]} castShadow>
                <boxGeometry args={[0.3, 1.8, 0.3]} />
                <meshStandardMaterial color="#ffd700" metalness={1} roughness={0.1} />
              </mesh>
              <mesh position={[0, 1.5, 0]} castShadow>
                <sphereGeometry args={[0.35, 8, 8]} />
                <meshStandardMaterial color="#8b4513" />
              </mesh>
              <mesh position={[0, 1.5, 0.31]}>
                <boxGeometry args={[0.1, 0.3, 0.05]} />
                <meshStandardMaterial color="#ffd700" emissive="#ffd700" />
              </mesh>
              <mesh position={[0.4, 1.2, 0]} rotation={[0, 0, 0.5]}>
                <boxGeometry args={[0.1, 1, 0.1]} />
                <meshStandardMaterial color="#ffd700" />
              </mesh>
              <mesh position={[-0.4, 1.2, 0]} rotation={[0, 0, -0.5]}>
                <boxGeometry args={[0.1, 1, 0.1]} />
                <meshStandardMaterial color="#ffd700" />
              </mesh>
            </>
          )}
        </group>

        {/* 3D Billboarding Text - 100% Anchored */}
        <Billboard position={[0, 2.5, 0]}>
          {/* Background Plane for the "Box" look */}
          <mesh position={[0, 0, -0.1]}>
            <planeGeometry args={[4, 1.2]} />
            <meshStandardMaterial color="#000" transparent opacity={0.8} />
          </mesh>
          <Text
            fontSize={0.25}
            color={data.type === 'GREED' ? '#ffd700' : '#ff0055'}
            anchorX="center"
            anchorY="middle"
            maxWidth={3.5}
            textAlign="center"
          >
            {data.type === 'GREED' ? '$ $ $' : 'FAT_VOID'}\n"{data.message}"
          </Text>
        </Billboard>
      </group>
    </RigidBody>
  );
}

function Scene() {
  const creeps = useRef(Array.from({length: 12}).map((_, i) => ({
    id: i,
    type: Math.random() > 0.5 ? 'GREED' : 'GLUTTONY',
    position: [(Math.random() - 0.5) * 60, 2, (Math.random() - 0.5) * 60],
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
        if (dist < 5.0) {
          const impulse = new THREE.Vector3().subVectors(enemyPos, playerPos).normalize().multiplyScalar(90);
          impulse.y = 50; 
          ref.applyImpulse(impulse, true);
          setScore(s => s + 1);
        }
      }
    });
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
      <ambientLight intensity={0.4} />
      <directionalLight position={[20, 30, 10]} castShadow intensity={1.5} shadow-mapSize={[2048, 2048]} />
      <pointLight position={[0, 10, 0]} intensity={2} color="#ff00ff" />
      
      <Physics gravity={[0, -25, 0]}>
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
            <boxGeometry args={[150, 2, 150]} />
            <meshStandardMaterial color="#050505" />
          </mesh>
          <gridHelper args={[150, 75, "#151515", "#0a0a0a"]} position={[0, 1.01, 0]} />
        </RigidBody>
      </Physics>

      <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.2} makeDefault />

      <Html fullscreen zIndexRange={[100, 0]}>
         <div className="ui-overlay">
           <h1>PARADA.QUEST</h1>
           <p style={{color: 'var(--pixels-green)'}}>NODE_ESTABLISHED // FILTER_ACTIVE</p>
           <p>NOISE_FILTERED: {score}</p>
           <div className="controls">
             [WASD] MOVE // [SPACE] JUMP<br/>
             [K] PURGE_SIGNAL<br/>
             [MOUSE] ORBIT_SCAN
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
          <PerspectiveCamera makeDefault position={[0, 15, 25]} fov={40} />
          <Scene />
        </Canvas>
      </KeyboardControls>
      <div className="crt-overlay"></div>
    </div>
  )
}

export default App
