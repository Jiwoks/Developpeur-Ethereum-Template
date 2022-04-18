import React from 'react';
import walletStore from "../stores/wallet";

function UserStatus() {

    const {isVoter, isOwner} = walletStore(state => ({ isVoter: state.isVoter, isOwner: state.isOwner }));

    return (
        <div>
            <h3>Your permissions :</h3>
            <div>Owner: {isOwner ? '[✓]' : '[ ]'}</div>

            <div>Voter: {isVoter ? '[✓]' : '[ ]'}</div>
        </div>
    );
}

export default UserStatus;
