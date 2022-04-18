/**
 * We store here all the data related to the contract
 * Events, current state, ...
 */
import create from 'zustand';

const store = create(set => ({
    ready: false,
    address: null,
    workflowStatus: null,
    votingSessionId: null,
    log: null,
}));

export default store;
