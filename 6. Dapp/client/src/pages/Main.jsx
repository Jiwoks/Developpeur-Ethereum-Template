import React from 'react';
import Wallet from "../components/Wallet";
import WorkflowStatus from "../components/WorkflowStatus";
import UserStatus from "../components/UserStatus";
import walletStore from "../stores/wallet";
import contractStore from "../stores/contract";
import RegisteringVoters from "./RegisteringVoters";
import RegisteringProposals from "./RegisteringProposals";
import VotingSession from "./VotingSession";
import ResetStatus from "../components/ResetStatus";
import NextStatus from "../components/NextStatus";
import VotingSessionId from "../components/VotingSessionId";
import ProposalsRegistrationEnded from "./ProposalsRegistrationEnded";
import NotConnected from "./NotConnected";
import VotingSessionEnded from "./VotingSessionEnded";
import VotesTallied from "./VotesTallied";
import Writer from "../components/Writer";
import Optimization from "../components/Optimization";

function Main() {
    const {isVoter, isOwner, connected} = walletStore(state => ({ isVoter: state.isVoter, isOwner: state.isOwner, connected: state.connected }));
    const {workflowStatus, address, log} = contractStore(state => ({ workflowStatus: state.workflowStatus, address: state.address, log: state.log}));

    return (
        <>
            <div id="header">
                <div>
                    <VotingSessionId />
                    <Writer data={log} />
                </div>
                <div className="side-right">
                    <Wallet />
                    <Optimization />
                </div>

            </div>

            <div id="main">
                {connected &&
                    <div id="sidebars">
                        <div className="sidebar">
                            <WorkflowStatus/>
                            {(isOwner && workflowStatus !== '5') && <NextStatus/>}
                            {(isOwner && workflowStatus === '5') && <ResetStatus/>}
                        </div>
                        <div className="sidebar">
                            <UserStatus/>
                        </div>
                    </div>
                }
                <div id="content">
                    {!connected && <NotConnected /> }
                    {(isOwner && workflowStatus === '0') && <RegisteringVoters /> }
                    {(isVoter && workflowStatus === '1') && <RegisteringProposals /> }
                    {(isVoter && workflowStatus === '2') && <ProposalsRegistrationEnded /> }
                    {(isVoter && workflowStatus === '3') && <VotingSession /> }
                    {(isVoter && workflowStatus === '4') && <VotingSessionEnded /> }
                    {(isVoter && workflowStatus === '5') && <VotesTallied /> }
                </div>

            </div>
            <div id="footer"><a target="_blank" href={'https://ropsten.etherscan.io/address/' + address}>Contract address : {address}</a></div>
        </>
    )
}

export default Main;
