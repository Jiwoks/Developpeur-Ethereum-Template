// SPDX-License-Identifier: MIT

pragma solidity 0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";

// @title Voting
// @author Damien B
// @notice Voting system
//         In case of equality on a proposal, the first proposal is returned
//         In case not vote has been done during the voting session, the winning proposal getter will revert
contract Voting is Ownable {
    // @dev Represents a voter
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint256 votedProposalId;
    }

    // @dev Represents a proposal from a voter
    struct Proposal {
        string description;
        uint256 voteCount;
    }

    // @dev Status of the current voting session
    enum WorkflowStatus {
        RegisteringVoters,
        ProposalsRegistrationStarted,
        ProposalsRegistrationEnded,
        VotingSessionStarted,
        VotingSessionEnded,
        VotesTallied
    }

    // @dev Whitelist of voters
    mapping(address => Voter) public voters;

    // @dev Current status of the workflow
    //      By default will be set 0 (RegisteringVoters)
    //      Public visibility set to let anyone get the current state of the workflow
    WorkflowStatus public workflowStatus;

    // @dev Proposals, list of proposals from voters
    // @todo: We may add a getter to know the length of proposals for web3 usage
    Proposal[] public proposals;

    // @dev We store the final winning proposal in this var
    //      Set as public to only retrieve proposal ID, even if we have a getter that return it with other vars
    uint256 public winningProposalId;

    // @dev Revert if not called by a whitelisted voter account
    modifier onlyVoter() {
        require(
            voters[msg.sender].isRegistered == true,
            "Voter must be whitelisted"
        );
        _;
    }

    // @dev Revert if called from the wrong voting session status
    // @param _status The workflow status we want to allow at this time
    modifier onlyStatus(WorkflowStatus _status) {
        require(workflowStatus == _status, "Not allowed at this time");
        _;
    }

    // @dev Event when a voter has been added
    // @param voterAddress The voter address
    event VoterRegistered(address voterAddress);

    // @dev Event when the workflow state has changed
    // @param previousStatus Status we had previously
    // @param newStatus Status we have from now
    event WorkflowStatusChange(
        WorkflowStatus previousStatus,
        WorkflowStatus newStatus
    );

    // @dev Event when a new proposal has been submitted
    // @param proposalId The proposal ID just registered
    event ProposalRegistered(uint256 proposalId);

    // @dev Event when a voter has voted
    // @param voter The voter address
    // @param proposalId The proposal the voter has voted for
    event Voted(address voter, uint256 proposalId);

    // @dev Event when a winning proposal is confirmed
    // @param proposalId The winning proposal ID
    // @param description The winning proposal description
    // @param voteCount The winning proposal number of votes
    event Winning(uint256 proposalId, string description, uint256 voteCount);

    // @notice Change the workflow status to the next one
    // @emit WorkflowStatusChange
    function nextStatus() external onlyOwner {
        // Only change status if the whole process is not finished
        require(
            workflowStatus != WorkflowStatus.VotesTallied,
            "Vote session has already ended"
        );

        // Voting sessions ended, let's count votes
        if (workflowStatus == WorkflowStatus.VotingSessionEnded) {
            _tallyVotes();
        }

        WorkflowStatus previousWorkflowStatus = workflowStatus;
        workflowStatus = WorkflowStatus(uint256(previousWorkflowStatus) + 1);

        emit WorkflowStatusChange(previousWorkflowStatus, workflowStatus);
    }

    // @notice Add a voter to the whitelist
    // @param _address Voter address to whitelist
    // @emit VoterRegistered
    function addVoter(address _address)
        external
        onlyOwner
        onlyStatus(WorkflowStatus.RegisteringVoters)
    {
        // Voter can be only added once
        require(
            voters[_address].isRegistered == false,
            "Voter already whitelisted"
        );

        voters[_address] = Voter(true, false, 0);

        emit VoterRegistered(_address);
    }

    // @notice Add a proposal
    // @emit ProposalRegistered
    function addProposal(string calldata description)
        external
        onlyStatus(WorkflowStatus.ProposalsRegistrationStarted)
        onlyVoter
    {
        proposals.push(Proposal(description, 0));

        emit ProposalRegistered(proposals.length - 1);
    }

    // @notice Count a vote for a proposal
    // @param _proposalId The proposal ID the voter votes for
    // @emit Voted
    function vote(uint256 _proposalId)
        external
        onlyStatus(WorkflowStatus.VotingSessionStarted)
        onlyVoter
    {
        require(_proposalId < proposals.length, "Not a valid proposal ID");
        require(
            voters[msg.sender].hasVoted == false,
            "Voter has already voted"
        );

        proposals[_proposalId].voteCount++;
        voters[msg.sender].hasVoted = true;

        emit Voted(msg.sender, _proposalId);
    }

    // @notice Return the winning proposal id and description
    // @return uint256 The winning proposal ID
    // @return string The winning proposal description
    function getWinner()
        public
        view
        onlyStatus(WorkflowStatus.VotesTallied)
        returns (uint256, string memory)
    {
        require(winningProposalId != 0, "Session ended with no vote");

        return (winningProposalId, proposals[winningProposalId].description);
    }

    // @notice count all votes and set the winning proposal
    // @dev this function is called internally from the nextStatus function
    //      in case of equality the first proposal will be returned
    // @emit Winning
    function _tallyVotes()
        private
        onlyOwner
        onlyStatus(WorkflowStatus.VotingSessionEnded)
    {
        uint256 maxVotes = 0;
        for (uint256 ij = 0; ij < proposals.length; ij++) {
            if (proposals[ij].voteCount > maxVotes) {
                winningProposalId = ij;
            }
        }

        if (winningProposalId != 0) {
            emit Winning(
                winningProposalId,
                proposals[winningProposalId].description,
                proposals[winningProposalId].voteCount
            );
        }
    }
}
