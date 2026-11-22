import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import CameraRig from './CameraRig.jsx';
import Doll from './Doll.jsx';
import Environment from './Environment.jsx';
import Npcs from './Npcs.jsx';
import { tableLayout } from './layout.js';
import VoteSheet, { sheetWidth } from './VoteSheet.jsx';

/**
 * Guarda de desempenho: mede o FPS e, se estiver baixo, reduz a qualidade em etapas
 * (1º resolução, 2º sombras). Nunca sobe de volta, para não ficar oscilando.
 */
function PerformanceGuard() {
  const { gl, scene } = useThree();
  const acc = useRef({ t: 0, n: 0, level: 0, warm: 0, frame: 0 });

  // As sombras vêm de uma única luz e quase tudo é estático: redesenhar o mapa a cada 3 quadros
  // corta ~2/3 do custo de sombra sem diferença visível (bonecos mexem devagar).
  useLayoutEffect(() => {
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    return () => {
      gl.shadowMap.autoUpdate = true;
    };
  }, [gl]);

  useFrame((_, dt) => {
    const a = acc.current;
    if (a.frame++ % 3 === 0) gl.shadowMap.needsUpdate = true;
    a.warm += dt;
    if (a.warm < 3 || a.level >= 3) return; // ignora o aquecimento (compilação de shaders)
    a.t += dt;
    a.n += 1;
    if (a.t < 2) return;
    const fps = a.n / a.t;
    a.t = 0;
    a.n = 0;
    if (fps >= 45) return;
    a.level += 1;
    if (a.level === 1) gl.setPixelRatio(Math.min(1, window.devicePixelRatio || 1));
    else if (a.level === 2) gl.setPixelRatio(0.75);
    else {
      gl.shadowMap.enabled = false;
      scene.traverse((o) => {
        if (o.material) [].concat(o.material).forEach((m) => (m.needsUpdate = true));
      });
    }
  });
  return null;
}

/**
 * Cena 3D. Todos (inclusive o host) veem da cadeira do próprio jogador.
 * O boneco do assento de onde se olha NÃO é desenhado: é a "sua" cabeça.
 * A regra de visibilidade é garantida pelo servidor: o próprio papel nem chega aqui.
 */
export default function Scene({ state, reactions, vote = null }) {
  const { players, turn, you, result } = state;
  const n = players.length;
  const layout = tableLayout(n);
  const { seatR, tableR } = layout;

  // só os assentos importam para o ambiente (cadeiras): string estável evita re-render a cada mudança de estado
  const seatKey = players.map((p) => p.seat).join(',');
  const me = players.find((p) => p.id === you.id);
  const camSeat = me?.seat ?? 0;
  const turnSeat = players.find((p) => p.id === turn?.playerId)?.seat ?? null;
  // modos de impostor: durante a votação (e o resultado) a folha aparece na mesa e a câmera enquadra a mesa
  const imp = state.imp;
  const sheetOn = !!imp && (imp.stage === 'vote' || imp.stage === 'result') && state.phase === 'playing';
  const sheetPlayers = imp ? players.filter((p) => !p.spectator).sort((a, b) => a.seat - b.seat) : [];
  const pickable = sheetOn && imp.stage === 'vote' && vote?.canVote ? vote.eligible.filter((id) => id !== you.id) : [];

  return (
    <Canvas shadows={{ type: THREE.PCFShadowMap }} dpr={[1, 1.5]} gl={{ powerPreference: 'high-performance', stencil: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.8 }} camera={{ fov: 62, near: 0.1, far: 60, position: [0, 1.42, seatR] }}>
      <color attach="background" args={['#1d1210']} />
      <fog attach="fog" args={['#1d1210', layout.roomR * 0.8, layout.roomR * 1.6]} />

      {/* luz de bar: ambiente quente e baixo + luz principal para sombras suaves + lâmpada sobre a mesa + neon */}
      <ambientLight intensity={0.36} color="#ffd9a8" />
      <hemisphereLight args={['#ffe2b8', '#5a3a22', 0.55]} />
      <directionalLight position={[4, 8, 3]} intensity={0.5} color="#ffd9a0" />

      <Environment seats={seatKey} n={n} seatR={seatR} tableR={tableR} roomR={layout.roomR} wallH={layout.wallH} decor={!sheetOn} />

      <PerformanceGuard />
      <Npcs seatR={seatR} roomR={layout.roomR} />

      {players.map((p) =>
        p.seat === camSeat || p.spectator ? null : (
          <Doll
            key={p.id}
            player={p}
            n={n}
            seatR={seatR}
            isTurn={turn?.playerId === p.id}
            reaction={reactions[p.id]}
            isWinner={result?.winnerId === p.id}
          />
        ),
      )}

      {imp && sheetPlayers.length > 0 && (
        <VoteSheet players={sheetPlayers} n={n} camSeat={camSeat} tableR={tableR} show={sheetOn} pickable={pickable} pickId={vote?.pickId ?? null} onPick={vote?.onPick ?? (() => {})} />
      )}

      <CameraRig seat={camSeat} n={n} seatR={seatR} turnSeat={sheetOn ? null : turnSeat} shakeAt={reactions[you.id]?.at} overview={sheetOn ? { sheetW: sheetWidth(tableR) } : null} />
    </Canvas>
  );
}
