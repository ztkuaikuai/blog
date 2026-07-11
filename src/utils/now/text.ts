export interface TelegramEntity {
  type: string;
  offset: number;
  length: number;
  url?: string;
}

export interface NormalizedNowText {
  displayText: string;
  displayEntities: TelegramEntity[];
}

const NOW_TAG = /#now\b/gi;

export function normalizeNowText(rawText: string, entities: TelegramEntity[] = []): NormalizedNowText | undefined {
  const removals = Array.from(rawText.matchAll(NOW_TAG), (match) => ({
    start: match.index,
    end: match.index + match[0].length,
  }));
  if (removals.length === 0) return undefined;

  let displayText = rawText;
  for (const removal of [...removals].reverse()) {
    displayText = displayText.slice(0, removal.start) + displayText.slice(removal.end);
  }
  const leadingWhitespace = displayText.length - displayText.trimStart().length;
  displayText = displayText.trim();
  if (!displayText) return undefined;

  const displayEntities = entities.flatMap((entity) => {
    const entityEnd = entity.offset + entity.length;
    if (removals.some(({ start, end }) => entity.offset < end && entityEnd > start)) return [];
    const removedBefore = removals.reduce(
      (total, { start, end }) => total + (end <= entity.offset ? end - start : 0),
      0,
    );
    return [{ ...entity, offset: entity.offset - removedBefore - leadingWhitespace }];
  }).filter((entity) => entity.offset >= 0 && entity.offset + entity.length <= displayText.length);

  return { displayText, displayEntities };
}
