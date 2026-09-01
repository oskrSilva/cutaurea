import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Scissors,
  Ruler,
  Sparkles,
  Save,
  FolderOpen,
  Trash,
  X,
  Layers,
  Loader2,
} from 'lucide-react';
import type { Piece, BoardConfig, CutResult, CutProject } from '@/types';
import { optimizeCuts } from '@/lib/packing';
import { parseVoiceCommand } from '@/lib/voiceCommands';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { supabase } from '@/lib/supabase';
import { BoardVisualizer } from '@/components/BoardVisualizer';
import { PieceList } from '@/components/PieceList';
import { AddPieceForm } from '@/components/AddPieceForm';
import { VoiceControl } from '@/components/VoiceControl';
import { StatsPanel } from '@/components/StatsPanel';

const DEFAULT_CONFIG: BoardConfig = {
  width: 2440,
  height: 1220,
  kerf: 3,
};

const VOICE_FEEDBACK_TIMEOUT = 3500;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function App() {
  const [config, setConfig] = useState<BoardConfig>(DEFAULT_CONFIG);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [result, setResult] = useState<CutResult | null>(null);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const [projects, setProjects] = useState<CutProject[]>([]);
  const [showProjects, setShowProjects] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Proyecto sin nombre');
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFeedback = useCallback((msg: string) => {
    setVoiceFeedback(msg);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => setVoiceFeedback(null), VOICE_FEEDBACK_TIMEOUT);
  }, []);

  const handleVoiceCommand = useCallback(
    (text: string) => {
      const cmd = parseVoiceCommand(text);

      if (cmd.type === 'add' && cmd.piece?.width && cmd.piece?.height) {
        const newPiece: Piece = {
          id: generateId(),
          label: cmd.piece.label || `Pieza ${cmd.piece.width}x${cmd.piece.height}`,
          width: cmd.piece.width,
          height: cmd.piece.height,
          quantity: cmd.piece.quantity ?? 1,
        };
        setPieces((prev) => [...prev, newPiece]);
        showFeedback(
          `Agregada: ${newPiece.label} ${newPiece.width}x${newPiece.height}mm (${newPiece.quantity}u)`
        );
      } else if (text.trim().length > 0) {
        showFeedback(`No se reconoció: "${text}"`);
      }
    },
    [showFeedback]
  );

  const voice = useVoiceRecognition(handleVoiceCommand);

  const handleAddPiece = useCallback((piece: Omit<Piece, 'id'>) => {
    setPieces((prev) => [...prev, { ...piece, id: generateId() }]);
  }, []);

  const handleRemovePiece = useCallback((id: string) => {
    setPieces((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleUpdateQuantity = useCallback((id: string, delta: number) => {
    setPieces((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, quantity: Math.max(1, p.quantity + delta) } : p
      )
    );
  }, []);

  const handleOptimize = useCallback(() => {
    if (pieces.length === 0) return;
    setResult(optimizeCuts(pieces, config));
  }, [pieces, config]);

  const totalPieces = useMemo(
    () => pieces.reduce((sum, p) => sum + p.quantity, 0),
    [pieces]
  );

  // Load saved projects
  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const { data, error } = await supabase
        .from('cut_projects')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setProjects((data as CutProject[]) ?? []);
    } catch (err) {
      showFeedback('Error al cargar proyectos');
    } finally {
      setLoadingProjects(false);
    }
  }, [showFeedback]);

  const handleSaveProject = useCallback(async () => {
    setSaving(true);
    try {
      const payload = {
        name: projectName,
        board_width: config.width,
        board_height: config.height,
        kerf: config.kerf,
        pieces: pieces as unknown as Record<string, unknown>[],
      };

      if (currentProjectId) {
        const { error } = await supabase
          .from('cut_projects')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', currentProjectId);
        if (error) throw error;
        showFeedback('Proyecto actualizado');
      } else {
        const { data, error } = await supabase
          .from('cut_projects')
          .insert(payload)
          .select('id')
          .single();
        if (error) throw error;
        setCurrentProjectId(data.id);
        showFeedback('Proyecto guardado');
      }
    } catch {
      showFeedback('Error al guardar el proyecto');
    } finally {
      setSaving(false);
    }
  }, [projectName, config, pieces, currentProjectId, showFeedback]);

  const handleLoadProject = useCallback((proj: CutProject) => {
    setProjectName(proj.name);
    setConfig({ width: proj.board_width, height: proj.board_height, kerf: proj.kerf });
    setPieces(proj.pieces ?? []);
    setCurrentProjectId(proj.id);
    setResult(null);
    setShowProjects(false);
  }, []);

  const handleNewProject = useCallback(() => {
    setProjectName('Proyecto sin nombre');
    setPieces([]);
    setConfig(DEFAULT_CONFIG);
    setResult(null);
    setCurrentProjectId(null);
  }, []);

  const handleDeleteProject = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase.from('cut_projects').delete().eq('id', id);
        if (error) throw error;
        setProjects((prev) => prev.filter((p) => p.id !== id));
        if (currentProjectId === id) {
          handleNewProject();
        }
      } catch {
        showFeedback('Error al eliminar proyecto');
      }
    },
    [currentProjectId, handleNewProject, showFeedback]
  );

  useEffect(() => {
    if (showProjects) {
      loadProjects();
    }
  }, [showProjects, loadProjects]);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">
                Cortemel
              </h1>
              <p className="text-[11px] text-slate-500 leading-tight hidden sm:block">
                Optimización de cortes de melamina por voz
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="hidden md:block w-48 px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
              placeholder="Nombre del proyecto"
            />
            <button
              onClick={handleSaveProject}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span className="hidden sm:inline">Guardar</span>
            </button>
            <button
              onClick={() => setShowProjects(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <FolderOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Abrir</span>
            </button>
            <button
              onClick={handleNewProject}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Nuevo</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: configuration + voice + pieces */}
          <div className="lg:col-span-1 space-y-4">
            {/* Board configuration */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Ruler className="w-4 h-4 text-teal-600" />
                Configuración de placa
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] text-slate-500 mb-1 block">Ancho (mm)</label>
                  <input
                    type="number"
                    value={config.width}
                    onChange={(e) => setConfig((prev) => ({ ...prev, width: parseInt(e.target.value) || 0 }))}
                    className="w-full px-2 py-2 text-sm rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                    min={1}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 mb-1 block">Largo (mm)</label>
                  <input
                    type="number"
                    value={config.height}
                    onChange={(e) => setConfig((prev) => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
                    className="w-full px-2 py-2 text-sm rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                    min={1}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 mb-1 block flex items-center gap-0.5">
                    <Scissors className="w-3 h-3" />
                    Corte
                  </label>
                  <input
                    type="number"
                    value={config.kerf}
                    onChange={(e) => setConfig((prev) => ({ ...prev, kerf: parseInt(e.target.value) || 0 }))}
                    className="w-full px-2 py-2 text-sm rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                    min={0}
                  />
                </div>
              </div>
            </section>

            {/* Voice control */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                Entrada por voz
              </h3>
              <VoiceControl
                onCommand={handleVoiceCommand}
                transcript={voice.transcript}
                interimTranscript={voice.interimTranscript}
                listening={voice.listening}
                error={voice.error}
                supported={voice.supported}
                onToggle={voice.toggle}
                onClear={voice.clearTranscript}
              />
              {voiceFeedback && (
                <div className="mt-3 p-2.5 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-700 font-medium animate-fade-in">
                  {voiceFeedback}
                </div>
              )}
            </section>

            {/* Add piece form */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-600" />
                Agregar pieza manualmente
              </h3>
              <AddPieceForm onAdd={handleAddPiece} />
            </section>

            {/* Piece list */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                Piezas ({pieces.length})
              </h3>
              <PieceList
                pieces={pieces}
                onRemove={handleRemovePiece}
                onUpdateQuantity={handleUpdateQuantity}
              />
            </section>
          </div>

          {/* Right column: results */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Plan de corte</h2>
              <button
                onClick={handleOptimize}
                disabled={pieces.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white text-sm font-medium rounded-lg shadow-lg shadow-teal-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                <Sparkles className="w-4 h-4" />
                Optimizar cortes
              </button>
            </div>

            {result && result.boards.length > 0 ? (
              <>
                <StatsPanel result={result} config={config} totalPieces={totalPieces} />
                <div className="space-y-4">
                  {result.boards.map((board, i) => (
                    <BoardVisualizer
                      key={i}
                      board={board}
                      boardWidth={config.width}
                      boardHeight={config.height}
                      boardIndex={i}
                      totalBoards={result.totalBoards}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                  <Scissors className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-base font-semibold text-slate-600 mb-1">
                  Sin plan de corte
                </h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto">
                  Agrega piezas por voz o manualmente y pulsa "Optimizar cortes" para ver el layout de cada placa.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Projects modal */}
      {showProjects && (
        <div className="fixed inset-0 z-30 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-800">Proyectos guardados</h2>
              <button
                onClick={() => setShowProjects(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              {loadingProjects ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                </div>
              ) : projects.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-8">
                  No hay proyectos guardados todavía.
                </p>
              ) : (
                <ul className="space-y-2">
                  {projects.map((proj) => {
                    const totalP = (proj.pieces ?? []).reduce((s, p) => s + p.quantity, 0);
                    return (
                      <li
                        key={proj.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-teal-300 hover:bg-teal-50/50 transition-all cursor-pointer group"
                        onClick={() => handleLoadProject(proj)}
                      >
                        <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                          <Layers className="w-5 h-5 text-teal-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-700 truncate">
                            {proj.name}
                          </div>
                          <div className="text-xs text-slate-400">
                            {proj.board_width}×{proj.board_height}mm · {totalP} piezas
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(proj.id);
                          }}
                          className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
