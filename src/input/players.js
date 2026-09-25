// Which device is which player. First device to press A is player 1.

export function createPlayers(max = 2) {
  const slots = [];
  return {
    update(states) {
      for (const s of states) {
        if (s.buttons.a && !slots.includes(s.id) && slots.length < max) slots.push(s.id);
      }
      return slots.map((deviceId, slot) => ({
        slot,
        deviceId,
        state: states.find((s) => s.id === deviceId) ?? null,
      }));
    },
    get count() {
      return slots.length;
    },
    reset() {
      slots.length = 0;
    },
  };
}
