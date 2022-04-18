import React from 'react';
import contractStore from "../stores/contract";
import {resetStatus} from "../helpers/contract";

function ResetStatus() {
    const handleClick = async () => {
        await resetStatus();
    }

    return (
        <button className="btn-status btn-reset" onClick={handleClick}>
            Reset contract
        </button>
    );
}

export default ResetStatus;
