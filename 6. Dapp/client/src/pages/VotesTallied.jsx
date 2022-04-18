import React, {useEffect, useState} from 'react';
import {addProposal, getProposals, getWinner, vote} from "../helpers/contract";

function VotesTallied() {
    const [winningProposal, setWinningProposal] = useState(null);

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
            ID: {winningProposal.proposalId}<br/>
            Description {winningProposal.description}
        </>
    )
}

export default VotesTallied;

