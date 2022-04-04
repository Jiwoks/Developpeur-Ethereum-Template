# Tests Voting

## Installation
`nvm use 14`  Utilisation de node version 14  
`yarn install`  
Installera truffle en 5.4.29 pour pouvoir lancer le coverage

## Lancer les tests
Tests simples: `yarn test`  
Avec coverage: `yarn coverage`

## Résumé
80 tests  
100% coverage

## Tests
### Factorisations 
Comme le vote suit un cheminement précis, nous sommes amenés à devoir regénérer plusieurs fois l'état du contrat.
Au lieu de réécrire dans les onBefore ou onBefore each le processus, je l'ai intégré dans les fonctions
restoreStartProposalsRegistering, restoreVotingSessionStarted, restoreVotingSessionEnded et restoreVotesTallied

### Test public variables initialization
Ici on s'assure que les variables publiques winningProposalID et winningProposalID sont initialisées a 0

### Getters
On teste les getters getVoter et getOneProposal.
On s'assure que seulement les votant y ont accès et qu'ils renvoient une valeur correcte

### Test workflow statuses
Ici j'ai effectué une factorisation pour pouvoir faire des tests un peu plus avancés.
Il me semblait intéressant de pouvoir tester que chaque fonction qui permet de modifier le workflow n'est 
appelable que depuis le bon status. 
Pour chaque status on vient tester :
- Que si la fonction est appelée depuis un status d'où elle ne doit pas être appelée, elle revert.
- Que si la fonction est appelée depuis un status d'où elle peut être appelée, la transaction réussie.
- Que les fonctions ne peuvent être appelées que par le owner
- Que WorkflowStatusChange a bien été émis après un changement de status
- Que le status a été mis à jour à la bonne valeur
- Que les fonctions addVoter, addProposal et setVote sont uniquement appelables depuis le bon status

A propos des fonctions addVoter, addProposal et setVote, pour chacune on vérifie qu'elles revert quand elle ne doivent
pas être appelées et qu'elles réussissent quand elles sont censées le faire.

### Test addVoter function
- Seulement le owner peut ajouter un votant
- Ajout d'un votant
- Pas de possibilité d'ajouter deux fois le même votant
- évenement VoterRegistred émit

### Test addProposal function
- Seulement un votant peut ajouter une proposition
- Pas d'ajout proposition vide
- Ajout d'une proposition
- Événement ProposalRegistered émit

### Test setVote function
- Seulement un voter peut voter
- Pas de vote pour une proposition qui n'existe pas
- Ajout d'un vote
- Vote comptabilisé sur le votant
- évenement Voted émit

### Test tallyVotes function
- Seulement le voter pour clôturer les votes
- winningProposalID est bien mis à jour 

## Autre
### BN
Pas d'utilisation de BN, les strings suffisent tant qu'il n'y a pas de calculs 

### Plusieurs expect dans un it
Dans plusieurs tests, j'ai mis plusieurs expect dans un seul it.
Certains tests dépendent d'une adresse, dans ce cas je le teste aussi avec une autre addresse pour s'assurer qu'il 
fonctionne indépendamment.
Quand il faut tester une struct retournée par une fonction, je préfère le tester dans le même it.


## Résultat des tests
````
  Contract: Voting
    Test public variables initialization
      ✓ winningProposalID is initialized to 0 (48ms)
      ✓ winningProposalID is initialized to RegisteringVoters (0)
    Getters
      Test getVoter function
        ✓ Only a voter can get a voter (719ms)
        ✓ Get a voter (52ms)
      Test getOneProposal function
        ✓ Only voter can get a proposal
        ✓ Get a proposal
    Test workflow statuses
      Test functions for status RegisteringVoters (0)
        ✓ addVoter() function should work if called from RegisteringVoters status (106ms)
        ✓ endProposalsRegistering() function should revert if called from RegisteringVoters status with error "Registering proposals havent started yet" (85ms)
        ✓ addProposal() function should revert if called from RegisteringVoters status with error "Registering proposals havent started yet" (126ms)
        ✓ startVotingSession() function should revert if called from RegisteringVoters status with error "Registering proposals phase is not finished" (85ms)
        ✓ endVotingSession() function should revert if called from RegisteringVoters status with error "Voting session havent started yet" (65ms)
        ✓ setVote() function should revert if called from RegisteringVoters status with error "Voting session havent started yet" (77ms)
        ✓ tallyVotes() function should revert if called from RegisteringVoters status with error "Current status is not voting session ended" (65ms)
        ✓ startProposalsRegistering() is only callable by owner (87ms)
        ✓ startProposalsRegistering() emit WorkflowStatusChange (120ms)
        ✓ startProposalsRegistering() changes status value to 1 (40ms)
      Test functions for status ProposalsRegistrationStarted (1)
        ✓ addProposal() function should work if called from ProposalsRegistrationStarted status (72ms)
        ✓ startProposalsRegistering() function should revert if called from ProposalsRegistrationStarted status with error "Registering proposals cant be started now" (107ms)
        ✓ addVoter() function should revert if called from ProposalsRegistrationStarted status with error "Registering proposals cant be started now" (88ms)
        ✓ startVotingSession() function should revert if called from ProposalsRegistrationStarted status with error "Registering proposals phase is not finished" (74ms)
        ✓ endVotingSession() function should revert if called from ProposalsRegistrationStarted status with error "Voting session havent started yet" (117ms)
        ✓ setVote() function should revert if called from ProposalsRegistrationStarted status with error "Voting session havent started yet" (69ms)
        ✓ tallyVotes() function should revert if called from ProposalsRegistrationStarted status with error "Current status is not voting session ended" (101ms)
        ✓ endProposalsRegistering() is only callable by owner (139ms)
        ✓ endProposalsRegistering() emit WorkflowStatusChange (76ms)
        ✓ endProposalsRegistering() changes status value to 2
      Test functions for status ProposalsRegistrationEnded (2)
        ✓ startProposalsRegistering() function should revert if called from ProposalsRegistrationEnded status with error "Registering proposals cant be started now" (63ms)
        ✓ addVoter() function should revert if called from ProposalsRegistrationEnded status with error "Registering proposals cant be started now" (121ms)
        ✓ endProposalsRegistering() function should revert if called from ProposalsRegistrationEnded status with error "Registering proposals havent started yet" (90ms)
        ✓ addProposal() function should revert if called from ProposalsRegistrationEnded status with error "Registering proposals havent started yet" (86ms)
        ✓ endVotingSession() function should revert if called from ProposalsRegistrationEnded status with error "Voting session havent started yet" (77ms)
        ✓ setVote() function should revert if called from ProposalsRegistrationEnded status with error "Voting session havent started yet" (72ms)
        ✓ tallyVotes() function should revert if called from ProposalsRegistrationEnded status with error "Current status is not voting session ended" (79ms)
        ✓ startVotingSession() is only callable by owner (57ms)
        ✓ startVotingSession() emit WorkflowStatusChange (71ms)
        ✓ startVotingSession() changes status value to 3
      Test functions for status VotingSessionStarted (3)
        ✓ setVote() function should work if called from VotingSessionStarted status (74ms)
        ✓ startProposalsRegistering() function should revert if called from VotingSessionStarted status with error "Registering proposals cant be started now" (44ms)
        ✓ addVoter() function should revert if called from VotingSessionStarted status with error "Registering proposals cant be started now" (45ms)
        ✓ endProposalsRegistering() function should revert if called from VotingSessionStarted status with error "Registering proposals havent started yet" (50ms)
        ✓ addProposal() function should revert if called from VotingSessionStarted status with error "Registering proposals havent started yet" (57ms)
        ✓ startVotingSession() function should revert if called from VotingSessionStarted status with error "Registering proposals phase is not finished" (62ms)
        ✓ tallyVotes() function should revert if called from VotingSessionStarted status with error "Current status is not voting session ended" (39ms)
        ✓ endVotingSession() is only callable by owner
        ✓ endVotingSession() emit WorkflowStatusChange (54ms)
        ✓ endVotingSession() changes status value to 4
      Test functions for status VotingSessionEnded (4)
        ✓ startProposalsRegistering() function should revert if called from VotingSessionEnded status with error "Registering proposals cant be started now" (66ms)
        ✓ addVoter() function should revert if called from VotingSessionEnded status with error "Registering proposals cant be started now" (75ms)
        ✓ endProposalsRegistering() function should revert if called from VotingSessionEnded status with error "Registering proposals havent started yet" (81ms)
        ✓ addProposal() function should revert if called from VotingSessionEnded status with error "Registering proposals havent started yet" (67ms)
        ✓ startVotingSession() function should revert if called from VotingSessionEnded status with error "Registering proposals phase is not finished" (59ms)
        ✓ endVotingSession() function should revert if called from VotingSessionEnded status with error "Voting session havent started yet" (78ms)
        ✓ setVote() function should revert if called from VotingSessionEnded status with error "Voting session havent started yet" (74ms)
        ✓ tallyVotes() is only callable by owner (51ms)
        ✓ tallyVotes() emit WorkflowStatusChange (50ms)
        ✓ tallyVotes() changes status value to 5
      Test functions for status VotesTallied (5)
        ✓ startProposalsRegistering() function should revert if called from VotesTallied status with error "Registering proposals cant be started now" (77ms)
        ✓ addVoter() function should revert if called from VotesTallied status with error "Registering proposals cant be started now" (89ms)
        ✓ endProposalsRegistering() function should revert if called from VotesTallied status with error "Registering proposals havent started yet" (48ms)
        ✓ addProposal() function should revert if called from VotesTallied status with error "Registering proposals havent started yet" (74ms)
        ✓ startVotingSession() function should revert if called from VotesTallied status with error "Registering proposals phase is not finished" (59ms)
        ✓ endVotingSession() function should revert if called from VotesTallied status with error "Voting session havent started yet" (51ms)
        ✓ setVote() function should revert if called from VotesTallied status with error "Voting session havent started yet" (38ms)
        ✓ tallyVotes() function should revert if called from VotesTallied status with error "Current status is not voting session ended"
    Test addVoter function
      ✓ Only owner add voter (205ms)
      ✓ Add a voter with correct values (125ms)
      ✓ Can      add a voter twice (154ms)
      ✓ Emits the VoterRegistered event (80ms)
    Test addProposal function
      ✓ Only voter can add proposal (143ms)
      ✓ Can      add an empty proposal (58ms)
      ✓ Add a proposal with correct values (114ms)
      ✓ Emits the ProposalRegistered event (103ms)
    Test setVote function
      ✓ Only voter can vote (185ms)
      ✓ Can      vote for non existing proposal (55ms)
      ✓ Can      vote twice (137ms)
      ✓ Add a vote with correct values (190ms)
      ✓ Save vote to voter (180ms)
      ✓ Emits the Voted event (142ms)
    Test tallyVotes function
      ✓ Only owner can tally votes (145ms)
      ✓ Set correct winning proposal ID (119ms)


  80 passing (17s)

-------------|----------|----------|----------|----------|----------------|
File         |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
-------------|----------|----------|----------|----------|----------------|
 contracts/  |      100 |      100 |      100 |      100 |                |
  Voting.sol |      100 |      100 |      100 |      100 |                |
-------------|----------|----------|----------|----------|----------------|
All files    |      100 |      100 |      100 |      100 |                |
-------------|----------|----------|----------|----------|----------------|

````

