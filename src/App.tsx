import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import { parseLog } from './parser';
import type { Message } from './parser';

function Portrait({ message, large = false }: { message: Message; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [message.image]);
  return <span className={'avatar ' + (large ? 'large' : '')} style={{ '--speaker': message.color } as CSSProperties}>
    {message.image && !failed ? <img src={message.image} alt={message.name} onError={() => setFailed(true)} loading={large ? 'eager' : 'lazy'} /> : message.name.slice(0, 1)}
  </span>;
}
function DiceResult({ message }: { message: Message }) {
  if (!message.roll) return null;
  const labels = { critical: '대성공', fumble: '대실패', success: '성공', failure: '실패', neutral: '주사위' };
  return <div className={'dice-result ' + message.roll.outcome}><strong>⚄ {labels[message.roll.outcome]}</strong><span>{message.roll.result}</span></div>;
}
export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [title, setTitle] = useState('로그 뷰어');
  const [channel, setChannel] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState<number | null>(null);
  const [shown, setShown] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const generation = useRef(0);
  const filtered = messages.filter(m => channel === null || m.channel === channel);
  const current = playing === null ? undefined : filtered[playing];
  const characters = Array.from(current?.text ?? '');
  const complete = shown >= characters.length;
  const last = playing === filtered.length - 1;
  const channels = [...new Set(messages.map(m => m.channel))];
  const isOpen = playing !== null;

  useEffect(() => {
    if (isOpen) { dialog.current?.showModal(); dialog.current?.focus(); }
    else if (dialog.current?.open) { dialog.current.close(); returnFocus.current?.focus(); }
  }, [isOpen]);
  useEffect(() => {
    setShown(0);
    if (!current) return;
    const length = Array.from(current.text).length;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(length); return; }
    const timer = window.setInterval(() => setShown(n => {
      if (n >= length) { window.clearInterval(timer); return n; }
      return n + 1;
    }), 24);
    return () => window.clearInterval(timer);
  }, [current]);
  function start(index: number) {
    returnFocus.current = document.activeElement as HTMLElement;
    setShown(0); setPlaying(index);
  }
  function next() {
    if (!current) return;
    if (!complete) { setShown(characters.length); return; }
    if (last) setPlaying(null);
    else { setShown(0); setPlaying(n => (n ?? 0) + 1); }
  }
  function previous() { if (playing !== null && playing > 0) { setShown(0); setPlaying(playing - 1); } }
  function handleKey(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === 'ArrowLeft') { event.preventDefault(); previous(); return; }
    if (event.key === 'ArrowRight') { event.preventDefault(); next(); return; }
    if ((event.target as HTMLElement).closest('button')) return;
    if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); next(); }
  }
  async function importFiles(files: File[]) {
    setDrag(false); setError('');
    if (files.length !== 1 || !/\.json$/i.test(files[0].name)) { setError('JSON 로그 파일 하나를 선택해 주세요. 이미지는 JSON 안에서 자동으로 불러옵니다.'); return; }
    const ticket = ++generation.current;
    const file = files[0];
    if (file.size > 100 * 1024 * 1024) { setError('이미지를 포함한 JSON은 100MB 이하로 선택해 주세요.'); return; }
    setLoading(true);
    try {
      const raw = await file.text();
      if (ticket !== generation.current) return;
      const parsed = parseLog(JSON.parse(raw.replace(/^\uFEFF/, '')));
      setMessages(parsed); setTitle(file.name.replace(/\.json$/i, ''));
      setChannel(null); setPlaying(null);
    } catch (e) {
      if (ticket === generation.current) setError(e instanceof SyntaxError ? 'JSON 형식을 읽을 수 없어요. 파일 내용을 확인해 주세요.' : e instanceof Error ? e.message : '파일을 읽지 못했어요.');
    } finally { if (ticket === generation.current) setLoading(false); }
  }
  return <div className="app" onDragOver={e => { e.preventDefault(); if (e.dataTransfer.types.includes('Files')) setDrag(true); }} onDrop={e => { e.preventDefault(); void importFiles(Array.from(e.dataTransfer.files)); }}>
    <header><a className="brand" href="./"><span className="brand-icon">▸</span> RE:PLAY<span className="brand-caption">로그에 다시 머무는 시간</span></a>
      <button className="import" disabled={loading} onClick={() => input.current?.click()}>＋ JSON 불러오기</button>
      <input ref={input} type="file" accept=".json,application/json" hidden onChange={e => { if (e.target.files?.length) void importFiles(Array.from(e.target.files)); e.target.value = ''; }} />
    </header>
    <main>
      <div className="eyebrow">YOUR STORY, ONCE MORE</div>
      <div className="title-line"><h1>{title}</h1></div>
      <p className="subtitle">함께 만든 이야기, 한 줄씩 다시 만나보세요.</p>
      <section className="upload-strip"><span className="file-icon">↥</span><div><strong>이야기를 여기에 놓아주세요</strong><p>JSON 하나로 대사, 스탠딩, 주사위 결과까지 함께 불러와요.</p></div><button disabled={loading} onClick={() => input.current?.click()}>파일 선택 ↗</button></section>
      {loading && <p role="status">로그와 이미지를 불러오는 중입니다…</p>}
      {error && <div className="error" role="alert">{error}<button aria-label="오류 닫기" onClick={() => setError('')}>×</button></div>}
      {messages.length > 0 && <><div className="toolbar"><div className="tabs" aria-label="채널">
        <button className={channel === null ? 'active' : ''} onClick={() => setChannel(null)}>전체 <span>{messages.length}</span></button>
        {channels.length > 1 && channels.map(c => <button key={c} className={channel === c ? 'active' : ''} onClick={() => setChannel(c)}>{c}</button>)}
      </div></div>
      <div className="reading-note"><span>☰ 채팅 로그</span><span>대사에 마우스를 올려 그 장면부터 재생하세요 ▷</span></div>
      <section className="log" aria-label="채팅 로그">{filtered.map((m, i) =>
        <article className={'message ' + (m.system ? 'system' : 'chat')} key={m.id} style={{ '--speaker': m.color } as CSSProperties}>
          {!m.system && <Portrait message={m} />}
          <div className="message-body">{!m.system && <div className="speaker">{m.name}<span>{m.channel !== 'main' ? m.channel : ''}</span></div>}<p>{m.text}</p><DiceResult message={m} /></div>
          <button className="play" onClick={() => start(i)} aria-label={m.name + '의 ' + (i + 1) + '번째 대사부터 재생'}>▷ 여기서 재생</button>
        </article>
      )}</section>
      <div className="end-mark"><span />이야기의 마지막 페이지<span /></div></>}
      <footer><span>RE:PLAY</span><p>파일은 서버로 전송되지 않으며, 새로고침하면 초기화됩니다.</p><span>LOCAL LOG VIEWER</span></footer>
    </main>
    {drag && <div className="drop-overlay" onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDrag(false); }}><div>＋<h2>JSON 파일을 놓아주세요</h2><p>이미지와 주사위 결과도 함께 불러옵니다.</p><button onClick={() => setDrag(false)}>닫기</button></div></div>}
    <dialog ref={dialog} className="player" onCancel={() => setPlaying(null)} onClose={() => setPlaying(null)} onKeyDown={handleKey} tabIndex={-1} aria-label="대사 재생">
      {current && <>
        <div className="player-top"><span>RE:PLAY <i>/</i> {title}</span><button onClick={() => setPlaying(null)} aria-label="재생 닫기">✕</button></div>
        <div className="stage"><span className="scene-label"> </span>{!current.system && <Portrait message={current} large />}
          <div className="dialogue" onClick={next}><span className="dialogue-name" style={{ color: current.color }}>{current.system ? '이야기' : current.name}</span><p>{characters.slice(0, shown).join('')}</p>{complete && <DiceResult message={current} />}<span className="advance-hint">{last && complete ? '마지막 대사 · 클릭하여 닫기' : '클릭하여 계속 ▾'}</span></div>
        </div>
        <div className="player-bottom"><button disabled={playing === 0} onClick={previous}>← 이전</button><span>{(playing ?? 0) + 1} <i>/ {filtered.length}</i></span><button onClick={next}>{last && complete ? '닫기 ✕' : '다음 →'}</button></div>
        <p className="keyboard-hint">← → 대사 이동 · Space 다음 / 전체 표시 · Esc 닫기</p>
      </>}
    </dialog>
  </div>;
}
