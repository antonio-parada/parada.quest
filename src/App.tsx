import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Heart, Music, Skull } from 'lucide-react'
import './App.css'

const DESTINY_DATA = [
  {
    id: 'photo',
    label: 'SIGNAL_CAPTURE',
    content: 'The lens was the first handshake with the void. Photo. Video. The light is archived.',
    icon: <Zap size={16} />
  },
  {
    id: 'women',
    label: 'HUMAN_INTERACTION',
    content: 'Connections made in the frame. The muse is the mirror. Seeking the truth in the other.',
    icon: <Heart size={16} />
  },
  {
    id: 'music',
    label: 'HARMONIC_RESONANCE',
    content: 'Piano strings and martial arts. The rhythm of survival. The beat of the quiet.',
    icon: <Music size={16} />
  },
  {
    id: 'trauma',
    label: 'THE_CATALYST',
    content: 'Homelessness. Grief. Loss of a friend in 2026. The fire that built the architect.',
    icon: <Skull size={16} />
  }
]

function App() {
  const [index, setIndex] = useState(0);
  const [glitchActive, setGlitchActive] = useState(false);

  // Instant Loop Logic: Rapid cycle or manually triggered
  useEffect(() => {
    const interval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 50);
      setIndex((prev) => (prev + 1) % DESTINY_DATA.length);
    }, 4000); // Change data every 4 seconds

    return () => clearInterval(interval);
  }, []);

  const current = DESTINY_DATA[index];

  return (
    <div className="quest-container">
      <div className="status-bar">
        STATUS: EMULATION_ACTIVE // NODE: PARADA.QUEST // SYNC: {Math.floor(Math.random() * 100)}%
      </div>

      <motion.div 
        className="avatar-container"
        animate={glitchActive ? { x: [-2, 2, -2], opacity: [1, 0.8, 1] } : {}}
      >
        <div className="avatar-pink-buzz">
          <div className="avatar-eyes"></div>
        </div>
      </motion.div>

      <div className="glitch-text">
        PARADA.QUEST
      </div>

      <div className="dialogue-box">
        <AnimatePresence mode="wait">
          <motion.div 
            key={current.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="destiny-loop-text"
          >
            <span className="destiny-label">
              [{current.label}]
            </span>
            <p style={{marginTop: '10px'}}>{current.content}</p>
          </motion.div>
        </AnimatePresence>

        <div className="choice-prompt" onClick={() => setIndex((index + 1) % DESTINY_DATA.length)}>
          * INTERACT WITH THE HANDSHAKE
        </div>
      </div>

      <div style={{marginTop: '40px', fontSize: '8px', color: '#333'}}>
        SYSTEM_DESTINY_LOOP_V1.0.0 // PIXELS_AGENCY
      </div>
    </div>
  )
}

export default App
