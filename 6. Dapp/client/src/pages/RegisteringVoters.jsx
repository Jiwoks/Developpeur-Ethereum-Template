import React, {useState} from 'react';
import {setVoter} from "../helpers/contract";

function RegisteringVoters() {
    const [getInput, setInput] = useState('');
    const [getDisabled, setDisabled] = useState(true);

    const handleAddVoter = async () => {
        await setVoter(getInput);
        setInput('');
    }

    const handleInputChange = (e) => {
        setDisabled(!isAddressValid(e.target.value));
        setInput(e.target.value);
    }

    const isAddressValid = (address) => {
        if (typeof address !== 'string') {
            return false;
        }

        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }


    return (
        <>
            Add a voter : <br/>
            <input className="input-address" value={getInput} onChange={handleInputChange} />
            <button disabled={getDisabled} onClick={handleAddVoter}>Add voter</button>
        </>
    )
}

export default RegisteringVoters;

