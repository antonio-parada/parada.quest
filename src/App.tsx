import { useState, useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Physics, RigidBody } from '@react-three/rapier'
import { KeyboardControls, useKeyboardControls, Html, PerspectiveCamera, Text, Billboard, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import './App.css'

const GASLIGHT_RHETORIC = [
  "You're overreacting.", "I'm just being honest.", "You're too emotional.",
  "Stop playing the victim.", "It's your fault, really.", "I never said that.",
  "You're being irrational.", "Why are you so sensitive?"
];

const THERAPY_AFFIRMATIONS = [
  "I am holding space.", "Validating your experience.", "Checking my capacity.",
  "Setting a healthy boundary.", "Processing the trigger.", "Reparenting the signal.",
  "Honoring my needs.", "Regulating the nervous system."
];

const keyboardMap = [
  { name: "forward", keys: ["ArrowUp", "w", "W"] },
  { name: "backward", keys: ["ArrowDown", "s", "S"] },
  { name: "left", keys: ["ArrowLeft", "a", "A"] },
  { name: "right", keys: ["ArrowRight", "d", "D"] },
  { name: "jump", keys: ["Space"] },
  { name: "attack", keys: ["k", "K", "Enter"] },
];

function WorldNode({ position, label, color }: any) {
    return (
      <RigidBody type="fixed" position={position}>
        <mesh castShadow><boxGeometry args={[10, 15, 10]} /><meshStandardMaterial color="#0a0a0a" /></mesh>
        <mesh position={[0, 0, 5.1]}><boxGeometry args={[4, 6, 0.2]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} /></mesh>
        <Text position={[0, 9, 0]} fontSize={0.8} color={color}>{label}</Text>
      </RigidBody>
    );
}

function KarateMan({ onAttack, playerPosRef, kickRange, mobileInput }: any) {
  const bodyRef = useRef<any>(null);
  const groupRef = useRef<any>(null);
  const leftArm = useRef<any>(null);
  const rightArm = useRef<any>(null);
  const leftLeg = useRef<any>(null);
  const rightLeg = useRef<any>(null);
  const [, getKeys] = useKeyboardControls();
  const { camera } = useThree();
  const [isAttacking, setIsAttacking] = useState(false);

  useFrame((state) => {
    if (!bodyRef.current) return;
    const keys = getKeys();
    
    // 1. INPUT UNIFICATION (SMOOTHED)
    const moveX = (keys.right ? 1 : 0) - (keys.left ? 1 : 0) + mobileInput.current.x;
    const moveZ = (keys.backward ? 1 : 0) - (keys.forward ? 1 : 0) + mobileInput.current.y;
    const jumpInput = keys.jump || mobileInput.current.jump;
    const attackInput = keys.attack || mobileInput.current.attack;

    const pos = bodyRef.current.translation();
    const linvel = bodyRef.current.linvel();
    playerPosRef.current.set(pos.x, pos.y, pos.z);

    if (attackInput && !isAttacking) {
       setIsAttacking(true);
       onAttack(pos); 
       setTimeout(() => setIsAttacking(false), 250); 
    }

    // 2. CAMERA-RELATIVE DIRECTION
    const cameraRotation = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
    cameraRotation.x = 0; cameraRotation.z = 0;

    const moveDirection = new THREE.Vector3(moveX, 0, moveZ);
    if (moveDirection.lengthSq() > 0.01) {
      moveDirection.normalize().applyEuler(cameraRotation).multiplyScalar(12);
      const angle = Math.atan2(moveDirection.x, moveDirection.z);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, angle, 0.2);
    }
    
    bodyRef.current.setLinvel({ 
        x: THREE.MathUtils.lerp(linvel.x, moveDirection.x, 0.4), 
        y: linvel.y, 
        z: THREE.MathUtils.lerp(linvel.z, moveDirection.z, 0.4) 
    }, true);

    if (jumpInput && Math.abs(linvel.y) < 0.1 && pos.y < 1.5) {
       bodyRef.current.setLinvel({ x: linvel.x, y: 16, z: linvel.z }, true);
    }

    // 3. ANIMATION
    const t = state.clock.elapsedTime;
    const moving = moveDirection.lengthSq() > 0.1;
    if (moving) {
      leftArm.current.rotation.x = Math.sin(t * 15) * 0.8;
      rightArm.current.rotation.x = Math.sin(t * 15 + Math.PI) * 0.8;
      leftLeg.current.rotation.x = Math.sin(t * 15 + Math.PI) * 0.6;
      rightLeg.current.rotation.x = Math.sin(t * 15) * 0.6;
    } else {
      leftArm.current.rotation.x = THREE.MathUtils.lerp(leftArm.current.rotation.x, 0, 0.1);
      rightArm.current.rotation.x = THREE.MathUtils.lerp(rightArm.current.rotation.x, 0, 0.1);
      leftLeg.current.rotation.x = THREE.MathUtils.lerp(leftLeg.current.rotation.x, 0, 0.1);
      rightLeg.current.rotation.x = THREE.MathUtils.lerp(rightLeg.current.rotation.x, 0, 0.1);
    }
  });

  return (
    <RigidBody ref={bodyRef} position={[0, 2, 0]} colliders="cuboid" lockRotations mass={1} friction={2}>
      <group ref={groupRef}>
        <mesh position={[0, 0.3, 0]} castShadow><boxGeometry args={[0.7, 0.9, 0.5]} /><meshStandardMaterial color="#fff" /></mesh>
        <mesh position={[0, 0, 0]} castShadow><boxGeometry args={[0.75, 0.15, 0.55]} /><meshStandardMaterial color="#000" /></mesh>
        <group position={[0, 1, 0.05]}>
          <mesh castShadow><boxGeometry args={[0.58, 0.48, 0.58]} /><meshStandardMaterial color="#ff00ff" /></mesh>
          <mesh position={[0, -0.15, 0.02]} castShadow><boxGeometry args={[0.5, 0.4, 0.5]} /><meshStandardMaterial color="#fdd" /></mesh>
          <mesh position={[0.12, -0.1, 0.26]}><boxGeometry args={[0.07, 0.04, 0.05]} /><meshStandardMaterial color="#000" /></mesh>
          <mesh position={[-0.12, -0.1, 0.26]}><boxGeometry args={[0.07, 0.04, 0.05]} /><meshStandardMaterial color="#000" /></mesh>
          <mesh position={[0, -0.3, 0.1]}><boxGeometry args={[0.3, 0.1, 0.2]} /><meshStandardMaterial color="#fcc" /></mesh>
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
           </group>
        )}
      </group>
    </RigidBody>
  );
}

function EmotionalVessel({ data, creepRef, playerPosRef }: any) {
  const modelRef = useRef<any>(null);
  useFrame((state) => {
     if (!creepRef.current || !playerPosRef.current) return;
     const pos = creepRef.current.translation();
     const pPos = playerPosRef.current;
     const direction = new THREE.Vector3(pPos.x - pos.x, 0, pPos.z - pos.z);
     if (direction.lengthSq() > 4) { 
        direction.normalize().multiplyScalar(1.5);
        creepRef.current.setLinvel({ x: direction.x, y: 0, z: direction.z }, true);
        modelRef.current.rotation.y = Math.atan2(pPos.x - pos.x, pPos.z - pos.z);
     }
     modelRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 3) * 0.1;
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

function CameraRig({ playerPosRef, isMobile }: any) {
  const orbitRef = useRef<any>(null);
  const lookSmooth = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(() => {
    if (!playerPosRef.current || !orbitRef.current) return;
    const pPos = playerPosRef.current;
    
    // Smoothly track target center (waist high)
    lookSmooth.current.lerp(pPos.clone().add(new THREE.Vector3(0, 1.5, 0)), 0.1);
    orbitRef.current.target.copy(lookSmooth.current);
    orbitRef.current.update();
  });

  return (
    <OrbitControls 
        ref={orbitRef}
        enablePan={false} 
        enableZoom={true} 
        maxPolarAngle={Math.PI / 2.1} 
        minDistance={10}
        maxDistance={40}
        rotateSpeed={isMobile ? 0.5 : 1.0} // RE-TUNED SENSITIVITY
        enableDamping={true}
        dampingFactor={0.05}
        makeDefault 
    />
  );
}

function Scene({ mobileInput, setScore, isMobile }: any) {
  const [kickRange, setKickRange] = useState(1.0);
  const [affirmation, setAffirmation] = useState("Holding space.");
  const [shards, setShards] = useState(() => Array.from({length: 12}).map((_, i) => ({
    id: i, position: [(Math.random() - 0.5) * 300, 1.5, (Math.random() - 0.5) * 300] as [number, number, number]
  })));
  const vessels = useRef(Array.from({length: 20}).map((_, i) => ({
    id: i, position: [(Math.random() - 0.5) * 400, 2, (Math.random() - 0.5) * 400] as [number, number, number],
    message: GASLIGHT_RHETORIC[Math.floor(Math.random() * GASLIGHT_RHETORIC.length)],
  })));
  const creepRefs = useRef(new Map());
  const playerPosRef = useRef(new THREE.Vector3());

  const handleAttack = (playerPos: any) => {
    creepRefs.current.forEach((ref) => {
      if (ref) {
        const enemyPos = ref.translation();
        const dist = new THREE.Vector3().subVectors(enemyPos, playerPos).length();
        if (dist < kickRange + 3.0) {
          ref.applyImpulse(new THREE.Vector3().subVectors(enemyPos, playerPos).normalize().multiplyScalar(200).add(new THREE.Vector3(0, 80, 0)), true);
          setScore((s: number) => s + 1);
          setAffirmation(THERAPY_AFFIRMATIONS[Math.floor(Math.random() * THERAPY_AFFIRMATIONS.length)]);
        }
      }
    });
  };

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[100, 100, 50]} castShadow intensity={2} />
      <Physics gravity={[0, -45, 0]}>
        <KarateMan onAttack={handleAttack} playerPosRef={playerPosRef} kickRange={kickRange} mobileInput={mobileInput} />
        {vessels.current.map((v) => (
          <EmotionalVessel key={v.id} data={v} creepRef={(el: any) => el ? creepRefs.current.set(v.id, el) : creepRefs.current.delete(v.id)} playerPosRef={playerPosRef} />
        ))}
        {shards.map((s) => (
          <RigidBody key={s.id} type="fixed" position={s.position} sensor onIntersectionEnter={() => {
              setShards(prev => prev.filter(sh => sh.id !== s.id));
              setKickRange(prev => prev + 0.1); 
              setAffirmation("CAPACITY_RECLAIMED");
          }}>
            <mesh castShadow><octahedronGeometry args={[0.5]} /><meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={5} /></mesh>
          </RigidBody>
        ))}
        <WorldNode position={[50, 0, -50]} label="GASLIGHT_BANK" color="#ffd700" />
        <WorldNode position={[-60, 0, 40]} label="ALPHA_GYM" color="#ff0000" />
        <RigidBody type="fixed" position={[0, -1, 0]}>
          <mesh receiveShadow><boxGeometry args={[2000, 2, 2000]} /><meshStandardMaterial color="#050505" /></mesh>
          <gridHelper args={[2000, 400, "#ff00ff", "#111"]} position={[0, 1.01, 0]} />
        </RigidBody>
      </Physics>
      
      <CameraRig playerPosRef={playerPosRef} isMobile={isMobile} />

      <Html fullscreen zIndexRange={[100, 0]}>
         <div className="ui-overlay" style={{ pointerEvents: 'none' }}>
           <p style={{color: 'var(--pixels-green)', fontSize: '14px'}}>{affirmation.toUpperCase()}</p>
         </div>
      </Html>
    </>
  );
}

function App() {
  const [score, setScore] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const mobileInput = useRef({ x: 0, y: 0, jump: false, attack: false });
  const joystickRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    const prevent = (e: TouchEvent) => { if (e.touches.length > 1) e.preventDefault(); };
    document.addEventListener('touchstart', prevent, { passive: false });
    return () => document.removeEventListener('touchstart', prevent);
  }, []);

  const handleJoystick = (e: any) => {
      if (!joystickRef.current) return;
      const rect = joystickRef.current.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      const x = (clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const y = (clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      mobileInput.current.x = Math.max(-1, Math.min(1, x));
      mobileInput.current.y = Math.max(-1, Math.min(1, y));
  };

  const resetJoystick = () => { mobileInput.current.x = 0; mobileInput.current.y = 0; };

  return (
    <KeyboardControls map={keyboardMap}>
      <div className="quest-container">
        <Canvas shadows dpr={[1, 2]}>
          <PerspectiveCamera makeDefault position={[0, 8, 15]} fov={40} />
          <Scene mobileInput={mobileInput} setScore={setScore} isMobile={isMobile} />
        </Canvas>
        
        <div className="ui-header">
             <h1>PARADA.QUEST</h1>
             <div className="integration-bar"><div className="fill" style={{ width: `${Math.min(100, score * 5)}%` }}></div></div>
             <div className="score-text">EMOTIONAL_INTEGRATION: {score}</div>
        </div>

        <div className="mobile-interface">
            <div className="virtual-joystick" ref={joystickRef} onPointerMove={handleJoystick} onPointerUp={resetJoystick} onPointerLeave={resetJoystick} onTouchMove={handleJoystick} onTouchEnd={resetJoystick}>
                <div className="joystick-handle" style={{ transform: `translate(${mobileInput.current.x * 40}px, ${mobileInput.current.y * 40}px)` }}></div>
            </div>
            <div className="mobile-actions">
                <button onPointerDown={(e) => { e.stopPropagation(); mobileInput.current.jump = true; }} onPointerUp={(e) => { e.stopPropagation(); mobileInput.current.jump = false; }} className="mob-btn">REGULATE</button>
                <button onPointerDown={(e) => { e.stopPropagation(); mobileInput.current.attack = true; }} onPointerUp={(e) => { e.stopPropagation(); mobileInput.current.attack = false; }} className="mob-btn pink">HOLD_SPACE</button>
            </div>
        </div>
        <div className="crt-overlay"></div>
      </div>
    </KeyboardControls>
  )
}
export default App
