// Keyboard and mouse input. Movement keys are polled every frame; action
// keys (pause, mute, confirm, restart) are edge-triggered through `pressed`.

const KEYMAP = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ShiftLeft: 'sneak',
  ShiftRight: 'sneak',
};

export function createInput() {
  const input = {
    up: false,
    down: false,
    left: false,
    right: false,
    sneak: false,
    pressed: new Set(),
    mouse: { x: 0, y: 0, clicked: false },
    attach(canvas) {
      window.addEventListener('keydown', (event) => {
        const name = KEYMAP[event.code];
        if (name) {
          input[name] = true;
          event.preventDefault();
        }
        if (['KeyM', 'KeyP', 'KeyR', 'Enter', 'Space', 'Escape'].includes(event.code)) {
          input.pressed.add(event.code);
          event.preventDefault();
        }
      });
      window.addEventListener('keyup', (event) => {
        const name = KEYMAP[event.code];
        if (name) input[name] = false;
      });
      window.addEventListener('blur', () => {
        input.up = input.down = input.left = input.right = input.sneak = false;
      });
      canvas.addEventListener('mousemove', (event) => {
        const rect = canvas.getBoundingClientRect();
        input.mouse.x = ((event.clientX - rect.left) / rect.width) * 1280;
        input.mouse.y = ((event.clientY - rect.top) / rect.height) * 720;
      });
      canvas.addEventListener('click', (event) => {
        const rect = canvas.getBoundingClientRect();
        input.mouse.x = ((event.clientX - rect.left) / rect.width) * 1280;
        input.mouse.y = ((event.clientY - rect.top) / rect.height) * 720;
        input.mouse.clicked = true;
      });
    },
    // True once for the frame after the key went down.
    wasPressed(code) {
      return input.pressed.has(code);
    },
    endFrame() {
      input.pressed.clear();
      input.mouse.clicked = false;
    },
  };
  return input;
}
