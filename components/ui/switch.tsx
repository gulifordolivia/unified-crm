"use client";

type SwitchProps = {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

export function Switch({ checked = false, onCheckedChange }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange?.(!checked)}
      className={`pressable relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition duration-200 ${
        checked ? "border-zinc-950 bg-zinc-950" : "border-zinc-300 bg-zinc-200"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
