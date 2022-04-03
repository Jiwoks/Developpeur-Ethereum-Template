const { expect } = require("chai");
const {
    expectEvent,
    expectRevert,
} = require('@openzeppelin/test-helpers');

const Voting = artifacts.require('Voting');

contract('Voting', (accounts) => {

    const owner = accounts[0];
    const alice = accounts[1];
    const bob = accounts[2];
    const marc = accounts[3];
    const lise = accounts[4];

    const statuses = [
        {
            value: 0,
            name: 'RegisteringVoters',
            nextFunction: 'startProposalsRegistering',
            errorMessage: 'Registering proposals cant be started now',
            subFunction: {
                name: 'addVoter',
                param: alice,
                errorMessage: 'Voters registration is not open yet',
                addressFrom: owner
            },
        },
        {
            value: 1,
            name: 'ProposalsRegistrationStarted',
            nextFunction: 'endProposalsRegistering',
            errorMessage: 'Registering proposals havent started yet',
            subFunction: {
                name: 'addProposal',
                param: 'A proposal',
                errorMessage: 'Proposals are not allowed yet',
                addressFrom: alice
            },
        },
        {
            value: 2,
            name: 'ProposalsRegistrationEnded',
            nextFunction: 'startVotingSession',
            errorMessage: 'Registering proposals phase is not finished',

        },
        {
            value: 3,
            name: 'VotingSessionStarted',
            nextFunction: 'endVotingSession',
            errorMessage: 'Voting session havent started yet',
            subFunction: {
                name: 'setVote',
                param: '0',
                errorMessage: 'Voting session havent started yet',
                addressFrom: alice
            },
        },
        {
            value: 4,
            name: 'VotingSessionEnded',
            nextFunction: 'tallyVotes',
            errorMessage: 'Current status is not voting session ended',
        },
        {
            value: 5,
            name: 'VotesTallied',
        },
    ];

    // Contract instance
    let votingInstance;

    // We create some helpers as we will need to set again the contract in multiple states
    // Add voters and  enter proposal registering state
    const restoreStartProposalsRegistering = async () => {
        votingInstance = await Voting.new();
        await votingInstance.addVoter(owner);
        await votingInstance.addVoter(alice);
        await votingInstance.addVoter(bob);
        await votingInstance.startProposalsRegistering();
    }

    // Add voters, add proposals and enter start voting session state
    const restoreVotingSessionStarted = async () => {
        await restoreStartProposalsRegistering();
        await votingInstance.addProposal('This is a proposal from alice', {from: alice});
        await votingInstance.addProposal('This is a proposal from bob', {from: bob});
        await votingInstance.endProposalsRegistering();
        await votingInstance.startVotingSession();
    }

    // Add voters, add proposals, add votes and enter end voting session state
    const restoreVotingSessionEnded = async () => {
        await restoreVotingSessionStarted();
        await votingInstance.setVote(1, {from: alice});
        await votingInstance.setVote(1, {from: bob});
        await votingInstance.setVote(0, {from: owner});
        await votingInstance.endVotingSession();
    }

    // Add voters, add proposals, add votes and tally votes
    const restoreVotesTallied = async () => {
        await restoreVotingSessionEnded();
        await votingInstance.tallyVotes();
    }

    before(async () => {
        // Reset the contract
        votingInstance = await Voting.new();
    });

    describe('Test public variables initialization', async () => {

        it('winningProposalID is initialized to 0', async () => {
            expect(await votingInstance.winningProposalID.call()).to.be.bignumber.equal('0');
        });

        it('winningProposalID is initialized to RegisteringVoters (0)', async () => {
            expect(await votingInstance.workflowStatus.call()).to.be.bignumber.equal('0');
        });

    });

    describe('Getters', async () => {

        before(async () => {
            await restoreVotesTallied();
        });

        describe('Test getVoter function', async () => {
            it('Only a voter can get a voter', async () =>{
                await expectRevert(votingInstance.getVoter.call(owner, {from: marc}), 'You\'re not a voter');
            });

            it('Get a voter', async () => {
                expect((await votingInstance.getVoter.call(owner, {from: alice})).isRegistered).to.be.true;
            });
        });

        describe('Test getOneProposal function', async () => {
            it('Only voter can get a proposal', async () =>{
                await expectRevert(votingInstance.getOneProposal.call(owner, {from: marc}), 'You\'re not a voter');
            });

            it('Get a proposal', async () => {
                expect((await votingInstance.getOneProposal.call('0', {from: alice})).description).to.be.equal('This is a proposal from alice');
            });
        });
    });

    describe('Test workflow statuses', async () => {

        // We want to make tests for each WorkflowStatus status
        for (const status of statuses) {

            before(async () => {
                votingInstance = await Voting.new();
            });

            describe('Test functions for status ' + status.name + ' (' + status.value + ')', async () => {
                // Some non changing workflow functions can be called from this status
                // We can check that these functions work from this status
                if(status.subFunction !== undefined) {
                    it(status.subFunction.name + '() function should work if called from ' + status.name + ' status', async () => {
                        // We only check that the transaction is not reverted
                        const receipt = await votingInstance[status.subFunction.name](status.subFunction.param, {from: status.subFunction.addressFrom});
                        expect(receipt.receipt.status).to.be.true;
                    });
                }

                // From the current status, we'll call all our workflow functions
                // and make the associated tests
                for (const statusFunction of statuses) {

                    if (status.value === statusFunction.value) {
                        // We don't want to test the function associated to the current status here
                        // It will be tested after the loop
                        continue;
                    }

                    if (statusFunction.nextFunction === undefined) {
                        // We are at the last function we can call
                        continue;
                    }

                    // Test the function which normally should be called either before or after the current status
                    // therefore we expect it to revert
                    it(statusFunction.nextFunction + '() function should revert if called from ' + status.name + ' status with error "' + statusFunction.errorMessage + '"' , async () => {
                        await expectRevert(votingInstance[statusFunction.nextFunction](), statusFunction.errorMessage);
                    });

                    // Some non changing workflow functions can be called from this status
                    // We can check that these functions also revert when not in the expected status
                    if(statusFunction.subFunction !== undefined) {
                        it(statusFunction.subFunction.name + '() function should revert if called from ' + status.name + ' status with error "' + statusFunction.errorMessage + '"' , async () => {
                            await expectRevert(votingInstance[statusFunction.subFunction.name](statusFunction.subFunction.param, {from: statusFunction.subFunction.addressFrom}), statusFunction.subFunction.errorMessage);
                        });
                    }
                }

                if (status.nextFunction === undefined) {
                    // We are at the last status, all functions have been tested for all status from here
                    return;
                }

                it(status.nextFunction + '() is only callable by owner', async () => {
                    // All workflow functions are expected to be called by the owner
                    await expectRevert(votingInstance[status.nextFunction]({from: alice}), 'Ownable: caller is not the owner');
                });

                it(status.nextFunction + '() emit WorkflowStatusChange', async () => {
                    const receipt = await votingInstance[status.nextFunction]();
                    expectEvent(receipt, 'WorkflowStatusChange', {
                        previousStatus: status.value.toString(),
                        newStatus: (status.value + 1).toString(),
                    });
                });

                it(status.nextFunction + '() changes status value to ' + (status.value + 1 ).toString(), async () => {
                    expect(await votingInstance.workflowStatus.call()).to.be.bignumber.equal((status.value + 1 ).toString());
                });
            });
        }
    });

    describe('Test addVoter function', async () => {
        // No need to test again workflow status, it has been done before

        beforeEach(async () => {
            votingInstance = await Voting.new();
        });

        it('Only owner add voter', async () =>{
            await expectRevert(votingInstance.addVoter(marc, {from: alice}), 'Ownable: caller is not the owner');
            await expectRevert(votingInstance.addVoter(marc, {from: bob}), 'Ownable: caller is not the owner');
            await votingInstance.addVoter(marc);
            expect((await votingInstance.getVoter.call(marc, {from: marc})).isRegistered).to.be.true;
        });

        it('Add a voter with correct values', async () => {
            await votingInstance.addVoter(alice);
            const voterAlice = await votingInstance.getVoter.call(alice, {from: alice});
            expect(voterAlice.isRegistered).to.be.true;
            expect(voterAlice.hasVoted).to.be.false;
            expect(voterAlice.votedProposalId).to.be.bignumber.equal('0');

            await votingInstance.addVoter(bob);
            const voterBob = await votingInstance.getVoter.call(bob, {from: alice})
            expect(voterBob.isRegistered).to.be.true;
            expect(voterBob.hasVoted).to.be.false;
            expect(voterBob.votedProposalId).to.be.bignumber.equal('0');
        });

        it('Can\t add a voter twice', async () => {
            await votingInstance.addVoter(alice);
            await expectRevert(votingInstance.addVoter(alice), 'Already registered');
        });

        it('Emits the VoterRegistered event', async () => {
            const receiptAlice = await votingInstance.addVoter(alice);
            expectEvent(receiptAlice, 'VoterRegistered', {
                voterAddress: alice,
            });

            const receiptBob = await votingInstance.addVoter(bob);
            expectEvent(receiptBob, 'VoterRegistered', {
                voterAddress: bob,
            });
        });
    });

    describe('Test addProposal function', async () => {
        // No need to test again workflow status, it has been done before

        beforeEach(async () => {
            await restoreStartProposalsRegistering();
        });

        it('Only voter can add proposal', async () =>{
            await expectRevert(votingInstance.addProposal('This is a proposal from marc', {from: marc}), 'You\'re not a voter');
            await expectRevert(votingInstance.addProposal('This is a proposal from lise', {from: lise}), 'You\'re not a voter');
            await votingInstance.addProposal('This is a proposal from alice', {from: alice});
            expect((await votingInstance.getOneProposal.call('0', {from: alice})).description).to.be.equal('This is a proposal from alice');
        });

        it('Can\t add an empty proposal', async () => {
            await expectRevert(votingInstance.addProposal('', {from: alice}), 'Vous ne pouvez pas ne rien proposer');
        });

        it('Add a proposal with correct values', async () => {
            await votingInstance.addProposal('This is a proposal from alice', {from: alice})
            const proposalAlice = await votingInstance.getOneProposal.call('0', {from: alice});
            expect(proposalAlice.description).to.be.equal('This is a proposal from alice');
            expect(proposalAlice.voteCount).to.be.bignumber.equal('0');

            await votingInstance.addProposal('This is a proposal from bob', {from: bob})
            const proposalBob = await votingInstance.getOneProposal.call('1', {from: bob});
            expect(proposalBob.description).to.be.equal('This is a proposal from bob');
            expect(proposalBob.voteCount).to.be.bignumber.equal('0');
        });

        it('Emits the ProposalRegistered event', async () => {
            const receiptAlice = await votingInstance.addProposal('This is a proposal from alice', {from: alice});
            expectEvent(receiptAlice, 'ProposalRegistered', {
                proposalId: '0',
            });

            const receiptBob = await votingInstance.addProposal('This is a proposal from bob', {from: bob});
            expectEvent(receiptBob, 'ProposalRegistered', {
                proposalId: '1',
            });
        });
    });

    describe('Test setVote function', async () => {
        // No need to test again workflow status, it has been done before

        beforeEach(async () => {
            await restoreVotingSessionStarted();
        });

        it('Only voter can vote', async () =>{
            await expectRevert(votingInstance.setVote('0', {from: marc}), 'You\'re not a voter');
            await expectRevert(votingInstance.setVote('1', {from: lise}), 'You\'re not a voter');
            await votingInstance.setVote('0', {from: alice});
            expect((await votingInstance.getOneProposal.call('0', {from: alice})).voteCount).to.be.bignumber.equal('1');
        });

        it('Can\t vote for non existing proposal', async () => {
            await expectRevert(votingInstance.setVote('3', {from: alice}), 'Proposal not found');
        });

        it('Add a vote with correct values', async () => {
            await votingInstance.setVote(1, {from: alice});
            await votingInstance.setVote(1, {from: bob});
            await votingInstance.setVote(0, {from: owner});

            const proposalZero = await votingInstance.getOneProposal.call('0', {from: alice});
            const proposalOne = await votingInstance.getOneProposal.call('1', {from: alice});

            expect(proposalZero.voteCount).to.be.bignumber.equal('1');
            expect(proposalOne.voteCount).to.be.bignumber.equal('2');
        });

        it('Save vote to voter', async () => {
            await votingInstance.setVote(1, {from: alice});
            await votingInstance.setVote(0, {from: bob});

            const voteAlice = await votingInstance.getVoter.call(alice);
            const voteBob = await votingInstance.getVoter.call(bob);
            const voteOwner = await votingInstance.getVoter.call(owner);

            expect(voteAlice.votedProposalId).to.be.bignumber.equal('1');
            expect(voteAlice.hasVoted).to.be.true;

            expect(voteBob.votedProposalId).to.be.bignumber.equal('0');
            expect(voteBob.hasVoted).to.be.true;

            expect(voteOwner.hasVoted).to.be.false;
        });

        it('Emits the Voted event', async () => {
            const receiptAlice = await await votingInstance.setVote(1, {from: alice});
            expectEvent(receiptAlice, 'Voted', {
                voter: alice,
                proposalId: '1',
            });

            const receiptBob = await votingInstance.setVote(0, {from: bob});
            expectEvent(receiptBob, 'Voted', {
                voter: bob,
                proposalId: '0',
            });
        });
    });

    describe('Test tallyVotes function', async () => {
        // No need to test again workflow status, it has been done before

        beforeEach(async () => {
            await restoreVotingSessionEnded();
        });

        it('Only owner can tally votes', async () =>{
            await expectRevert(votingInstance.tallyVotes({from: alice}), 'Ownable: caller is not the owner');
            await votingInstance.tallyVotes();
            expect(await votingInstance.workflowStatus.call()).to.be.bignumber.equal('5');
        });

        it('Set correct winning proposal ID', async () => {
            expect(await votingInstance.winningProposalID.call()).to.be.bignumber.equal('0');
            await votingInstance.tallyVotes();
            expect(await votingInstance.winningProposalID.call()).to.be.bignumber.equal('1');
        });
    });
});
