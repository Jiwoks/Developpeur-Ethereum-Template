## `Voting`

Voting system
        In case of equality on a proposal, the first proposal is returned
        In case not vote has been done during the voting session, the winning proposal getter will revert



### `onlyVoter()`



Revert if not called by a whitelisted voter account

### `onlyStatus(enum Voting.WorkflowStatus _status)`



Revert if called from the wrong voting session status



### `nextStatus()` (external)

Change the workflow status to the next one



### `addVoter(address _address)` (external)

Add a voter to the whitelist




### `addProposal(string description)` (external)

Add a proposal



### `vote(uint256 _proposalId)` (external)

Count a vote for a proposal




### `getWinner() → uint256 proposalId, string description, uint256 voteCount` (public)

Return the winning proposal id and description




### `reset()` (public)

Reset the contract to its original state




### `VoterRegistered(address voterAddress, uint256 votingSessionId)`



Event when a voter has been added


### `WorkflowStatusChange(enum Voting.WorkflowStatus previousStatus, enum Voting.WorkflowStatus newStatus, uint256 votingSessionId)`



Event when the workflow state has changed


### `ProposalRegistered(address voter, uint256 proposalId, uint256 votingSessionId)`



Event when a new proposal has been submitted


### `Voted(address voter, uint256 proposalId, uint256 votingSessionId)`



Event when a voter has voted


### `Winning(uint256 proposalId, string description, uint256 voteCount, uint256 votingSessionId)`



Event when a winning proposal is confirmed



### `Voter`


bool isRegistered


bool hasVoted


uint256 votedProposalId


uint256 sessionId


### `Proposal`


string description


uint256 voteCount



### `WorkflowStatus`




















