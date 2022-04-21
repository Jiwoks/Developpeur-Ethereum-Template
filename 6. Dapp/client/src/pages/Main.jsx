import React from 'react';
import Wallet from "../components/Wallet";
import WorkflowStatus from "../components/WorkflowStatus";
import UserStatus from "../components/UserStatus";
import walletStore from "../stores/wallet";
import contractStore from "../stores/contract";
import appStore from "../stores/app";
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
import Settings from "../components/Settings";

function Main() {
    const {isVoter, isOwner, connected} = walletStore(state => ({ isVoter: state.isVoter, isOwner: state.isOwner, connected: state.connected }));
    const {ready, noContractSet, workflowStatus, address, log} = contractStore(state => ({ ready: state.ready, noContractSet: state.noContractSet, workflowStatus: state.workflowStatus, address: state.address, log: state.log}));
    const {startError} = appStore(state => ({startError: state.startError}));

    // Not ready yet
    if (!ready) {
        return (
            <>
                <div id="main">
                    <Writer data={startError !== null ? startError : "loading"} sound={false} animation={true} />
                </div>
            </>
        );
    }

    // We are on the wrong network, or contract has not been published yet
    if (noContractSet) {
        return (
            <>
                <div id="main">
                    No contract set
                </div>
            </>
        );
    }

    let displayWorkflowStatus = false, displayNextStatus = false, displayResetStatus = false, displayPermissions = false, allowedAccess = false;

    if (isOwner || isVoter) {
        displayWorkflowStatus = isOwner || isVoter;
        allowedAccess = true;
    }

    if (isOwner && workflowStatus !== '5') {
        displayNextStatus = true;
    }
    if (isOwner && workflowStatus === '5') {
        displayResetStatus = true;
    }

    return (
        <>
            <div id="header">
                <div>
                    <VotingSessionId />
                    <Writer data={log} />
                </div>
                <div className="side-right">
                    <Wallet />
                </div>

            </div>

            <div id="main">
                {connected && allowedAccess &&
                    <div id="sidebars">
                        {(displayWorkflowStatus || displayNextStatus || displayResetStatus) &&
                            <div className="sidebar">
                                {displayWorkflowStatus && <WorkflowStatus/>}
                                {displayNextStatus && <NextStatus/>}
                                {displayResetStatus && <ResetStatus/>}
                            </div>
                        }
                        <div className="sidebar">
                            <UserStatus/>
                        </div>
                        <div className="sidebar">
                            <Settings />
                        </div>
                    </div>
                }
                <div id="content">
                    {!allowedAccess &&
                        <div className="top-margin">
                            You are not allowed to access the application.
                        </div>
                    }
                    {allowedAccess &&
                        <div>
                            {!connected && <NotConnected/>}
                            {(isOwner && workflowStatus === '0') && <RegisteringVoters/>}
                            {(isVoter && workflowStatus === '1') && <RegisteringProposals/>}
                            {(isVoter && workflowStatus === '2') && <ProposalsRegistrationEnded/>}
                            {(isVoter && workflowStatus === '3') && <VotingSession/>}
                            {(isVoter && workflowStatus === '4') && <VotingSessionEnded/>}
                            {(isVoter && workflowStatus === '5') && <VotesTallied/>}
                        </div>
                    }
                </div>

            </div>
            <div id="footer"><a target="_blank" href={'https://ropsten.etherscan.io/address/' + address}>Contract address : {address}</a></div>
        </>
    )
}

export default Main;
