import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  QUANTITIES,
  type QuantityDef,
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


function defOf(q: QuantityId, unitId: string) {
  const def = QUANTITIES[q] as unknown as QuantityDef;
  return def.units.find((u) => u.id === unitId) ?? def.units[0]!;
}

function trim(v: number) {
  if (!Number.isFinite(v)) return "";
  const abs = Math.abs(v);
  const digits = abs >= 100 ? 2 : abs >= 1 ? 3 : 6;
  return String(Number(v.toFixed(digits)));
}

/**
 * A numeric input bound to the user's preferred unit for a quantity.
 * Keeps the typed text, exposes the SI value, and re-expresses the number
 * automatically when the unit preference changes.
 */
export function useUnitValue(q: QuantityId, initialSI: number) {
  const { prefs, label } = useUnits();
  const unitId = prefs[q];
  const [text, setText] = useState(() => trim(defOf(q, serverPrefs[q]).fromBase(initialSI)));
  const prev = useRef(serverPrefs[q]);

  useEffect(() => {
    if (prev.current === unitId) return;
    const si = defOf(q, prev.current).toBase(Number(text));
    prev.current = unitId;
    if (Number.isFinite(si)) setText(trim(defOf(q, unitId).fromBase(si)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitId]);

  const si = defOf(q, unitId).toBase(Number(text));
  /** Set the field from an SI value (used by presets and sliders). */
  const setFromSI = (value: number) => setText(trim(defOf(q, unitId).fromBase(value)));

  return { text, setText, si, setFromSI, unit: label(q) };
}
