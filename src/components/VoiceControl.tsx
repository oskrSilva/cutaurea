import { Mic, MicOff, Square, Volume2, AlertCircle, Trash2 } from 'lucide-react';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';

interface VoiceControlProps {
  onCommand: (text: string) => void;
  transcript: string;
  interimTranscript: string;
  listening: boolean;
  error: string | null;
  supported: boolean;
  onToggle: () => void;
  onClear: () => void;
}

export function VoiceControl({
  transcript,
  interimTranscript,
  listening,
  error,
  supported,
  onToggle,
  onClear,
}: VoiceControlProps) {
  if (!supported) {
    return (
      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>
          Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge para agregar piezas por voz.
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          onClick={onToggle}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
            listening
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20'
              : 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20'
          }`}
        >
          {listening ? (
            <>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
              Detener voz
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" />
              Hablar piezas
            </>
          )}
        </button>
        {transcript && (
          <button
            onClick={onClear}
            className="px-3 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
            aria-label="Limpiar transcripción"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {(transcript || interimTranscript) && (
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 min-h-[60px]">
          <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
            <Volume2 className="w-3 h-3" />
            Transcripción
          </div>
          <p className="text-sm text-slate-700">
            {transcript}
            {interimTranscript && (
              <span className="text-slate-400 italic"> {interimTranscript}</span>
            )}
          </p>
        </div>
      )}

      <div className="text-[11px] text-slate-400 leading-relaxed">
        <p className="font-medium text-slate-500 mb-1">Ejemplo de voz:</p>
        <ul className="space-y-0.5">
          <li>• "piso de 600 x 300 cantidad 2"</li>
          <li>• "repisa de 800 por 400 cantidad 5"</li>
          <li>• "lateral de 1200 x 600"</li>
        </ul>
      </div>
    </div>
  );
}
