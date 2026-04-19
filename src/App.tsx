import { useState, useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Physics, RigidBody } from '@react-three/rapier'
import { KeyboardControls, useKeyboardControls, Html, PerspectiveCamera, Text, Billboard, OrbitControls, Float } from '@react-three/drei'
import * as THREE from 'three'
import './App.css'

const TOXIC_PHRASES = [
  "You'd be prettier if you smiled.", "I'm actually a really nice guy.", "Do you know who I am?",
  "I can help your career.", "Don't be like that, babe.", "I'm just giving you a compliment.",
  "You're making a scene.", "I'm the one paying for this.", "You're lucky I'm even talking to you."
];

const DIVINE_WISDOM = [
  "Wisdom is a shared breath.", "Softness is the ultimate armor.", "Transcribing the quiet.",
  "You are a vessel of light.", "Honoring the lineage of peace.", "The muse is the mirror.",
  "Spirituality is disciplined empathy."
];

const keyboardMap = [
  { name: "forward", keys: ["ArrowUp", "w", "W"] },
  { name: "backward", keys: ["ArrowDown", "s", "S"] },
  { name: "left", keys: ["ArrowLeft", "a", "A"] },
  { name: "right", keys: ["ArrowRight", "d", "D"] },
  { name: "jump", keys: ["Space"] },
  { name: "attack", keys: ["k", "K", "Enter"] },
];

function WorldNode({ position, label, color, scale = [1,1,1] }: any) {
    return (
      <RigidBody type="fixed" position={position}>
        <mesh castShadow scale={scale}>
          <boxGeometry args={[10, 15, 10]} />
          <meshStandardMaterial color="#0a0a0a" />
        </mesh>
        <Text position={[0, 9 * scale[1], 0]} fontSize={1} color={color}>{label}</Text>
      </RigidBody>
    );
}

function Muse({ position, onWisdom }: any) {
  return (
    <group position={position}>
      <Float speed={3} rotationIntensity={0.5} floatIntensity={1}>
        <mesh castShadow>
          <torusKnotGeometry args={[1, 0.3, 100, 16]} />
          <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={2} transparent opacity={0.8} />
        </mesh>
        <Billboard position={[0, 2.5, 0]}><Text fontSize={0.4} color="#ffd700">DIVINE_WISDOM</Text></Billboard>
        <RigidBody type="fixed" sensor onIntersectionEnter={onWisdom}>
           <mesh visible={false}><sphereGeometry args={[3]} /></mesh>
        </RigidBody>
      </Float>
    </group>
  );
}

function Dojo({ position }: any) {
    return (
      <group position={position}>
        <RigidBody type="fixed">
          <mesh castShadow><boxGeometry args={[20, 1, 20]} /><meshStandardMaterial color="#050505" /></mesh>
        </RigidBody>
        <mesh position={[0, 4, 0]}>
          <boxGeometry args={[19.5, 8, 19.5]} />
          <meshStandardMaterial color="#00ff00" transparent opacity={0.05} wireframe />
        </mesh>
        <Text position={[0, 9, 0]} fontSize={1.2} color="#00ff00">RESILIENCE_DOJO [ISOLATION_ZONE]</Text>
        <gridHelper args={[20, 10, "#00ff00", "#00ff00"]} position={[0, 0.1, 0]} />
      </group>
    );
}

function KarateMan({ onAttack, playerPosRef, kickRange, mobileInput, pp, isAttacking, setIsAttacking }: any) {
  const bodyRef = useRef<any>(null);
  const groupRef = useRef<any>(null);
  const leftArm = useRef<any>(null);
  const rightArm = useRef<any>(null);
  const leftLeg = useRef<any>(null);
  const rightLeg = useRef<any>(null);
  const [, getKeys] = useKeyboardControls();
  const { camera } = useThree();
  const attackCooldown = useRef(false);

  useFrame((state) => {
    if (!bodyRef.current) return;
    const keys = getKeys();
    const moveX = (keys.right ? 1 : 0) - (keys.left ? 1 : 0) + mobileInput.current.x;
    const moveZ = (keys.backward ? 1 : 0) - (keys.forward ? 1 : 0) + mobileInput.current.y;
    const pos = bodyRef.current.translation();
    const linvel = bodyRef.current.linvel();
    playerPosRef.current.set(pos.x, pos.y, pos.z);

    const wantAttack = keys.attack || mobileInput.current.attack;
    if (wantAttack && !attackCooldown.current && pp > 0) {
       setIsAttacking(true);
       attackCooldown.current = true;
       onAttack(); 
       
       setTimeout(() => {
          setIsAttacking(false);
       }, 350);

       setTimeout(() => {
          attackCooldown.current = false;
       }, 700);
    }

    const cameraRotation = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
    cameraRotation.x = 0; cameraRotation.z = 0;
    const moveDirection = new THREE.Vector3(moveX, 0, moveZ);
    const currentSpeed = pp > 0 ? 12 : 4;

    if (moveDirection.lengthSq() > 0.01) {
      moveDirection.normalize().applyEuler(cameraRotation).multiplyScalar(currentSpeed);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, Math.atan2(moveDirection.x, moveDirection.z), 0.2);
    }
    
    bodyRef.current.setLinvel({ 
        x: THREE.MathUtils.lerp(linvel.x, moveDirection.x, 0.3), 
        y: linvel.y, 
        z: THREE.MathUtils.lerp(linvel.z, moveDirection.z, 0.3) 
    }, true);

    if ((keys.jump || mobileInput.current.jump) && Math.abs(linvel.y) < 0.1 && pos.y < 1.5) {
       bodyRef.current.setLinvel({ x: linvel.x, y: 16, z: linvel.z }, true);
    }

    const t = state.clock.elapsedTime;
    if (moveDirection.lengthSq() > 0.1) {
      leftArm.current.rotation.x = Math.sin(t * 15) * 0.8;
      rightArm.current.rotation.x = Math.sin(t * 15 + Math.PI) * 0.8;
      leftLeg.current.rotation.x = Math.sin(t * 15 + Math.PI) * 0.6;
      rightLeg.current.rotation.x = Math.sin(t * 15) * 0.6;
    }
  });

  return (
    <RigidBody name="karate-man" ref={bodyRef} position={[0, 2, 0]} colliders="cuboid" lockRotations mass={1} friction={2}>
      <group ref={groupRef}>
        <mesh position={[0, 0.3, 0]} castShadow><boxGeometry args={[0.7, 0.9, 0.5]} /><meshStandardMaterial color="#fff" /></mesh>
        <mesh position={[0, 0, 0]} castShadow><boxGeometry args={[0.75, 0.15, 0.55]} /><meshStandardMaterial color="#000" /></mesh>
        <group position={[0, 1, 0.05]}>
          <mesh castShadow><boxGeometry args={[0.58, 0.48, 0.58]} /><meshStandardMaterial color="#ff00ff" /></mesh>
          <mesh position={[0, -0.15, 0.02]} castShadow><boxGeometry args={[0.5, 0.4, 0.5]} /><meshStandardMaterial color="#fdd" /></mesh>
          <mesh position={[0.12, -0.1, 0.26]}><boxGeometry args={[0.07, 0.04, 0.05]} /><meshStandardMaterial color="#000" /></mesh>
          <mesh position={[-0.12, -0.1, 0.26]}><boxGeometry args={[0.07, 0.04, 0.05]} /><meshStandardMaterial color="#000" /></mesh>
        </group>
        <group ref={leftArm} position={[0.45, 0.6, 0]}><mesh position={[0, -0.3, 0]} castShadow><boxGeometry args={[0.2, 0.6, 0.2]} /><meshStandardMaterial color="#fff" /></mesh></group>
        <group ref={rightArm} position={[-0.45, 0.6, 0]}><mesh position={[0, -0.3, 0]} castShadow><boxGeometry args={[0.2, 0.6, 0.2]} /><meshStandardMaterial color="#fff" /></mesh></group>
        <group ref={leftLeg} position={[0.2, -0.2, 0]}><mesh position={[0, -0.3, 0]} castShadow><boxGeometry args={[0.25, 0.6, 0.25]} /><meshStandardMaterial color="#fff" /></mesh></group>
        <group ref={rightLeg} position={[-0.2, -0.2, 0]}><mesh position={[0, -0.3, 0]} castShadow><boxGeometry args={[0.25, 0.6, 0.25]} /><meshStandardMaterial color="#fff" /></mesh></group>
        
        {isAttacking && (
           <group>
             <mesh position={[0, 0, (kickRange + 0.5) / 2]}>
               <boxGeometry args={[0.2, 0.2, kickRange]} />
               <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={30} transparent opacity={0.9} />
             </mesh>
             <mesh position={[0, 0, kickRange]}>
                <sphereGeometry args={[0.3, 8, 8]} />
                <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={10} />
             </mesh>
           </group>
        )}
      </group>
    </RigidBody>
  );
}

function ToxicVessel({ data, onHeal, playerPosRef, registerHeal }: any) {
  const vesselRef = useRef<any>(null);
  const [isHealed, setIsHealed] = useState(false);

  useFrame(() => {
     if (!vesselRef.current || !playerPosRef.current || isHealed) return;
     const pos = vesselRef.current.translation();
     const pPos = playerPosRef.current;
     const direction = new THREE.Vector3(pPos.x - pos.x, 0, pPos.z - pos.z);
     
     const distFromOrigin = new THREE.Vector2(pos.x, pos.z).length();
     if (distFromOrigin < 12) {
        const pushAway = new THREE.Vector3(pos.x, 0, pos.z).normalize().multiplyScalar(6);
        vesselRef.current.setLinvel({ x: pushAway.x, y: 0, z: pushAway.z }, true);
        return;
     }

     if (direction.lengthSq() > 2) { 
        const followSpeed = data.type === 'HEAVY' ? 0.8 : 2.5;
        direction.normalize().multiplyScalar(followSpeed);
        vesselRef.current.setLinvel({ x: direction.x, y: 0, z: direction.z }, true);
        vesselRef.current.setRotation(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.atan2(pPos.x - pos.x, pPos.z - pos.z), 0)), true);
     }
  });

  const triggerHeal = () => {
     if (isHealed) return;
     setIsHealed(true);
     vesselRef.current.applyImpulse({ x: (Math.random() - 0.5) * 50, y: 100, z: (Math.random() - 0.5) * 50 }, true);
     onHeal();
  };

  useEffect(() => { registerHeal(data.id, triggerHeal, vesselRef); }, []);

  return (
    <RigidBody ref={vesselRef} position={data.position} colliders="cuboid" lockRotations mass={isHealed ? 1 : 4} type={isHealed ? "fixed" : "dynamic"}>
      {!isHealed ? (
        <group>
          <mesh position={[0, 0.4, 0]} castShadow><boxGeometry args={[data.type === 'HEAVY' ? 1 : 0.7, 1.2, 0.5]} /><meshStandardMaterial color={data.type === 'HEAVY' ? "#300" : "#111"} /></mesh>
          <mesh position={[0, 1.1, 0]} castShadow><boxGeometry args={[0.5, 0.5, 0.5]} /><meshStandardMaterial color="#222" /></mesh>
          <Billboard position={[0, 2.4, 0]}><Text fontSize={0.2} color="#fff" maxWidth={2.5} textAlign="center">{data.message}</Text></Billboard>
        </group>
      ) : (
        <group>
           <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
              <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.02, 0.02, 1.5]} /><meshStandardMaterial color="#00ff00" /></mesh>
              <mesh position={[0, 1.2, 0]}><sphereGeometry args={[0.15, 12, 12]} /><meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={5} /></mesh>
              <Billboard position={[0, 1.8, 0]}><Text fontSize={0.25} color="#00ff00">HEALED</Text></Billboard>
           </Float>
        </group>
      )}
    </RigidBody>
  );
}

function Scene({ mobileInput, setScore, setPP, pp }: any) {
  const [kickRange, setKickRange] = useState(1.5);
  const [isAttacking, setIsAttacking] = useState(false);
  const [affirmation, setAffirmation] = useState("Establishing peace.");
  const vessels = useRef(Array.from({length: 30}).map((_, i) => ({
    id: i, type: Math.random() > 0.8 ? 'HEAVY' : 'NORMAL',
    position: [(Math.random() - 0.5) * 600, 2, (Math.random() - 0.5) * 600] as [number, number, number],
    message: TOXIC_PHRASES[Math.floor(Math.random() * TOXIC_PHRASES.length)],
  })));
  
  const healMap = useRef(new Map());
  const creepPhysicsRefs = useRef(new Map());
  const playerPosRef = useRef(new THREE.Vector3());
  const orbitRef = useRef<any>(null);

  const handleAttackTrigger = () => {
     setAffirmation("HANDSHAKE_ACTIVE");
     // Hit detection logic now handled in useFrame during isAttacking
  };

  useFrame((_, delta) => {
    if (!playerPosRef.current) return;
    const pPos = playerPosRef.current;
    const inDojo = pPos.distanceTo(new THREE.Vector3(0, 0, 0)) < 12;
    const regen = inDojo ? 20 * delta : 0;
    setPP((prev: number) => Math.min(100, prev + regen));
    if (orbitRef.current) orbitRef.current.target.lerp(pPos.clone().add(new THREE.Vector3(0, 1.5, 0)), 0.1);

    // REAL-TIME HIT DETECTION WHILE ATTACK IS ACTIVE
    if (isAttacking) {
        creepPhysicsRefs.current.forEach((ref, id) => {
           if (!ref) return;
           const vPos = ref.translation();
           const dist = pPos.distanceTo(new THREE.Vector3(vPos.x, vPos.y, vPos.z));
           if (dist < kickRange + 2.5) {
               const trigger = healMap.current.get(id);
               if (trigger) trigger();
           }
        });
    } else if (affirmation === "HANDSHAKE_ACTIVE") {
       // Clear affirmation after strike finishes
       setTimeout(() => setAffirmation("Breathe."), 500);
    }
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[100, 100, 50]} castShadow intensity={2} />
      <Physics gravity={[0, -45, 0]}>
        <KarateMan 
            onAttack={handleAttackTrigger} 
            playerPosRef={playerPosRef} 
            kickRange={kickRange} 
            mobileInput={mobileInput} 
            pp={pp} 
            isAttacking={isAttacking} 
            setIsAttacking={setIsAttacking} 
        />
        
        {vessels.current.map((v) => (
          <ToxicVessel 
            key={v.id} data={v} playerPosRef={playerPosRef} 
            registerHeal={(id: any, trigger: any, ref: any) => { healMap.current.set(id, trigger); creepPhysicsRefs.current.set(id, ref); }} 
            onHeal={() => { setScore((s:any) => s + 1); setPP((prev: any) => Math.min(100, prev + 15)); }} 
          />
        ))}
        <Dojo position={[0, -0.5, 0]} />
        <Muse position={[40, 2, 40]} onWisdom={() => {
            setKickRange(prev => prev + 1.0);
            setAffirmation(DIVINE_WISDOM[Math.floor(Math.random() * DIVINE_WISDOM.length)]);
            setPP(100);
        }} />
        <WorldNode position={[120, 0, -120]} label="GASLIGHT_BANK" color="#ffd700" />
        <WorldNode position={[-150, 0, 100]} label="ALPHA_GYM" color="#ff0000" />
        <RigidBody type="fixed" position={[0, -1, 0]}>
          <mesh receiveShadow><boxGeometry args={[4000, 2, 4000]} /><meshStandardMaterial color="#050505" /></mesh>
          <gridHelper args={[4000, 400, "#ff00ff", "#111"]} position={[0, 1.01, 0]} />
        </RigidBody>
      </Physics>
      <OrbitControls ref={orbitRef} enablePan={false} enableZoom={true} maxPolarAngle={Math.PI / 2.2} minDistance={8} maxDistance={40} makeDefault />
      <Html fullscreen zIndexRange={[100, 0]}>
         <div className="ui-overlay" style={{ pointerEvents: 'none' }}><p style={{color: 'var(--pixels-green)', fontSize: '14px'}}>{affirmation.toUpperCase()}</p></div>
      </Html>
    </>
  );
}

function App() {
  const [score, setScore] = useState(0);
  const [pp, setPP] = useState(100);
  const mobileInput = useRef({ x: 0, y: 0, jump: false, attack: false });
  const joystickRef = useRef<HTMLDivElement>(null);
  const handleJoystick = (e: any) => {
      if (!joystickRef.current) return;
      const rect = joystickRef.current.getBoundingClientRect();
      const x = ((e.clientX || e.touches?.[0]?.clientX) - (rect.left + rect.width / 2)) / (rect.width / 2);
      const y = ((e.clientY || e.touches?.[0]?.clientY) - (rect.top + rect.height / 2)) / (rect.height / 2);
      mobileInput.current.x = Math.max(-1, Math.min(1, x)); mobileInput.current.y = Math.max(-1, Math.min(1, y));
  };
  return (
    <KeyboardControls map={keyboardMap}>
      <div className="quest-container">
        <Canvas shadows dpr={[1, 2]}>
          <PerspectiveCamera makeDefault position={[0, 5, 10]} fov={40} />
          <Scene mobileInput={mobileInput} setScore={setScore} setPP={setPP} pp={pp} />
        </Canvas>
        <div className="ui-header">
             <h1>PARADA.QUEST</h1>
             <div className="meter-label">PEACE_POINTS (PP)</div>
             <div className="pp-bar"><div className="fill" style={{ width: `${pp}%`, backgroundColor: pp > 30 ? 'var(--pixels-green)' : '#ff0000' }}></div></div>
             <div className="score-text">ENCLAVE_HEALED: {score}/30</div>
             <div className="score-text" style={{color: 'var(--pixels-pink)', marginTop: '5px'}}>INTEGRATION_SYNC: {Math.floor((score/30)*100)}%</div>
        </div>
        <div className="mobile-interface">
            <div className="virtual-joystick" ref={joystickRef} onPointerMove={handleJoystick} onPointerUp={() => {mobileInput.current.x = 0; mobileInput.current.y = 0;}} onTouchMove={handleJoystick} onTouchEnd={() => {mobileInput.current.x = 0; mobileInput.current.y = 0;}}>
                <div className="joystick-handle" style={{ transform: `translate(${mobileInput.current.x * 40}px, ${mobileInput.current.y * 40}px)` }}></div>
            </div>
            <div className="mobile-actions">
                <button onPointerDown={() => mobileInput.current.jump = true} onPointerUp={() => mobileInput.current.jump = false} className="mob-btn">REGULATE</button>
                <button onPointerDown={() => mobileInput.current.attack = true} onPointerUp={() => mobileInput.current.attack = false} className="mob-btn pink">HOLD_SPACE</button>
            </div>
        </div>
        <div className="crt-overlay"></div>
      </div>
    </KeyboardControls>
  )
}
export default App
