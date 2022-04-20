import React from 'react';
import contractStore from "../stores/contract";

function VotingSessionId(props) {

    const {ready, votingSessionId} = contractStore(state => ({ready: state.ready, votingSessionId: state.votingSessionId}));

    if (!ready) {
        // Status not yet initialized
        return <></>;
    }

    return (
        <div>
            Voting Session number {votingSessionId}
        </div>
    );
}

export default VotingSessionId;
