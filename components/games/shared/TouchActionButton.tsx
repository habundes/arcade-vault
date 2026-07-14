"use client";

export type TouchActionButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export function TouchActionButton({
  label,
  onPress,
  disabled = false,
}: TouchActionButtonProps) {
  return (
    <button
      type="button"
      className="touch-action-btn"
      aria-label={label}
      disabled={disabled}
      onClick={onPress}
    >
      {label}
    </button>
  );
}
