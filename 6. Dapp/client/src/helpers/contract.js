import votingContract from '../contracts/Voting.json';
import contractStore from '../stores/contract';
import walletStore from '../stores/wallet';
import Web3 from 'web3';

let contractInstance;

/**
 * Load the contract with our web3 provider
 *
 * @param web3Provider
 * @return {Promise<void>}
 */
async function loadContract(web3Provider) {
    const networkId = await web3Provider.eth.net.getId();
    const deployedNetwork = votingContract.networks[networkId];

    if (!deployedNetwork || !deployedNetwork.address) {
        contractStore.setState({ noContractSet: true });
        return;
    }

    contractInstance = new web3Provider.eth.Contract(
        votingContract.abi,
        deployedNetwork && deployedNetwork.address,
    );

    // As we have the contract we can already get the workflow status
    const workflowStatus = await getWorkflowStatus();
    const votingSessionId = await getVotingSessionId();

    contractInstance.events.allEvents(
        {},
        (err, event) => {
            if (err) {
                return console.warn(err);
            }
            triggerEvent(event)
        }
    );

    subscribeEvent('WorkflowStatusChange', (event) => {
        contractStore.setState({ workflowStatus: event.returnValues.newStatus, votingSessionId: event.returnValues.votingSessionId });
        if (event.returnValues.newStatus === '0') {
            // The voting session has been reset
            walletStore.getState().resetVote();
            contractStore.getState().resetContract();
        }
    });

    subscribeEvent('*', (event) => {
        contractStore.setState({log: event.event });
    });

    subscribeEvent('VoterRegistered', (event) => {
        if (Web3.utils.toChecksumAddress(event.returnValues.voterAddress) === Web3.utils.toChecksumAddress(walletStore.getState().address)) {
            walletStore.setState({ isVoter: true });
        }

        contractStore.getState().addVoter({
            address: event.returnValues.voterAddress
        });
    });

    subscribeEvent('ProposalRegistered', async (event) => {
        if (Web3.utils.toChecksumAddress(event.returnValues.voter) === Web3.utils.toChecksumAddress(walletStore.getState().address)) {
            const proposal = await getProposal(event.returnValues.proposalId);

            walletStore.getState().addProposal({
                proposalId: event.returnValues.proposalId,
                description: proposal.description,
            });
        }
    });

    subscribeEvent('Voted', (event) => {
        if (Web3.utils.toChecksumAddress(event.returnValues.voter) === Web3.utils.toChecksumAddress(walletStore.getState().address)) {
            walletStore.setState({ hasVoted: true, votedProposalId: event.returnValues.proposalId });
        }
    });

    // Save the state
    contractStore.setState({ ready: true, workflowStatus, votingSessionId, address: deployedNetwork.address });
}

/**
 * Get the permissions for an address
 * an store it inside contract store
 *
 * @todo: rename this function as we do more than just getting permissions
 *
 * @param address
 * @return {Promise<*[]>}
 */
async function getPermissions(address) {
    if (!contractInstance) {
        return;
    }
    const voter = await getVoter(address);

    if (voter.isRegistered && voter.sessionId === contractStore.getState().votingSessionId) {
        walletStore.setState({ isVoter: true, hasVoted: voter.hasVoted, votedProposalId: voter.votedProposalId });
    }

    const owner = await contractInstance.methods.owner().call();

    if (Web3.utils.toChecksumAddress(owner) === Web3.utils.toChecksumAddress(address)) {
        walletStore.setState({ isOwner: true });
    }
}

/**
 * Get a voter from contract
 *
 * @param address
 * @return {Promise<{hasVoted: boolean, isRegistered: boolean, votedProposalId}>}
 */
async function getVoter(address) {
    const voter = await contractInstance.methods.voters(address).call();

    return (({ isRegistered, hasVoted, votedProposalId, sessionId }) => ({ isRegistered, hasVoted, votedProposalId, sessionId }))(voter);
}

/**
 * Get the workflow status of the voting session
 *
 * @return {Promise<null|*>}
 */
async function getWorkflowStatus() {
    if (!contractInstance) {
        return null;
    }
    return await contractInstance.methods.workflowStatus().call();
}

/**
 * Get the voting session identifier
 *
 * @return {Promise<null|*>}
 */
async function getVotingSessionId() {
    if (!contractInstance) {
        return null;
    }
    return await contractInstance.methods.votingSessionId().call();
}

/**
 * Save a voter on the blockchain
 *
 * @param address
 * @return {Promise<*>}
 */
async function setVoter(address) {
    return await contractInstance.methods.addVoter(address).send({from: walletStore.getState().address});
}

/**
 * Vote for a proposal
 *
 * @param proposalId
 * @return {Promise<*>}
 */
async function vote(proposalId) {
    return await contractInstance.methods.vote(proposalId).send({from: walletStore.getState().address});
}

/**
 * Change to the next status
 *
 * @return {Promise<*>}
 */
async function nextStatus() {
    return await contractInstance.methods.nextStatus().send({from: walletStore.getState().address});
}

/**
 * Add a new proposal
 *
 * @param proposal
 * @return {Promise<*>}
 */
async function addProposal(proposal) {
    return await contractInstance.methods.addProposal(proposal).send({from: walletStore.getState().address});
}

/**
 * Get a proposal
 *
 * @param proposalId
 * @return {Promise<*>}
 */
async function getProposal(proposalId) {
    return await contractInstance.methods.proposals(proposalId).call();
}

/**
 * Reset contract
 * @returns {Promise<*>}
 */
async function resetStatus() {
    return await contractInstance.methods.reset().send({from: walletStore.getState().address});
}

/**
 * Return the human readable text for a workflow status
 *
 * @param workflowStatus
 * @return {string}
 */
function getWorkflowStatusName(workflowStatus) {
    workflowStatus = workflowStatus.toString();
    let status;

    switch (workflowStatus) {
        case '0':
            status = 'Registering voters'
            break;
        case '1':
            status = 'Proposal registration'
            break;
        case '2':
            status = 'Proposal registration has ended'
            break;
        case '3':
            status = 'Voting session'
            break;
        case '4':
            status = 'Voting session has ended'
            break;
        case '5':
            status = 'Votes tallied'
            break;
        default:
            status = 'Not a valid status'
    }

    return status;
}

/**
 * Retrieve all voters for the current session
 *
 * @return {Promise<*[]>}
 */
async function getVoters() {
    const voterEvents = await contractInstance.getPastEvents('VoterRegistered', {
        fromBlock: 0,
        toBlock: 'latest',
        filter: {
            votingSessionId: contractStore.getState().votingSessionId
        },
    });

    const voters = [];

    for (const voter of voterEvents) {
        voters.push({
            address: voter.returnValues.voterAddress,
        });
    }

    return voters;
}

/**
 * Retrieve all proposals for the current session
 * Can be filtered an address
 *
 * @param addressFrom
 * @return {Promise<*[]>}
 */
async function getProposals(addressFrom = null) {
    const filter = {
        votingSessionId:  contractStore.getState().votingSessionId
    };

    if (addressFrom) {
        filter.address = addressFrom;
    }

    const proposals = await contractInstance.getPastEvents('ProposalRegistered', {
        fromBlock: 0,
        toBlock: 'latest',
        filter,
    });

    const proposalsArray = [];

    for (const proposalEvent of proposals) {
        const proposal = await getProposal(proposalEvent.returnValues.proposalId);
        proposalsArray.push({
            id: proposalEvent.returnValues.proposalId,
            description: proposal.description,
            voteCount: proposal.voteCount,
        });
    }

    return proposalsArray;
}

/**
 * Return the winning proposal
 *
 * @return {Promise<{description: *, proposalId: *}>}
 */
async function getWinner() {
    const winner = await contractInstance.methods.getWinner().call();

    return {proposalId: winner.proposalId, description: winner.description, voteCount: winner.voteCount};
}

const subscriptions = {};
function subscribeEvent(eventName, callback) {
    if (subscriptions[eventName] === undefined) {
        subscriptions[eventName] = [];
    }
    subscriptions[eventName].push(callback);
}

function triggerEvent(event) {
    if (subscriptions[event.event] !== undefined) {
        for (const evt of Object.values(subscriptions[event.event])) {
            evt(event);
        }
    }
    if (subscriptions['*'] !== undefined) {
        for (const evt of Object.values(subscriptions['*'])) {
            evt(event);
        }
    }
}

export {
    loadContract,
    getWorkflowStatus,
    getPermissions,
    getVoters,
    setVoter,
    vote,
    getWorkflowStatusName,
    nextStatus,
    addProposal,
    getProposals,
    getWinner,
    resetStatus,
    subscribeEvent
};
