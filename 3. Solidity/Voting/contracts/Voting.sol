// SPDX-License-Identifier: MIT

pragma solidity 0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";

// @title Voting
// @author Damien Barrère
// @notice Voting system
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
    // By default will be set 0 (RegisteringVoters)
    // Public visibility set to let anyone get the current state of the workflow
    WorkflowStatus public workflowStatus;

    // @dev Proposals, list of proposals from voters
    Proposal[] public proposals;

    // @dev We store the final winning proposal in this var
    uint256 internal winningProposalId;

    // @dev Revert if called by a whitelisted voter account
    modifier onlyVoter() {
        require(
            voters[msg.sender].isRegistered == true,
            "Voter must be whitelisted"
        );
        _;
    }

    // @dev Revert if called from the wrong voting session status
    modifier onlyStatus(WorkflowStatus _status) {
        require(workflowStatus == _status, "Not allowed at this time");
        _;
    }

    // @dev Event when a voter has been added
    event VoterRegistered(address voterAddress);

    // @dev Event when the workflow state has changed
    event WorkflowStatusChange(
        WorkflowStatus previousStatus,
        WorkflowStatus newStatus
    );

    // @dev Event when a new proposal has been submitted
    event ProposalRegistered(uint256 proposalId);

    // @dev Event when a voter has voted
    event Voted(address voter, uint256 proposalId);

    // @dev Add a voter to the whitelist
    // @emit VoterRegistered
    function addVoter(address _address)
        external
        onlyOwner
        onlyStatus(WorkflowStatus.RegisteringVoters)
    {
        // Voter can be only added once
        require(
            voters[_address].isRegistered != true,
            "Voter already whitelisted"
        );

        voters[_address] = Voter(true, false, 0);

        emit VoterRegistered(_address);
    }

    // @dev Change the workflow status to the next one
    // @emit WorkflowStatusChange
    function nextStatus() external onlyOwner {
        // Only change status if the whole process is not finished
        require(
            workflowStatus != WorkflowStatus.VotesTallied,
            "Vote session has already ended"
        );

        WorkflowStatus previousWorkflowStatus = workflowStatus;
        workflowStatus = WorkflowStatus(uint256(previousWorkflowStatus) + 1);

        emit WorkflowStatusChange(previousWorkflowStatus, workflowStatus);
    }

    // @dev Add a proposal
    // @fixme: may be a public function instead of external as description has to be in memory: to check with Cyril
    // @emit ProposalRegistered
    function addProposal(string calldata description)
        external
        onlyStatus(WorkflowStatus.ProposalsRegistrationStarted)
        onlyVoter
    {
        proposals.push(Proposal(description, 0));

        emit ProposalRegistered(proposals.length);
    }

    // @dev Count a vote for a proposal
    // @emit Voted
    function vote(uint256 _proposalId)
        external
        onlyStatus(WorkflowStatus.VotingSessionStarted)
        onlyVoter
    {
        require(_proposalId <= proposals.length, "Not a valid proposal ID");
        require(
            voters[msg.sender].hasVoted == false,
            "Voter has already voted"
        );

        proposals[_proposalId].voteCount++;
        voters[msg.sender].hasVoted = true;

        emit Voted(msg.sender, _proposalId);
    }

    // @dev count all votes
    // In case of equality the first proposal will be returned
    function tallyVotes()
        external
        onlyOwner
        onlyStatus(WorkflowStatus.VotingSessionEnded)
    {
        require(proposals.length > 0, "No votes during the session"); // @fixme: we may not need it

        uint256 maxVotes = 0;
        for (uint256 ij = 0; ij < proposals.length; ij++) {
            if (proposals[ij].voteCount > maxVotes) {
                winningProposalId = ij;
            }
        }

        workflowStatus = WorkflowStatus.VotesTallied;

        emit WorkflowStatusChange(
            WorkflowStatus.VotingSessionEnded,
            WorkflowStatus.VotesTallied
        );
    }

    // @dev Return the winning proposal
    function getWinner()
        public
        view
        onlyStatus(WorkflowStatus.VotesTallied)
        returns (uint256)
    {
        return winningProposalId;
    }

    // @dev Return the proposal description
    function getWinningProposalDescription()
        public
        view
        onlyStatus(WorkflowStatus.VotesTallied)
        returns (string memory)
    {
        return proposals[winningProposalId].description;
    }
}
