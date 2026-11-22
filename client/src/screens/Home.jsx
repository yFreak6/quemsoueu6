import { useState } from 'react';
import Alert from '../components/Alert.jsx';
import { useGame } from '../game/GameContext.jsx';
import { MODES, ModePicker } from '../components/ModePicker.jsx';

const inputCls =
  'w-full rounded-xl border-2 border-ink/10 bg-white px-4 py-3 text-lg outline-none transition focus:border-felt focus:ring-4 focus:ring-felt/15';

/** Vista de cima da mesa: o logotipo do jogo. */
function TableMark() {
  return (
    <svg viewBox="0 0 120 120" className="mx-auto h-24 w-24 drop-shadow-md" aria-hidden="true">
      <circle cx="60" cy="60" r="34" fill="#2f9e63" />
      <circle cx="60" cy="60" r="34" fill="none" stroke="#e9f5ee" strokeWidth="3" />
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return <circle key={i} cx={60 + Math.sin(a) * 50} cy={60 - Math.cos(a) * 50} r="9" fill="#fff" stroke="#16241c" strokeOpacity=".12" />;
      })}
      <text x="60" y="73" textAnchor="middle" fontSize="38" fontWeight="900" fill="#fff" fontFamily="Inter, system-ui, sans-serif">?</text>
    </svg>
  );
}

export default function Home() {
  const { create, join, notice, setNotice } = useGame();
  const prefill = new URLSearchParams(window.location.search).get('sala') ?? '';
  const [mode, setMode] = useState(prefill ? 'join' : null); // null | 'create' | 'join'
  const [code, setCode] = useState(prefill.toUpperCase().slice(0, 4));
  const [nick, setNick] = useState('');
  const [gameMode, setGameMode] = useState('host');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice(null);
    const res = mode === 'create' ? await create(nick, gameMode) : await join(code, nick);
    setBusy(false);
    if (!res.ok) setError(res.error);
    else window.history.replaceState(null, '', window.location.pathname);
  };

  const back = () => {
    setMode(null);
    setError('');
  };

  return (
    <main className="grid h-full place-items-center overflow-y-auto bg-[radial-gradient(ellipse_at_top,#f7f1e5,#e9e3d6_60%,#d9d2c1)] p-4">
      <div className="w-full max-w-md rounded-[28px] bg-white/85 p-8 shadow-xl ring-1 ring-ink/5 backdrop-blur">
        <div className="mb-7 text-center">
          <TableMark />
          <h1 className="mt-3 text-4xl font-black tracking-tight">Quem Sou Eu?</h1>
          <p className="mt-1 text-ink/60">Descubra o nome colado na sua testa.</p>
        </div>

        {notice && (
          <div className="mb-4">
            <Alert tone={notice.tone} onClose={() => setNotice(null)}>
              {notice.text}
            </Alert>
          </div>
        )}

        {mode === null ? (
          <div className="grid gap-3">
            <button onClick={() => setMode('create')} className="rounded-xl bg-felt py-3.5 text-lg font-bold text-white shadow-md hover:bg-felt-dark">
              Criar Sala
            </button>
            <button onClick={() => setMode('join')} className="rounded-xl bg-ink py-3.5 text-lg font-bold text-white shadow-md hover:bg-black">
              Juntar à Sala
            </button>
          </div>
        ) : (
          <form className="grid gap-4" onSubmit={submit} noValidate>
            <h2 className="text-center text-sm font-extrabold uppercase tracking-widest text-felt">{mode === 'create' ? 'Criar sala' : 'Juntar à sala'}</h2>

            {mode === 'join' && (
              <label className="grid gap-1 text-sm font-bold" htmlFor="code">
                Código da sala
                <input
                  id="code"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4));
                    setError('');
                  }}
                  placeholder="ABCD"
                  className={`${inputCls} text-center font-mono tracking-[0.4em]`}
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  autoFocus={!prefill}
                />
              </label>
            )}

            <label className="grid gap-1 text-sm font-bold" htmlFor="nick">
              Seu nickname
              <input
                id="nick"
                value={nick}
                onChange={(e) => {
                  setNick(e.target.value.slice(0, 16));
                  setError('');
                }}
                placeholder="Como você quer ser chamado"
                className={inputCls}
                autoComplete="off"
                autoFocus={mode === 'create' || !!prefill}
              />
            </label>

            {mode === 'create' && <ModePicker value={gameMode} onChange={setGameMode} />}

            {error && <Alert tone="error">{error}</Alert>}

            <button
              disabled={busy || nick.trim().length < 2 || (mode === 'join' && code.length < 4)}
              className="rounded-xl bg-felt py-3.5 text-lg font-bold text-white shadow-md hover:bg-felt-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? 'Aguarde…' : mode === 'create' ? 'Criar sala' : 'Entrar'}
            </button>
            <button type="button" onClick={back} className="text-sm font-semibold text-ink/60 hover:text-ink hover:underline">
              Voltar
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
