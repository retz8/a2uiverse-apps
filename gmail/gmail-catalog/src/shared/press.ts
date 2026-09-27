import type {KeyboardEvent} from 'react';

/** Enter and Space activate an element that stands in for a button, as a native button does. */
export function pressOnKey(onPress: () => void) {
  return (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onPress();
    }
  };
}
