import React, {useState} from 'react';
import {addProposal} from "../helpers/contract";

function RegisteringProposals() {
    const [getInput, setInput] = useState('');
    const [getDisabled, setDisabled] = useState(true);

    const handleAddProposal = async () => {
        await addProposal(getInput.trim());
        setInput('');
    }

    const handleInputChange = (e) => {
        setInput(e.target.value);
        setDisabled(e.target.value.trim() === '');
    }

    return (
        <>
            <input className="input-address" value={getInput} onChange={handleInputChange}/>
            <button disabled={getDisabled} onClick={handleAddProposal}>Add proposal</button>
        </>
    )
}

export default RegisteringProposals;

