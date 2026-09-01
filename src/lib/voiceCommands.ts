import type { Piece } from '@/types';

export interface VoiceCommandResult {
  type: 'add' | 'unknown';
  piece?: Partial<Piece> & { quantity?: number };
  rawText: string;
}

const NUMBER_WORDS: Record<string, number> = {
  cero: 0, uno: 1, un: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5,
  seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12,
  trece: 13, catorce: 14, quince: 15, dieciséis: 16, diecisiete: 17,
  dieciocho: 18, diecinueve: 19, veinte: 20, treinta: 30, cuarenta: 40,
  cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90,
};

function wordToNumber(text: string): number | null {
  const direct = parseInt(text, 10);
  if (!isNaN(direct)) return direct;
  const lower = text.toLowerCase().trim();
  if (NUMBER_WORDS[lower] !== undefined) return NUMBER_WORDS[lower];
  return null;
}

/**
 * Parses voice commands for adding pieces.
 * Expected format: "[label] de [width] x [height] cantidad [quantity]"
 * Examples:
 *   "piso de 600 x 300 cantidad 2"
 *   "repisa de 800 por 400 cantidad 5"
 *   "lateral de 1200 x 600"
 *   "estante 600 x 300 cantidad tres"
 */
export function parseVoiceCommand(text: string): VoiceCommandResult {
  const lower = text.toLowerCase().trim();
  const rawText = text;

  // Extract quantity: "cantidad 2", "cantidad dos", "cantidad de 2"
  let quantity = 1;
  const qtyPatterns = [
    /cantidad\s+(?:de\s+)?(\d+)/i,
    /cantidad\s+(?:de\s+)?(cero|uno|un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|dieciséis|diecisiete|dieciocho|diecinueve|veinte|treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa)/i,
  ];
  for (const pattern of qtyPatterns) {
    const match = lower.match(pattern);
    if (match) {
      const n = wordToNumber(match[1]);
      if (n !== null && n > 0) {
        quantity = n;
        break;
      }
    }
  }

  // Remove "cantidad [de] X" from text to simplify dimension/label extraction
  const withoutQty = lower
    .replace(/cantidad\s+(?:de\s+)?(?:\d+|cero|uno|un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|dieciséis|diecisiete|dieciocho|diecinueve|veinte|treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa)/i, '')
    .trim();

  // Extract dimensions: "600 x 300", "600 por 300", "600 equis 300"
  const dimMatch = withoutQty.match(/(\d+)\s*(?:x|por|equis|multiplicado por)\s*(\d+)/i);
  if (!dimMatch) {
    return { type: 'unknown', rawText };
  }

  const width = parseInt(dimMatch[1], 10);
  const height = parseInt(dimMatch[2], 10);

  if (width <= 0 || height <= 0) {
    return { type: 'unknown', rawText };
  }

  // Extract label: everything before the first number in the dimensions
  const dimStartIndex = withoutQty.indexOf(dimMatch[1]);
  let label = withoutQty.substring(0, dimStartIndex).trim();

  // Remove common connector words: "de", "pieza", "agregar", "añadir"
  label = label
    .replace(/^(?:agregar|añadir|sumar|nueva pieza|pieza|colocar)\s+/i, '')
    .replace(/\s+de$/i, '')
    .replace(/^de\s+/i, '')
    .trim();

  if (!label) {
    label = `Pieza ${width}x${height}`;
  }

  return {
    type: 'add',
    piece: {
      label,
      width,
      height,
      quantity,
    },
    rawText,
  };
}
