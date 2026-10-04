import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { inputClass } from './FormField';

/*
 * Date and month pickers in the site's own style, in place of
 * <input type="date"> / <input type="month">, whose calendar pop-ups the
 * browser draws and CSS can't reach. Values keep the same text formats
 * ('YYYY-MM-DD' and 'YYYY-MM') as calendar days, with no time zone involved.
 */

const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/** A calendar day; `m` is 0-based like Date. */
type Day = { y: number; m: number; d: number };

const pad = (n: number) => String(n).padStart(2, '0');
const dayValue = ({ y, m, d }: Day) => `${y}-${pad(m + 1)}-${pad(d)}`;
const monthValue = (y: number, m: number) => `${y}-${pad(m + 1)}`;
const sameDay = (a: Day | null, b: Day | null) => !!a && !!b && a.y === b.y && a.m === b.m && a.d === b.d;

function toDay(date: Date): Day {
  return { y: date.getFullYear(), m: date.getMonth(), d: date.getDate() };
}
function addDays(day: Day, n: number): Day {
  return toDay(new Date(day.y, day.m, day.d + n));
}
/** Same day number in another month, clamped to that month's length (Jan 31 + 1 month -> Feb 28). */
function addMonths(day: Day, n: number): Day {
  const first = new Date(day.y, day.m + n, 1);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  return { y: first.getFullYear(), m: first.getMonth(), d: Math.min(day.d, last) };
}
function parseDay(value: string): Day | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? { y: Number(match[1]), m: Number(match[2]) - 1, d: Number(match[3]) } : null;
}
function parseMonth(value: string): { y: number; m: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  return match ? { y: Number(match[1]), m: Number(match[2]) - 1 } : null;
}

const triggerClass = `${inputClass} flex items-center justify-between gap-2 text-left`;
const navButtonClass =
  'rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 dark:hover:bg-slate-800 dark:hover:text-slate-200';
const footerButtonClass =
  'rounded-lg px-2 py-1 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50';
const cellFocusClass = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60';

/** Classes for a day or month cell by state: selected, current (today / this month), outside the month, or plain. */
function cellClass({ selected, current, muted }: { selected: boolean; current: boolean; muted?: boolean }) {
  if (selected) return 'bg-brand-500 font-semibold text-white hover:bg-brand-600';
  if (current) return 'font-semibold text-brand-600 ring-1 ring-inset ring-brand-500/40 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-500/10';
  if (muted) return 'text-slate-300 hover:bg-slate-100 dark:text-slate-600 dark:hover:bg-slate-800';
  return 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800';
}

/**
 * Floating panel under (or, without room, above) the trigger. Rendered into
 * <body>, so a click inside it can't re-trigger the surrounding <label>.
 * Escape closes only this panel, not a modal it was opened from.
 */
function Popover({
  anchor,
  label,
  onClose,
  children,
}: {
  anchor: HTMLElement;
  label: string;
  onClose: (returnFocus: boolean) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    function place() {
      const panel = ref.current;
      if (!panel) return;
      const a = anchor.getBoundingClientRect();
      const gap = 6;
      const margin = 8;
      let top = a.bottom + gap;
      if (top + panel.offsetHeight > window.innerHeight - margin && a.top - gap - panel.offsetHeight >= margin) {
        top = a.top - gap - panel.offsetHeight;
      }
      const left = Math.min(Math.max(a.left, margin), window.innerWidth - panel.offsetWidth - margin);
      setPosition({ top, left });
    }
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [anchor]);

  useEffect(() => {
    function handlePointer(e: PointerEvent) {
      const target = e.target as Node;
      if (!ref.current?.contains(target) && !anchor.contains(target)) onClose(false);
    }
    function handleKey(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        onClose(true);
      }
    }
    document.addEventListener('pointerdown', handlePointer);
    window.addEventListener('keydown', handleKey, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointer);
      window.removeEventListener('keydown', handleKey, true);
    };
  }, [anchor, onClose]);

  return createPortal(
    <div
      ref={ref}
      // Hidden by opacity, not visibility, while it measures its position:
      // a visibility-hidden calendar can't take focus when it opens.
      role="dialog"
      aria-label={label}
      style={{ position: 'fixed', top: position?.top ?? 0, left: position?.left ?? 0, opacity: position ? 1 : 0 }}
      className="z-[70] w-72 animate-pop-in overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 text-slate-700 shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:shadow-black/50"
    >
      {children}
    </div>,
    document.body
  );
}

function PanelFooter({ left, right }: { left?: ReactNode; right: ReactNode }) {
  return (
    <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-800">
      <div>{left}</div>
      {right}
    </div>
  );
}

/**
 * 4 x 3 grid of months with a year header. Arrow keys move by one month or
 * one row (3 months), crossing into the next or previous year.
 */
function MonthGrid({
  year,
  setYear,
  selected,
  onPick,
  title,
}: {
  year: number;
  setYear: (year: number) => void;
  selected: { y: number; m: number } | null;
  onPick: (y: number, m: number) => void;
  title?: ReactNode;
}) {
  const now = new Date();
  const [focused, setFocused] = useState(() => (selected && selected.y === year ? selected.m : year === now.getFullYear() ? now.getMonth() : 0));
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-month="${year}-${focused}"]`)?.focus();
  }, [year, focused]);

  function handleKey(e: KeyboardEvent) {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3 }[e.key];
    if (step === undefined) return;
    e.preventDefault();
    const next = focused + step;
    if (next < 0) setYear(year - 1);
    if (next > 11) setYear(year + 1);
    setFocused((next + 12) % 12);
  }

  return (
    <>
      <div className="mb-2 flex items-center justify-between">
        {title ?? <span className="px-2 font-display text-sm font-semibold text-slate-900 dark:text-white">{year}</span>}
        <div className="flex gap-1">
          <button type="button" onClick={() => setYear(year - 1)} className={navButtonClass} aria-label="Previous year">
            <ChevronLeft size={16} />
          </button>
          <button type="button" onClick={() => setYear(year + 1)} className={navButtonClass} aria-label="Next year">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div ref={gridRef} className="grid grid-cols-3 gap-1" onKeyDown={handleKey}>
        {MONTHS_SHORT.map((name, m) => (
          <button
            key={name}
            type="button"
            data-month={`${year}-${m}`}
            tabIndex={m === focused ? 0 : -1}
            onClick={() => onPick(year, m)}
            aria-label={`${MONTHS_LONG[m]} ${year}`}
            aria-pressed={selected?.y === year && selected.m === m}
            className={`h-10 rounded-lg text-sm transition-colors ${cellFocusClass} ${cellClass({
              selected: selected?.y === year && selected.m === m,
              current: now.getFullYear() === year && now.getMonth() === m,
            })}`}
          >
            {name}
          </button>
        ))}
      </div>
    </>
  );
}

function CalendarPanel({
  selected,
  onSelect,
  onClear,
}: {
  selected: Day | null;
  onSelect: (value: string) => void;
  onClear?: () => void;
}) {
  const today = toDay(new Date());
  const [focused, setFocused] = useState<Day>(selected ?? today);
  const [view, setView] = useState<{ y: number; m: number }>({ y: (selected ?? today).y, m: (selected ?? today).m });
  const [mode, setMode] = useState<'days' | 'months'>('days');
  // Which way the days slide in after a month change (null = no slide, e.g. on open).
  const [slide, setSlide] = useState<'left' | 'right' | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode === 'days') gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${dayValue(focused)}"]`)?.focus();
  }, [focused, mode]);

  function moveFocus(next: Day) {
    const delta = next.y * 12 + next.m - (view.y * 12 + view.m);
    if (delta !== 0) setSlide(delta > 0 ? 'right' : 'left');
    setFocused(next);
    setView({ y: next.y, m: next.m });
  }

  function handleKey(e: KeyboardEvent) {
    const moves: Record<string, () => Day> = {
      ArrowLeft: () => addDays(focused, -1),
      ArrowRight: () => addDays(focused, 1),
      ArrowUp: () => addDays(focused, -7),
      ArrowDown: () => addDays(focused, 7),
      PageUp: () => addMonths(focused, -1),
      PageDown: () => addMonths(focused, 1),
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    moveFocus(move());
  }

  function showMonth(offset: number) {
    const target = addMonths({ y: view.y, m: view.m, d: focused.d }, offset);
    setSlide(offset > 0 ? 'right' : 'left');
    setView({ y: target.y, m: target.m });
    setFocused(target);
  }

  // Six full weeks, starting on the Sunday on or before the 1st.
  const first = new Date(view.y, view.m, 1);
  const start = addDays(toDay(first), -first.getDay());
  const cells = Array.from({ length: 42 }, (_, i) => addDays(start, i));

  const title = (
    <button
      type="button"
      onClick={() => setMode(mode === 'days' ? 'months' : 'days')}
      aria-label={mode === 'days' ? 'Choose month and year' : 'Back to days'}
      className="flex items-center gap-1 rounded-lg px-2 py-1 font-display text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 dark:text-white dark:hover:bg-slate-800"
    >
      {mode === 'days' ? `${MONTHS_LONG[view.m]} ${view.y}` : view.y}
      <ChevronDown size={14} className={`text-slate-400 transition-transform ${mode === 'months' ? 'rotate-180' : ''}`} aria-hidden="true" />
    </button>
  );

  return (
    <>
      {mode === 'months' ? (
        <MonthGrid
          year={view.y}
          setYear={(y) => setView({ ...view, y })}
          selected={{ y: view.y, m: view.m }}
          title={title}
          onPick={(y, m) => {
            const target = addMonths({ y, m, d: focused.d }, 0);
            setView({ y, m });
            setFocused(target);
            setMode('days');
          }}
        />
      ) : (
        <>
          <div className="mb-2 flex items-center justify-between">
            {title}
            <div className="flex gap-1">
              <button type="button" onClick={() => showMonth(-1)} className={navButtonClass} aria-label="Previous month">
                <ChevronLeft size={16} />
              </button>
              <button type="button" onClick={() => showMonth(1)} className={navButtonClass} aria-label="Next month">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {WEEKDAYS.map((w) => (
              <span key={w} className="py-1 text-center text-[11px] font-medium text-slate-400 dark:text-slate-500" aria-hidden="true">
                {w}
              </span>
            ))}
          </div>
          <div
            key={`${view.y}-${view.m}`}
            ref={gridRef}
            className={`grid grid-cols-7 gap-0.5 ${slide === 'right' ? 'animate-slide-from-right' : slide === 'left' ? 'animate-slide-from-left' : ''}`}
            onKeyDown={handleKey}
          >
            {cells.map((day) => {
              const value = dayValue(day);
              const isSelected = sameDay(day, selected);
              return (
                <button
                  key={value}
                  type="button"
                  data-day={value}
                  tabIndex={sameDay(day, focused) ? 0 : -1}
                  onClick={() => onSelect(value)}
                  aria-label={`${MONTHS_LONG[day.m]} ${day.d}, ${day.y}`}
                  aria-pressed={isSelected}
                  aria-current={sameDay(day, today) ? 'date' : undefined}
                  className={`h-9 rounded-lg text-sm tabular-nums transition-colors ${cellFocusClass} ${cellClass({
                    selected: isSelected,
                    current: sameDay(day, today),
                    muted: day.m !== view.m,
                  })}`}
                >
                  {day.d}
                </button>
              );
            })}
          </div>
        </>
      )}

      <PanelFooter
        left={
          onClear && (
            <button
              type="button"
              onClick={onClear}
              className={`${footerButtonClass} text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200`}
            >
              Clear
            </button>
          )
        }
        right={
          <button
            type="button"
            onClick={() => onSelect(dayValue(today))}
            className={`${footerButtonClass} text-brand-600 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-500/10`}
          >
            Today
          </button>
        }
      />
    </>
  );
}

/** Opening state shared by both pickers: the trigger element, and closing with focus sent back to it. */
function usePickerState() {
  const [open, setOpen] = useState(false);
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null);
  const close = useCallback(
    (returnFocus: boolean) => {
      setOpen(false);
      if (returnFocus) trigger?.focus();
    },
    [trigger]
  );
  return { open, setOpen, trigger, setTrigger, close };
}

/** Pick a calendar day. `value` and `onChange` use 'YYYY-MM-DD' ('' for none). */
export function DatePicker({
  value,
  onChange,
  clearable = false,
  placeholder = 'Select a date',
}: {
  value: string;
  onChange: (value: string) => void;
  clearable?: boolean;
  placeholder?: string;
}) {
  const { open, setOpen, trigger, setTrigger, close } = usePickerState();
  const valueId = useId();
  const selected = parseDay(value);

  return (
    <>
      <button
        ref={setTrigger}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-describedby={valueId}
        className={triggerClass}
      >
        <span id={valueId} className={selected ? '' : 'text-slate-400'}>
          {selected ? `${MONTHS_SHORT[selected.m]} ${selected.d}, ${selected.y}` : placeholder}
        </span>
        <CalendarDays size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
      </button>
      {open && trigger && (
        <Popover anchor={trigger} label="Choose a date" onClose={close}>
          <CalendarPanel
            selected={selected}
            onSelect={(v) => {
              onChange(v);
              close(true);
            }}
            onClear={
              clearable
                ? () => {
                    onChange('');
                    close(true);
                  }
                : undefined
            }
          />
        </Popover>
      )}
    </>
  );
}

/** Pick a month. `value` and `onChange` use 'YYYY-MM'. */
export function MonthPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { open, setOpen, trigger, setTrigger, close } = usePickerState();
  const valueId = useId();
  const selected = parseMonth(value);
  const now = new Date();
  const [year, setYear] = useState(selected?.y ?? now.getFullYear());

  return (
    <>
      <button
        ref={setTrigger}
        type="button"
        onClick={() => {
          setYear(selected?.y ?? now.getFullYear());
          setOpen((o) => !o);
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-describedby={valueId}
        className={triggerClass}
      >
        <span id={valueId} className={selected ? '' : 'text-slate-400'}>
          {selected ? `${MONTHS_LONG[selected.m]} ${selected.y}` : 'Select a month'}
        </span>
        <CalendarDays size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
      </button>
      {open && trigger && (
        <Popover anchor={trigger} label="Choose a month" onClose={close}>
          <MonthGrid
            year={year}
            setYear={setYear}
            selected={selected}
            onPick={(y, m) => {
              onChange(monthValue(y, m));
              close(true);
            }}
          />
          <PanelFooter
            right={
              <button
                type="button"
                onClick={() => {
                  onChange(monthValue(now.getFullYear(), now.getMonth()));
                  close(true);
                }}
                className={`${footerButtonClass} text-brand-600 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-500/10`}
              >
                This month
              </button>
            }
          />
        </Popover>
      )}
    </>
  );
}
