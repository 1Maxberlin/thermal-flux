import { useCallback, useSyncExternalStore } from "react";
import {
  getUnitPrefs,
  setUnitPrefs,
  subscribeUnits,
  unitDef,
  presetFor,
  activeSystem,
  type QuantityId,
  type SystemId,
  type UnitPrefs,
} from "@/lib/units";

const serverPrefs = presetFor("si");

/**
 * Read the user's unit preferences and convert between SI (used by all physics)
 * and the display units they picked on the Units page.
 */
export function useUnits() {
  const prefs = useSyncExternalStore(subscribeUnits, getUnitPrefs, () => serverPrefs);

  /** SI base value -> display value. */
  const to = useCallback((q: QuantityId, si: number) => unitDef(q, prefs).fromBase(si), [prefs]);
  /** Display value -> SI base value. */
  const from = useCallback((q: QuantityId, v: number) => unitDef(q, prefs).toBase(v), [prefs]);
  /** Symbol for the active unit of a quantity. */
  const label = useCallback((q: QuantityId) => unitDef(q, prefs).label, [prefs]);
  /** Formatted display value (no unit appended). */
  const fmt = useCallback(
    (q: QuantityId, si: number, digits = 3) => {
      const v = unitDef(q, prefs).fromBase(si);
      if (!Number.isFinite(v)) return "—";
      const abs = Math.abs(v);
      if (abs !== 0 && (abs >= 1e6 || abs < 1e-3)) return v.toExponential(2);
      return v.toLocaleString(undefined, { maximumFractionDigits: digits });
    },
    [prefs],
  );

  return { prefs, to, from, label, fmt, system: activeSystem(prefs) };
}

export function applyUnitSystem(system: SystemId) {
  setUnitPrefs(presetFor(system));
}

export function setUnit(q: QuantityId, unitId: string) {
  const next: UnitPrefs = { ...getUnitPrefs(), [q]: unitId };
  setUnitPrefs(next);
}
