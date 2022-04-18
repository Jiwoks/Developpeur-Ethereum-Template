import React, {useEffect, useState} from 'react';
import {addProposal, getProposals, vote} from "../helpers/contract";

function VotingSessionEnded() {

    return (
        <>
            Voting session has ended.<br/>
            Thank you for your participation.<br/><br/>
        </>
    )
}

export default VotingSessionEnded;

