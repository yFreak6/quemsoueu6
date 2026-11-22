export const MODES = {
  host: { name: 'HOST ESCOLHE', desc: 'O host monta a lista de personagens; cada jogador sugere 1 nome, que é sorteado para o host. Aceita bots.' },
  players: { name: 'CADA UM ESCOLHE', desc: 'Todos (inclusive o host) escolhem 1 personagem. Cada escolha é sorteada para outro jogador, nunca para quem a fez. Sem bots.' },
  teams: { name: 'MODO EM TIMES', desc: 'Dois times sorteados. Cada um escolhe 1 personagem, que vai para alguém do time adversário. Vence o time em que todos acertarem primeiro. 2 ou 4 a 10 jogadores. Sem bots.' },
  multi: { name: 'CADA UM ESCOLHE VÁRIOS', desc: 'Cada jogador escolhe de 1 a 3 personagens. O jogo sorteia 1 de cada seleção e distribui os sorteados: ninguém recebe o sorteado da própria seleção. Sem bots.' },
  imp_elim: { name: 'IMPOSTOR — ELIMINAÇÃO', desc: 'Um impostor. Rodadas de turnos (só passar a vez) e votação: o mais votado sai. Inocentes vencem eliminando o impostor; o impostor vence se restarem só 2. Sem bots.' },
  imp_single: { name: 'IMPOSTOR — VOTAÇÃO ÚNICA', desc: 'Um impostor e uma única votação decisiva: acertou, inocentes vencem; errou, o impostor vence. Empate = mais uma rodada e nova votação. Sem bots.' },
  imp_multi: { name: 'IMPOSTORES — MÚLTIPLOS', desc: 'O host escolhe quantos impostores. A cada votação um jogador sai. Inocentes vencem sem impostores; impostores vencem ao igualar os inocentes. Sem bots.' },
};

/** O seletor agrupa os modos em três categorias. */
export const CATEGORIES = [
  { id: 'std', title: 'MODOS PADRÃO', modes: ['host', 'players', 'multi'] },
  { id: 'team', title: 'MODOS DE TIME', modes: ['teams'] },
  { id: 'imp', title: 'MODOS DE IMPOSTOR', modes: ['imp_elim', 'imp_single', 'imp_multi'] },
];
export const isImpMode = (m) => typeof m === 'string' && m.startsWith('imp_');

/** Seletor dos dois modos de partida (criação da sala e lobby do host). */
export function ModePicker({ value, onChange, disabled = false, playerCount = null }) {
  return (
    <fieldset className="grid gap-3" disabled={disabled}>
      <legend className="mb-1 text-sm font-bold">Modo de partida</legend>
      {CATEGORIES.map((cat) => (
        <div key={cat.id} className="grid gap-2" role="group" aria-label={cat.title}>
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-ink/45">{cat.title}</p>
          {cat.modes.map((key) => {
            const m = MODES[key];
            // em times não funciona com 1 ou 3 jogadores: a opção fica desabilitada (a menos que já esteja escolhida)
            const off = key === 'teams' && value !== 'teams' && (playerCount === 1 || playerCount === 3);
            return (
              <label
                key={key}
                className={`rounded-xl border-2 px-4 py-2.5 transition ${off ? 'cursor-not-allowed opacity-45' : 'cursor-pointer'} ${value === key ? 'border-felt bg-felt-light' : 'border-ink/10 bg-white hover:border-ink/25'}`}
                title={off ? 'Indisponível com 1 ou 3 jogadores' : undefined}
              >
                <span className="flex items-center gap-2">
                  <input type="radio" name="game-mode" value={key} checked={value === key} disabled={off} onChange={() => onChange(key)} className="accent-[#2f9e63]" />
                  <span className="text-sm font-extrabold tracking-wide">{m.name}</span>
                </span>
                <span className="mt-0.5 block pl-6 text-xs font-medium text-ink/60">{m.desc}</span>
                {off && <span className="mt-0.5 block pl-6 text-xs font-bold text-amber-800">Indisponível com {playerCount} jogador{playerCount === 1 ? '' : 'es'}.</span>}
              </label>
            );
          })}
        </div>
      ))}
    </fieldset>
  );
}
