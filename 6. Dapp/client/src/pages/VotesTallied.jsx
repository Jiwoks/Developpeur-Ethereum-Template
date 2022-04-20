import React, {useEffect, useState} from 'react';
import {getWinner} from "../helpers/contract";
import contractStore from "../stores/contract";

function VotesTallied() {
    const [winningProposal, setWinningProposal] = useState(null);
    const {votingSessionId} = contractStore(state => ({ready: state.ready, votingSessionId: state.votingSessionId}));

    useEffect(() => {
        (async () => {
            setWinningProposal(await getWinner());
        })();
    }, []);

    if (winningProposal === null) {
        return <></>;
    }

    return (
        <>
            <h2>Winning proposal for vote session {votingSessionId}</h2>
            <p>
                Proposal #{winningProposal.proposalId} win with {winningProposal.voteCount} vote(s) :
            </p>
            <p><i>{winningProposal.description}</i></p>
        </>
    )
}

export default VotesTallied;

