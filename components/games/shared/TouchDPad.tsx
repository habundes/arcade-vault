"use client";

export type DPadDirection = "UP" | "DOWN" | "LEFT" | "RIGHT";

export type TouchDPadProps = {
  onDirection: (dir: DPadDirection) => void;
  disabled?: boolean;
};

export function TouchDPad({ onDirection, disabled = false }: TouchDPadProps) {
  return (
    <div
      className="touch-dpad"
      role="group"
      aria-label="Controles direccionales"
    >
      <button
        type="button"
        className="touch-dpad-btn touch-dpad-up"
        aria-label="Arriba"
        disabled={disabled}
        onClick={() => onDirection("UP")}
      >
        ▲
      </button>
      <button
        type="button"
        className="touch-dpad-btn touch-dpad-left"
        aria-label="Izquierda"
        disabled={disabled}
        onClick={() => onDirection("LEFT")}
      >
        ◀
      </button>
      <button
        type="button"
        className="touch-dpad-btn touch-dpad-right"
        aria-label="Derecha"
        disabled={disabled}
        onClick={() => onDirection("RIGHT")}
      >
        ▶
      </button>
      <button
        type="button"
        className="touch-dpad-btn touch-dpad-down"
        aria-label="Abajo"
        disabled={disabled}
        onClick={() => onDirection("DOWN")}
      >
        ▼
      </button>
    </div>
  );
}
