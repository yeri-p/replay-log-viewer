export type Roll = { result: string; outcome: 'critical' | 'fumble' | 'success' | 'failure' | 'neutral' };
export type Message = { id: number; name: string; text: string; color: string; channel: string; system: boolean; image?: string; roll?: Roll };
const record = (v: unknown): Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {};
export function parseLog(input: unknown): Message[] {
  const root = record(input);
  const rows = Array.isArray(input) ? input : root.messages;
  if (!Array.isArray(rows)) throw new Error('messages 배열이 있는 JSON을 선택해 주세요.');
  if (rows.length > 50000) throw new Error('메시지는 최대 50,000개까지 불러올 수 있어요.');
  const images = record(root.images);
  const safeImages = new Map<string, string | undefined>();
  const resolveImage = (key: unknown) => {
    if (typeof key !== 'string' || !Object.hasOwn(images, key)) return undefined;
    if (!safeImages.has(key)) {
      const value = images[key];
      safeImages.set(key, typeof value === 'string' && /^data:image\/(png|jpeg|jpg|webp|gif);base64,[a-z0-9+/=\r\n]+$/i.test(value) ? value : undefined);
    }
    return safeImages.get(key);
  };
  const messages: Message[] = [];
  rows.forEach((value, id) => {
    const r = record(value), rawRoll = record(record(r.extend).roll);
    const text = typeof r.text === 'string' ? r.text : '';
    const result = typeof rawRoll.result === 'string' ? rawRoll.result : '';
    if (!text.trim() && !result.trim()) return;
    const roll: Roll | undefined = result ? { result, outcome: rawRoll.critical === true ? 'critical' : rawRoll.fumble === true ? 'fumble' : rawRoll.success === true ? 'success' : rawRoll.failure === true ? 'failure' : 'neutral' } : undefined;
    messages.push({ id, name: typeof r.name === 'string' && r.name.trim() ? r.name : '이름 없음', text,
      color: typeof r.color === 'string' && /^(#[0-9a-f]{3}|#[0-9a-f]{6})$/i.test(r.color) ? r.color : '#657968',
      channel: typeof r.channelName === 'string' ? r.channelName : typeof r.channel === 'string' ? r.channel : 'main',
      system: r.type === 'system', image: resolveImage(r.iconImage), roll });
  });
  if (!messages.length) throw new Error('표시할 메시지가 없어요.');
  return messages;
}
