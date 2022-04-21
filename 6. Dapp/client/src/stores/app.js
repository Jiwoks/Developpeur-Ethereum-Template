/**
 * We store here all data related to the wallet and web3 connection
 */
import create from 'zustand';

const store = create(set => ({
    sound: true,
    effects: true,
    startError: null,
    setSound: (sound) => set({sound}),
    setEffects: (effects) => set({effects}),
}));

export default store;
