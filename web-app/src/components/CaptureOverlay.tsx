import { Focus, Eye } from 'lucide-react';

interface CaptureOverlayProps {
  isCapturing?: boolean;
}

export function CaptureOverlay({ isCapturing }: CaptureOverlayProps) {
  return (
    <div className={`absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-4 z-10 select-none transition-all duration-150 ${isCapturing ? 'bg-white/30' : ''}`}>
      {/* Top Banner Guide */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs shadow-lg">
        <Focus className="w-3.5 h-3.5 text-clinical-400 animate-spin" style={{ animationDuration: '6s' }} />
        <span>Center Anterior Segment in Target</span>
      </div>

      {/* Center Reticle Guide */}
      <div className="relative w-64 h-44 sm:w-80 sm:h-52 flex items-center justify-center">
        {/* Animated outer ring */}
        <div className="absolute inset-0 rounded-[45%] border-2 border-dashed border-clinical-400/40 animate-pulse-ring" />

        {/* Outer Eye Outline */}
        <div className={`absolute inset-2 rounded-[50%] border-2 transition-colors duration-200 ${isCapturing ? 'border-white ring-4 ring-clinical-400' : 'border-clinical-400/70 shadow-[0_0_15px_rgba(20,184,166,0.3)]'} flex items-center justify-center`}>
          {/* Subtle scanning light bar */}
          <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-clinical-300 to-transparent animate-scan-line" />

          {/* Central Cornea/Pupil Circle */}
          <div className="w-16 h-16 rounded-full border border-clinical-300/60 flex items-center justify-center">
            {/* Center crosshair */}
            <div className="w-2 h-2 rounded-full bg-clinical-400 shadow-[0_0_8px_#2dd4bf]" />
          </div>

          {/* Nasal / Temporal Sclera Indicators */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-mono uppercase tracking-widest text-clinical-300/70">
            Sclera
          </div>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-mono uppercase tracking-widest text-clinical-300/70">
            Sclera
          </div>
        </div>

        {/* 4 Corner Markers */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-clinical-400" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-clinical-400" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-clinical-400" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-clinical-400" />
      </div>

      {/* Bottom Hint */}
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/50 text-[11px] text-slate-300 backdrop-blur-sm border border-white/5">
        <Eye className="w-3.5 h-3.5 text-clinical-400" />
        <span>Keep eye wide open & avoid direct flash reflection</span>
      </div>
    </div>
  );
}
