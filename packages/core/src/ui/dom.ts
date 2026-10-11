/**
 * Wires a button so that it works for mouse, touch and keyboard users.
 *
 * `mousedown` is cancelled so pressing the button does not steal focus (and
 * the selection) from the editor; the action itself runs on `click`, which
 * browsers also fire for Enter/Space on a focused button.
 */
export function onPress(button: HTMLElement, handler: (event: MouseEvent) => void) {
  const handleMouseDown = (event: MouseEvent) => event.preventDefault();
  const handleClick = (event: MouseEvent) => {
    event.preventDefault();
    handler(event);
  };

  button.addEventListener('mousedown', handleMouseDown);
  button.addEventListener('click', handleClick);

  return () => {
    button.removeEventListener('mousedown', handleMouseDown);
    button.removeEventListener('click', handleClick);
  };
}
