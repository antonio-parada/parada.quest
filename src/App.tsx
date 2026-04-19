import { useState, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Physics, RigidBody } from '@react-three/rapier'
import { KeyboardControls, useKeyboardControls, Html, OrbitControls, PerspectiveCamera, Text, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import './App.css'

const GASLIGHT_RHETORIC = [
  "You're overreacting.",
  "I'm just being honest.",
  "You're too emotional.",
  "Stop playing the victim.",
  "It's your fault, really.",
  "I never said that.",
  "You're being irrational.",
  "Why are you so sensitive?"
];

const THERAPY_AFFIRMATIONS = [
  "I am holding space.",
  "Validating your experience.",
  "Checking my capacity.",
  "Setting a healthy boundary.",
  "Processing the trigger.",
  "Reparenting the signal.",
  "Honoring my needs.",
  "Regulating the nervous system."
];

const keyboardMap = [
  { name: "forward", keys: ["ArrowUp", "w", "W"] },
  { name: "backward", keys: ["ArrowDown", "s", "S"] },
  { name: "left", keys: ["ArrowLeft", "a", "A"] },
  { name: "right", keys: ["ArrowRight", "d", "D"] },
  { name: "jump", keys: ["Space"] },
  { name: "attack", keys: ["k", "K", "Enter"] },
];

function KarateMan({ onAttack, playerPosRef, kickRange, mobileInput }: any) {
  const bodyRef = useRef<any>(null);
  const groupRef = useRef<any>(null);
  const leftArm = useRef<any>(null);
  const rightArm = useRef<any>(null);
  const leftLeg = useRef<any>(null);
  const rightLeg = useRef<any>(null);
  const [, getKeys] = useKeyboardControls();
  const [isAttacking, setIsAttacking] = useState(false);

  useFrame((state) => {
    if (!bodyRef.current) return;
    const keys = getKeys();
    const input = {
        forward: keys.forward || mobileInput.forward,
        backward: keys.backward || mobileInput.backward,
        left: keys.left || mobileInput.left,
        right: keys.right || mobileInput.right,
        jump: keys.jump || mobileInput.jump,
        attack: keys.attack || mobileInput.attack
    };

    const pos = bodyRef.current.translation();
    const linvel = bodyRef.current.linvel();
    playerPosRef.current.copy(pos);

    if (input.attack && !isAttacking) {
       setIsAttacking(true);
       onAttack(pos); 
       setTimeout(() => setIsAttacking(false), 250); 
    }

    const direction = new THREE.Vector3();
    if (input.forward) direction.z -= 1; if (input.backward) direction.z += 1;
    if (input.left) direction.x -= 1; if (input.right) direction.x += 1;

    const isMoving = direction.lengthSq() > 0;
    if (isMoving) {
      direction.normalize().multiplyScalar(10);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, Math.atan2(direction.x, direction.z), 0.2);
    }
    bodyRef.current.setLinvel({ x: direction.x, y: linvel.y, z: direction.z }, true);

    if (input.jump && Math.abs(linvel.y) < 0.1 && pos.y < 1.5) {
       bodyRef.current.setLinvel({ x: linvel.x, y: 14, z: linvel.z }, true);
    }

    const t = state.clock.elapsedTime;
    if (isMoving) {
      leftArm.current.rotation.x = Math.sin(t * 15) * 0.8;
      rightArm.current.rotation.x = Math.sin(t * 15 + Math.PI) * 0.8;
      leftLeg.current.rotation.x = Math.sin(t * 15 + Math.PI) * 0.6;
      rightLeg.current.rotation.x = Math.sin(t * 15) * 0.6;
    }
  });

  return (
    <RigidBody ref={bodyRef} position={[0, 2, 0]} colliders="cuboid" lockRotations mass={1}>
      <group ref={groupRef}>
        <mesh position={[0, 0.3, 0]} castShadow><boxGeometry args={[0.7, 0.9, 0.5]} /><meshStandardMaterial color="#fff" /></mesh>
        <mesh position={[0, 0, 0]} castShadow><boxGeometry args={[0.75, 0.15, 0.55]} /><meshStandardMaterial color="#000" /></mesh>
        <group position={[0, 1, 0.05]}>
          <mesh castShadow><boxGeometry args={[0.58, 0.48, 0.58]} /><meshStandardMaterial color="#ff00ff" /></mesh>
          <mesh position={[0, -0.15, 0.02]} castShadow><boxGeometry args={[0.5, 0.4, 0.5]} /><meshStandardMaterial color="#fdd" /></mesh>
          <mesh position={[0.12, -0.1, 0.26]}><boxGeometry args={[0.07, 0.04, 0.04]} /><meshStandardMaterial color="#000" /></mesh>
          <mesh position={[-0.12, -0.1, 0.26]}><boxGeometry args={[0.07, 0.04, 0.04]} /><meshStandardMaterial color="#000" /></mesh>
        </group>
        <group ref={leftArm} position={[0.45, 0.6, 0]}><mesh position={[0, -0.3, 0]} castShadow><boxGeometry args={[0.2, 0.6, 0.2]} /><meshStandardMaterial color="#fff" /></mesh></group>
        <group ref={rightArm} position={[-0.45, 0.6, 0]}><mesh position={[0, -0.3, 0]} castShadow><boxGeometry args={[0.2, 0.6, 0.2]} /><meshStandardMaterial color="#fff" /></mesh></group>
        <group ref={leftLeg} position={[0.2, -0.2, 0]}><mesh position={[0, -0.3, 0]} castShadow><boxGeometry args={[0.25, 0.6, 0.25]} /><meshStandardMaterial color="#fff" /></mesh></group>
        <group ref={rightLeg} position={[-0.2, -0.2, 0]}><mesh position={[0, -0.3, 0]} castShadow><boxGeometry args={[0.25, 0.6, 0.25]} /><meshStandardMaterial color="#fff" /></mesh></group>
        {isAttacking && (
           <group>
             <mesh position={[0, 0, (kickRange + 0.5) / 2]}>
               <boxGeometry args={[0.15, 0.15, kickRange]} />
               <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={20} transparent opacity={0.8} />
             </mesh>
             <mesh position={[0, 0, 0]} rotation={[Math.PI/2, 0, 0]}>
                <ringGeometry args={[0.5, kickRange, 32]} />
                <meshStandardMaterial color="#ff00ff" transparent opacity={0.2} />
             </mesh>
           </group>
        )}
      </group>
    </RigidBody>
  );
}

function EmotionalVessel({ data, creepRef, playerPosRef }: any) {
  const modelRef = useRef<any>(null);
  useFrame(() => {
     if (!creepRef.current || !playerPosRef.current) return;
     const pos = creepRef.current.translation();
     const pPos = playerPosRef.current;
     const direction = new THREE.Vector3(pPos.x - pos.x, 0, pPos.z - pos.z);
     if (direction.lengthSq() > 4) { 
        direction.normalize().multiplyScalar(1.5);
        creepRef.current.setLinvel({ x: direction.x, y: 0, z: direction.z }, true);
        modelRef.current.rotation.y = Math.atan2(pPos.x - pos.x, pPos.z - pos.z);
     }
  });
  return (
    <RigidBody ref={creepRef} position={data.position} colliders="cuboid" lockRotations mass={4}>
      <group ref={modelRef}>
        <mesh position={[0, 0.4, 0]} castShadow><boxGeometry args={[0.7, 1.2, 0.5]} /><meshStandardMaterial color="#111" /></mesh>
        <mesh position={[0, 1.1, 0]} castShadow><boxGeometry args={[0.5, 0.5, 0.5]} /><meshStandardMaterial color="#222" /></mesh>
        <Billboard position={[0, 2.2, 0]}><Text fontSize={0.2} color="#fff" maxWidth={2} textAlign="center">{data.message}</Text></Billboard>
      </group>
    </RigidBody>
  );
}

function Scene({ mobileInput }: any) {
  const [score, setScore] = useState(0);
  const [kickRange, setKickRange] = useState(1.0);
  const [affirmation, setAffirmation] = useState("Breathe.");
  const [shards, setShards] = useState(() => Array.from({length: 10}).map((_, i) => ({
    id: i, position: [(Math.random() - 0.5) * 100, 1.5, (Math.random() - 0.5) * 100] as [number, number, number]
  })));
  const vessels = useRef(Array.from({length: 15}).map((_, i) => ({
    id: i,
    position: [(Math.random() - 0.5) * 120, 2, (Math.random() - 0.5) * 120] as [number, number, number],
    message: GASLIGHT_RHETORIC[Math.floor(Math.random() * GASLIGHT_RHETORIC.length)],
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
          const impulse = new THREE.Vector3().subVectors(enemyPos, playerPos).normalize().multiplyScalar(150);
          impulse.y = 80; 
          ref.applyImpulse(impulse, true);
          setScore(s => s + 1);
          setAffirmation(THERAPY_AFFIRMATIONS[Math.floor(Math.random() * THERAPY_AFFIRMATIONS.length)]);
        }
      }
    });
  };
  useFrame((state) => {
    if (playerPosRef.current) {
      const pPos = playerPosRef.current;
      let focusTarget = pPos.clone();
      creepRefs.current.forEach((ref) => {
         const cPos = ref.translation();
         if (pPos.distanceTo(new THREE.Vector3(cPos.x, cPos.y, cPos.z)) < 15) focusTarget.lerp(new THREE.Vector3(cPos.x, cPos.y, cPos.z), 0.4);
      });
      camSmooth.current.lerp(pPos.clone().add(new THREE.Vector3(0, 15, 25)), 0.05);
      state.camera.position.copy(camSmooth.current);
      lookSmooth.current.lerp(focusTarget, 0.08);
      state.camera.lookAt(lookSmooth.current);
    }
  });
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[40, 60, 30]} castShadow intensity={2} />
      <Physics gravity={[0, -40, 0]}>
        <KarateMan onAttack={handleAttack} playerPosRef={playerPosRef} kickRange={kickRange} mobileInput={mobileInput} />
        {vessels.current.map((v) => (
          <EmotionalVessel key={v.id} data={v} creepRef={(el: any) => el ? creepRefs.current.set(v.id, el) : creepRefs.current.delete(v.id)} playerPosRef={playerPosRef} />
        ))}
        {shards.map((s) => (
          <RigidBody key={s.id} type="fixed" position={s.position} sensor onIntersectionEnter={() => {
              setShards(prev => prev.filter(sh => sh.id !== s.id));
              setKickRange(prev => prev + 0.15);
              setAffirmation("CAPACITY_EXPANDED");
          }}>
            <mesh castShadow><octahedronGeometry args={[0.4]} /><meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={5} /></mesh>
          </RigidBody>
        ))}
        <RigidBody type="fixed" position={[0, -1, 0]}>
          <mesh receiveShadow><boxGeometry args={[800, 2, 800]} /><meshStandardMaterial color="#050505" /></mesh>
          <gridHelper args={[800, 200, "#00ff00", "#111"]} position={[0, 1.01, 0]} />
        </RigidBody>
      </Physics>
      <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.2} makeDefault />
      <Html fullscreen zIndexRange={[100, 0]}>
         <div className="ui-overlay" style={{ pointerEvents: 'none' }}>
           <h1>PARADA.QUEST</h1>
           <p style={{color: 'var(--pixels-pink)'}}>PROTOCOL: AFFIRM_AND_VALIDATE</p>
           <p>EMOTIONAL_INTEGRATION: {score}</p>
           <p style={{color: 'var(--pixels-green)', fontSize: '12px'}}>{affirmation}</p>
         </div>
      </Html>
    </>
  );
}

function App() {
  const [mobileInput, setMobileInput] = useState({
      forward: false, backward: false, left: false, right: false, jump: false, attack: false
  });
  const updateInput = (key: string, value: boolean) => setMobileInput(prev => ({ ...prev, [key]: value }));
  return (
    <div className="quest-container">
      <KeyboardControls map={keyboardMap}>
        <Canvas shadows dpr={[1, 2]}>
          <PerspectiveCamera makeDefault position={[0, 30, 50]} fov={40} />
          <Scene mobileInput={mobileInput} />
        </Canvas>
      </KeyboardControls>
      <div className="mobile-controls">
          <div className="joystick-area">
              <button onTouchStart={() => updateInput('forward', true)} onTouchEnd={() => updateInput('forward', false)} className="joy-btn up">↑</button>
              <div className="joy-row">
                  <button onTouchStart={() => updateInput('left', true)} onTouchEnd={() => updateInput('left', false)} className="joy-btn left">←</button>
                  <button onTouchStart={() => updateInput('right', true)} onTouchEnd={() => updateInput('right', false)} className="joy-btn right">→</button>
              </div>
              <button onTouchStart={() => updateInput('backward', true)} onTouchEnd={() => updateInput('backward', false)} className="joy-btn down">↓</button>
          </div>
          <div className="action-area">
              <button onTouchStart={() => updateInput('jump', true)} onTouchEnd={() => updateInput('jump', false)} className="action-btn jump">REGULATE</button>
              <button onTouchStart={() => updateInput('attack', true)} onTouchEnd={() => updateInput('attack', false)} className="action-btn attack">HOLD_SPACE</button>
          </div>
      </div>
      <div className="crt-overlay"></div>
    </div>
  )
}
export default App
