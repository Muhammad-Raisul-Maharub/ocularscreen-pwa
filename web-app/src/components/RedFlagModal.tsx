import { AlertTriangle, X, ShieldAlert, PhoneCall, CheckCircle2 } from 'lucide-react';

interface RedFlagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmNoRedFlags?: () => void;
}

export function RedFlagModal({
  isOpen,
  onClose,
  onConfirmNoRedFlags,
}: RedFlagModalProps) {
  if (!isOpen) return null;

  const redFlags = [
    {
      title: 'Severe Deep Eye Pain',
      description: 'Severe ache, headache with nausea, or pain radiating around the orbit (may indicate acute angle-closure glaucoma or scleritis).',
    },
    {
      title: 'Reduced Visual Acuity',
      description: 'Blurring that does not clear with blinking, sudden vision loss, or seeing halos around lights.',
    },
    {
      title: 'Marked Photophobia',
      description: 'Severe discomfort or inability to tolerate normal indoor room light (suggests corneal abrasion, ulcer, or anterior uveitis).',
    },
    {
      title: 'Chemical Injury or Penetrating Trauma',
      description: 'Any exposure to cleaning agents, acids, alkalis, battery fluid, or high-velocity projectile particles.',
    },
    {
      title: 'Corneal Clouding or Irregular Pupil',
      description: 'Hazy cornea, visible white/gray infiltrate, or a pupil that is unreactive or asymmetrical.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-red-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-red-950/40 border-b border-red-500/20">
          <div className="flex items-center gap-2.5 text-red-400">
            <div className="p-1.5 rounded-lg bg-red-500/20 text-red-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="font-bold text-base text-white tracking-tight">
              Ophthalmic Red Flag Triage
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all duration-150 active:scale-[0.98] min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Close Red Flag Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-200 leading-relaxed">
              If any of the following symptoms are present, <strong className="font-semibold text-white">do not rely on an automated screening app</strong>. 
              Immediate clinical intervention in an emergency ophthalmic department or urgent care center is required.
            </p>
          </div>

          <div className="space-y-2.5">
            {redFlags.map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <h4 className="text-xs font-semibold text-red-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  {item.title}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-normal pl-3">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-800/40 rounded-xl flex items-center gap-3 border border-slate-700/40">
            <PhoneCall className="w-4 h-4 text-clinical-400 shrink-0" />
            <span className="text-xs text-slate-300">
              In an ocular emergency, contact emergency medical services or visit the nearest eye emergency room immediately.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-950/60 border-t border-slate-800 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-all duration-150 active:scale-[0.98] min-h-[44px] flex items-center justify-center"
          >
            Close
          </button>
          <button
            onClick={() => {
              if (onConfirmNoRedFlags) onConfirmNoRedFlags();
              onClose();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-clinical-600 hover:bg-clinical-500 text-white rounded-lg text-xs font-semibold shadow transition-all duration-150 active:scale-[0.98] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-cyan-500 min-h-[44px]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm No Red Flags Present</span>
          </button>
        </div>
      </div>
    </div>
  );
}
