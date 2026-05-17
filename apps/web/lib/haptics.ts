/** Light haptic feedback when supported (iOS Safari, some Android browsers). */
export function hapticLight() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(10);
  }
}

export function hapticSuccess() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate([10, 40, 10]);
  }
}
