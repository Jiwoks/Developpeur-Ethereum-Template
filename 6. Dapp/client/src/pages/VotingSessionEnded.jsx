import React, {useEffect, useState} from 'react';
import {addProposal, getProposals, vote} from "../helpers/contract";

function VotingSessionEnded() {

    return (
        <>
            <p>Voting session has ended.</p>
            <p>Thank you for your participation.</p>
            <p>Result will be available shortly.</p>
        </>
    )
}

export default VotingSessionEnded;

