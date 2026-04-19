import { useState, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Physics, RigidBody } from '@react-three/rapier'
import { KeyboardControls, useKeyboardControls, Html, PerspectiveCamera, Text, Billboard, PointerLockControls, OrbitControls } from '@react-three/drei'
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
  const [isAttacking, setIsAttacking] = useState(false);

  useFrame((state) => {
    if (!bodyRef.current) return;
    const keys = getKeys();
    const input = {
        forward: keys.forward || mobileInput.current.forward,
        backward: keys.backward || mobileInput.current.backward,
        left: keys.left || mobileInput.current.left,
        right: keys.right || mobileInput.current.right,
        jump: keys.jump || mobileInput.current.jump,
        attack: keys.attack || mobileInput.current.attack
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
    const frontVector = new THREE.Vector3(0, 0, (input.backward ? 1 : 0) - (input.forward ? 1 : 0));
    const sideVector = new THREE.Vector3((input.left ? 1 : 0) - (input.right ? 1 : 0), 0, 0);

    const cameraRotation = new THREE.Euler().setFromQuaternion(state.camera.quaternion, 'YXZ');
    cameraRotation.x = 0; cameraRotation.z = 0;

    direction.subVectors(frontVector, sideVector).normalize().multiplyScalar(12).applyEuler(cameraRotation);

    const isMoving = input.forward || input.backward || input.left || input.right;
    if (isMoving) {
      const angle = Math.atan2(direction.x, direction.z);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, angle, 0.2);
    }
    
    const targetVelX = isMoving ? direction.x : 0;
    const targetVelZ = isMoving ? direction.z : 0;
    bodyRef.current.setLinvel({ 
        x: THREE.MathUtils.lerp(linvel.x, targetVelX, 0.3), 
        y: linvel.y, 
        z: THREE.MathUtils.lerp(linvel.z, targetVelZ, 0.3) 
    }, true);

    if (input.jump && Math.abs(linvel.y) < 0.1 && pos.y < 1.5) {
       bodyRef.current.setLinvel({ x: linvel.x, y: 15, z: linvel.z }, true);
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
    <RigidBody ref={bodyRef} position={[0, 2, 0]} colliders="cuboid" lockRotations mass={1} friction={2}>
      <group ref={groupRef}>
        <mesh position={[0, 0.3, 0]} castShadow><boxGeometry args={[0.7, 0.9, 0.5]} /><meshStandardMaterial color="#fff" /></mesh>
        <mesh position={[0, 0, 0]} castShadow><boxGeometry args={[0.75, 0.15, 0.55]} /><meshStandardMaterial color="#000" /></mesh>
        <group position={[0, 1, 0.05]}>
          <mesh castShadow><boxGeometry args={[0.58, 0.48, 0.58]} /><meshStandardMaterial color="#ff00ff" /></mesh>
          <mesh position={[0, -0.15, 0.02]} castShadow><boxGeometry args={[0.5, 0.4, 0.5]} /><meshStandardMaterial color="#fdd" /></mesh>
          <mesh position={[0.12, -0.1, 0.26]}><boxGeometry args={[0.08, 0.04, 0.05]} /><meshStandardMaterial color="#000" /></mesh>
          <mesh position={[-0.12, -0.1, 0.26]}><boxGeometry args={[0.08, 0.04, 0.05]} /><meshStandardMaterial color="#000" /></mesh>
          <mesh position={[0.12, -0.04, 0.27]} rotation={[0, 0, 0.1]}><boxGeometry args={[0.12, 0.02, 0.02]} /><meshStandardMaterial color="#000" /></mesh>
          <mesh position={[-0.12, -0.04, 0.27]} rotation={[0, 0, -0.1]}><boxGeometry args={[0.12, 0.02, 0.02]} /><meshStandardMaterial color="#000" /></mesh>
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
        <Billboard position={[0, 2.2, 0]}>
            <Text fontSize={0.2} color="#fff" maxWidth={2} textAlign="center">{data.message}</Text>
        </Billboard>
      </group>
    </RigidBody>
  );
}

function Scene({ mobileInput, setProtocol, setScore, isMobile }: any) {
  const [kickRange, setKickRange] = useState(1.0);
  const [affirmation, setAffirmation] = useState("Holding space.");
  const [shards, setShards] = useState(() => Array.from({length: 12}).map((_, i) => ({
    id: i, position: [(Math.random() - 0.5) * 150, 1.5, (Math.random() - 0.5) * 150] as [number, number, number]
  })));
  const vessels = useRef(Array.from({length: 20}).map((_, i) => ({
    id: i,
    position: [(Math.random() - 0.5) * 200, 2, (Math.random() - 0.5) * 200] as [number, number, number],
    message: GASLIGHT_RHETORIC[Math.floor(Math.random() * GASLIGHT_RHETORIC.length)],
  })));
  const creepRefs = useRef(new Map());
  const playerPosRef = useRef(new THREE.Vector3());
  const orbitRef = useRef<any>(null);
  const lookSmooth = useRef(new THREE.Vector3(0, 0, 0));

  const handleAttack = (playerPos: any) => {
    creepRefs.current.forEach((ref) => {
      if (ref) {
        const enemyPos = ref.translation();
        const dist = new THREE.Vector3().subVectors(enemyPos, playerPos).length();
        if (dist < kickRange + 3.0) {
          const impulse = new THREE.Vector3().subVectors(enemyPos, playerPos).normalize().multiplyScalar(180);
          impulse.y = 100; 
          ref.applyImpulse(impulse, true);
          setScore((s: number) => {
              const newScore = s + 1;
              if (newScore > 5) setProtocol("DYNAMIC_VALIDATION");
              if (newScore > 10) setProtocol("INTEGRATED_QUIET");
              return newScore;
          });
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
      lookSmooth.current.lerp(focusTarget, 0.1);

      if (isMobile) {
        // AUTOMATIC FOLLOW FOR MOBILE
        const idealOffset = new THREE.Vector3(0, 20, 30);
        state.camera.position.lerp(pPos.clone().add(idealOffset), 0.05);
        state.camera.lookAt(lookSmooth.current);
      } else if (orbitRef.current) {
        // UPDATE ORBIT TARGET FOR DESKTOP
        orbitRef.current.target.copy(lookSmooth.current);
        orbitRef.current.update();
      }
    }
  });

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
        <WorldNode position={[30, 0, 70]} label="THE_BOARDROOM" color="#00ffff" />
        <WorldNode position={[-40, 0, -80]} label="THE_PENTHOUSE" color="#fff" />
        <RigidBody type="fixed" position={[0, -1, 0]}>
          <mesh receiveShadow><boxGeometry args={[2000, 2, 2000]} /><meshStandardMaterial color="#050505" /></mesh>
          <gridHelper args={[2000, 400, "#ff00ff", "#111"]} position={[0, 1.01, 0]} />
        </RigidBody>
      </Physics>
      
      {/* MOBILE USES ORBIT, DESKTOP USES POINTER LOCK (MANUALLY MANAGED) */}
      {isMobile ? (
          <OrbitControls enablePan={false} enableZoom={true} maxPolarAngle={Math.PI / 2.2} makeDefault />
      ) : (
          <PointerLockControls />
      )}

      <Html fullscreen zIndexRange={[100, 0]}>
         <div className="ui-overlay" style={{ pointerEvents: 'none' }}>
           <p style={{color: 'var(--pixels-green)', fontSize: '14px', marginBottom: '10px'}}>{affirmation.toUpperCase()}</p>
         </div>
      </Html>
    </>
  );
}

function App() {
  const [score, setScore] = useState(0);
  const [protocol, setProtocol] = useState("AFFIRM_AND_VALIDATE");
  const [isLocked, setIsLocked] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const mobileInput = useRef({ forward: false, backward: false, left: false, right: false, jump: false, attack: false });

  const updateInput = (key: string, value: boolean) => { (mobileInput.current as any)[key] = value; };
  const resetAllInput = () => { mobileInput.current = { forward: false, backward: false, left: false, right: false, jump: false, attack: false }; };

  useEffect(() => {
    const checkMobile = () => {
        setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    checkMobile();

    const prevent = (e: TouchEvent) => { if (e.touches.length > 1) e.preventDefault(); };
    document.addEventListener('touchstart', prevent, { passive: false });
    window.addEventListener('pointerup', resetAllInput);
    window.addEventListener('blur', resetAllInput);
    document.addEventListener('pointerlockchange', () => setIsLocked(!!document.pointerLockElement));

    return () => { 
        document.removeEventListener('touchstart', prevent);
        window.removeEventListener('pointerup', resetAllInput); 
        window.removeEventListener('blur', resetAllInput); 
    };
  }, []);

  return (
    <div className="quest-container">
      {(!isLocked && !isMobile) && (
          <div className="capture-overlay" onClick={() => document.body.requestPointerLock()}>
              <p>CLICK TO CAPTURE SIGNAL</p>
              <span>[ MOUSE_LOOK_ACTIVE ]</span>
          </div>
      )}
      
      <KeyboardControls map={keyboardMap}>
        <Canvas shadows dpr={[1, 2]}>
          <PerspectiveCamera makeDefault position={[0, 40, 60]} fov={35} />
          <Scene mobileInput={mobileInput} setProtocol={setProtocol} setScore={setScore} isMobile={isMobile} />
        </Canvas>
      </KeyboardControls>
      
      <div className="ui-header">
           <h1>PARADA.QUEST</h1>
           <div className="protocol-tag">PROTOCOL: {protocol}</div>
           <div className="integration-bar"><div className="fill" style={{ width: `${Math.min(100, score * 5)}%` }}></div></div>
           <div className="score-text">EMOTIONAL_INTEGRATION: {score}</div>
      </div>

      <div className="mobile-controls" onContextMenu={(e) => e.preventDefault()}>
          <div className="joystick-area">
              <button onPointerDown={(e) => { e.stopPropagation(); updateInput('forward', true); }} onPointerUp={(e) => { e.stopPropagation(); updateInput('forward', false); }} className="joy-btn up">↑</button>
              <div className="joy-row">
                  <button onPointerDown={(e) => { e.stopPropagation(); updateInput('left', true); }} onPointerUp={(e) => { e.stopPropagation(); updateInput('left', false); }} className="joy-btn left">←</button>
                  <button onPointerDown={(e) => { e.stopPropagation(); updateInput('right', true); }} onPointerUp={(e) => { e.stopPropagation(); updateInput('right', false); }} className="joy-btn right">→</button>
              </div>
              <button onPointerDown={(e) => { e.stopPropagation(); updateInput('backward', true); }} onPointerUp={(e) => { e.stopPropagation(); updateInput('backward', false); }} className="joy-btn down">↓</button>
          </div>
          <div className="action-area">
              <button onPointerDown={(e) => { e.stopPropagation(); updateInput('jump', true); }} onPointerUp={(e) => { e.stopPropagation(); updateInput('jump', false); }} className="action-btn jump">REGULATE</button>
              <button onPointerDown={(e) => { e.stopPropagation(); updateInput('attack', true); }} onPointerUp={(e) => { e.stopPropagation(); updateInput('attack', false); }} className="action-btn attack">HOLD_SPACE</button>
          </div>
      </div>
      <div className="crt-overlay"></div>
    </div>
  )
}
export default App
