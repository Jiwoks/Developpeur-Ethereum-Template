// SPDX-License-Identifier: MIT

pragma solidity 0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Voting
/// @author Damien B
/// @notice Voting system
///         In case of equality on a proposal, the first proposal is returned
///         In case not vote has been done during the voting session, the winning proposal getter will revert
contract Voting is Ownable {
    /// @dev Represents a voter
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint256 votedProposalId;
        uint256 sessionId;
    }

    /// @dev Represents a proposal from a voter
    struct Proposal {
        string description;
        uint256 voteCount;
    }

    /// @dev Status of the current voting session
    enum WorkflowStatus {
        RegisteringVoters,
        ProposalsRegistrationStarted,
        ProposalsRegistrationEnded,
        VotingSessionStarted,
        VotingSessionEnded,
        VotesTallied
    }

    /// @dev Voting session Id
    ///      As we can't delete mapping we'll keep track of voting through this session Id
    uint256 public votingSessionId;

    /// @dev Whitelist of voters
    mapping(address => Voter) public voters;

    /// @dev Current status of the workflow
    ///      By default will be set 0 (RegisteringVoters)
    ///      Public visibility set to let anyone get the current state of the workflow
    WorkflowStatus public workflowStatus;

    /// @dev Proposals, list of proposals from voters
    //  @todo: We may add a getter to know the length of proposals for web3 usage
    Proposal[] public proposals;

    /// @dev We store the proposal which currently win
    uint256 private winningProposalId;

    /// @dev Revert if not called by a whitelisted voter account
    modifier onlyVoter() {
        require(
            voters[msg.sender].isRegistered == true && voters[msg.sender].sessionId == votingSessionId,
            "Voter must be whitelisted"
        );
        _;
    }

    /// @dev Revert if called from the wrong voting session status
    /// @param _status The workflow status we want to allow at this time
    modifier onlyStatus(WorkflowStatus _status) {
        require(workflowStatus == _status, "Not allowed at this time");
        _;
    }

    /// @dev Event when a voter has been added
    /// @param voterAddress The voter address
    event VoterRegistered(address voterAddress, uint256 indexed votingSessionId);

    /// @dev Event when the workflow state has changed
    /// @param previousStatus Status we had previously
    /// @param newStatus Status we have from now
    /// @param votingSessionId Identifier of the current voting session
    event WorkflowStatusChange(
        WorkflowStatus previousStatus,
        WorkflowStatus newStatus,
        uint256 votingSessionId
    );

    /// @dev Event when a new proposal has been submitted
    /// @param voter Voter address
    /// @param proposalId The proposal ID just registered
    /// @param votingSessionId Identifier of the current voting session
    event ProposalRegistered(address voter, uint256 proposalId, uint256 indexed votingSessionId);

    /// @dev Event when a voter has voted
    /// @param voter The voter address
    /// @param proposalId The proposal the voter has voted for
    /// @param votingSessionId Identifier of the current voting session
    event Voted(address voter, uint256 proposalId, uint256 indexed votingSessionId);

    /// @dev Event when a winning proposal is confirmed
    /// @param proposalId The winning proposal ID
    /// @param description The winning proposal description
    /// @param voteCount The winning proposal number of votes
    /// @param votingSessionId Identifier of the current voting session
    event Winning(uint256 proposalId, string description, uint256 voteCount, uint256 indexed votingSessionId);

    /// @notice Change the workflow status to the next one
    //  @emit WorkflowStatusChange
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

        emit WorkflowStatusChange(previousWorkflowStatus, workflowStatus, votingSessionId);
    }

    /// @notice Add a voter to the whitelist
    /// @param _address Voter address to whitelist
    //  @emit VoterRegistered
    function addVoter(address _address)
        external
        onlyOwner
        onlyStatus(WorkflowStatus.RegisteringVoters)
    {
        // Voter can be only added once
        require(
            !(voters[_address].isRegistered == true && voters[_address].sessionId == votingSessionId),
            "Voter already whitelisted"
        );

        voters[_address] = Voter(true, false, 0, votingSessionId);

        emit VoterRegistered(_address, votingSessionId);
    }

    /// @notice Add a proposal
    //  @emit ProposalRegistered
    function addProposal(string calldata description)
        external
        onlyStatus(WorkflowStatus.ProposalsRegistrationStarted)
        onlyVoter
    {
        proposals.push(Proposal(description, 0));

        emit ProposalRegistered(msg.sender, proposals.length - 1, votingSessionId);
    }

    /// @notice Count a vote for a proposal
    /// @param _proposalId The proposal ID the voter votes for
    //  @emit Voted
    function vote(uint256 _proposalId)
        external
        onlyStatus(WorkflowStatus.VotingSessionStarted)
        onlyVoter
    {
        require(_proposalId < proposals.length, "Not a valid proposal ID");
        require(
            voters[msg.sender].hasVoted == false && voters[msg.sender].sessionId == votingSessionId,
            "Voter has already voted"
        );

        proposals[_proposalId].voteCount++;
        voters[msg.sender].hasVoted = true;
        voters[msg.sender].votedProposalId = _proposalId;

        // Check if this proposal is now the winning proposal
        // In case of equality the first proposal voted will wins
        if (proposals[_proposalId].voteCount > proposals[winningProposalId].voteCount) {
            winningProposalId = _proposalId;
        }

        emit Voted(msg.sender, _proposalId, votingSessionId);
    }

    /// @notice Return the winning proposal id and description
    /// @return proposalId uint256 The winning proposal ID
    /// @return description string The winning proposal description
    /// @return voteCount uint256 Vote counts for this proposal
    function getWinner()
        public
        view
        onlyStatus(WorkflowStatus.VotesTallied)
        returns (uint256 proposalId, string memory description, uint256 voteCount)
    {
        require(proposals[winningProposalId].voteCount != 0, "Session ended with no vote");

        return (winningProposalId, proposals[winningProposalId].description, proposals[winningProposalId].voteCount);
    }

    /// @notice count all votes and set the winning proposal
    /// @dev this function is called internally from the nextStatus function
    //  @emit Winning
    function _tallyVotes()
        private
        onlyOwner
        onlyStatus(WorkflowStatus.VotingSessionEnded)
    {
        // Make sure we have at lease one vote
        if (proposals.length > 0 && proposals[winningProposalId].voteCount != 0) {
            emit Winning(
                winningProposalId,
                proposals[winningProposalId].description,
                proposals[winningProposalId].voteCount,
                votingSessionId
            );
        }
    }

    /// @notice Reset the contract to its original state
    //  @emit WorkflowStatusChange
    function reset()
        public
        onlyOwner
        onlyStatus(WorkflowStatus.VotesTallied)
    {
        votingSessionId ++;
        WorkflowStatus previousWorkflowStatus = workflowStatus;
        delete workflowStatus;
        delete proposals;
        delete winningProposalId;

        emit WorkflowStatusChange(previousWorkflowStatus, workflowStatus, votingSessionId);
    }
}
