/**
 * We store here all data related to the wallet and web3 connection
 */
import create from 'zustand';

const store = create(set => ({
    web3: null, // Web3 provider
    ready: false, // True when web3 provider is ready
    connected: false,
    address: null,
    isVoter: false,
    isOwner: false,
    hasVoted: false,
    votedProposalId: null,
    setWeb3: (web3) => set({web3}),
    connect: (address) => set(state => ({ connected: true, address })),
    disconnect: () => set({ connected: false, address: null, isVoter: false, isOwner: false, hasVoted: false }),
    resetVote: () => set({ isVoter: false, hasVoted: false }),
}));

export default store;
