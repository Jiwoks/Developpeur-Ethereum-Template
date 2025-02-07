import React, {useEffect, useState} from 'react';
import {addProposal, getProposals} from "../helpers/contract";
import walletStore from "../stores/wallet";

function RegisteringProposals() {
    const [getInput, setInput] = useState('');
    const [getDisabled, setDisabled] = useState(true);

    const {address, proposals} = walletStore(state => ({ address: state.address, proposals: state.proposals }));
    const addProposals = walletStore.getState().addProposals;

    useEffect(() => {
        (async () => {
            addProposals(await getProposals(address));
        })();
    }, []);

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
            <h2>Registering proposals</h2>
            <input className="input-address" value={getInput} onChange={handleInputChange}/>
            <button disabled={getDisabled} onClick={handleAddProposal}>Add proposal</button>

            {proposals.length > 0 &&
                <>
                    <h3>Your proposals</h3>
                    <table>
                        <thead>
                        <tr>
                            <th>#</th>
                            <th>Proposal</th>
                        </tr>
                        </thead>
                        <tbody>
                        {proposals.map((proposal, index) =>
                            <tr key={index}>
                                <td>{index}</td>
                                <td>{proposal.description}</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </>
            }

            {proposals.length === 0 && <div className="top-margin">You don't have any proposal registered yet</div>}
        </>
    )
}

export default RegisteringProposals;

