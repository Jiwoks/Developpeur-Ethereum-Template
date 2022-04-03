# Tests Voting

## Installation
`yarn install`  
Truffle doit être installé en version 5.4.29 pour pouvoir lancer le coverage

## Lancer les tests
Tests simples: `yarn test`  
Avec coverage: `yarn coverage`

## Résumé
79 tests  
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
      ✓ winningProposalID is initialized to 0
      ✓ winningProposalID is initialized to RegisteringVoters (0)
    Getters
      Test getVoter function
        ✓ Only a voter can get a voter (411ms)
        ✓ Get a voter
      Test getOneProposal function
        ✓ Only voter can get a proposal
        ✓ Get a proposal
    Test workflow statuses
      Test functions for status RegisteringVoters (0)
        ✓ addVoter() function should work if called from RegisteringVoters status (54ms)
        ✓ endProposalsRegistering() function should revert if called from RegisteringVoters status with error "Registering proposals havent started yet" (64ms)
        ✓ addProposal() function should revert if called from RegisteringVoters status with error "Registering proposals havent started yet" (45ms)
        ✓ startVotingSession() function should revert if called from RegisteringVoters status with error "Registering proposals phase is not finished"
        ✓ endVotingSession() function should revert if called from RegisteringVoters status with error "Voting session havent started yet" (46ms)
        ✓ setVote() function should revert if called from RegisteringVoters status with error "Voting session havent started yet" (42ms)
        ✓ tallyVotes() function should revert if called from RegisteringVoters status with error "Current status is not voting session ended"
        ✓ startProposalsRegistering() is only callable by owner (39ms)
        ✓ startProposalsRegistering() emit WorkflowStatusChange
        ✓ startProposalsRegistering() changes status value to 1
      Test functions for status ProposalsRegistrationStarted (1)
        ✓ addProposal() function should work if called from ProposalsRegistrationStarted status (50ms)
        ✓ startProposalsRegistering() function should revert if called from ProposalsRegistrationStarted status with error "Registering proposals cant be started now" (41ms)
        ✓ addVoter() function should revert if called from ProposalsRegistrationStarted status with error "Registering proposals cant be started now" (42ms)
        ✓ startVotingSession() function should revert if called from ProposalsRegistrationStarted status with error "Registering proposals phase is not finished"
        ✓ endVotingSession() function should revert if called from ProposalsRegistrationStarted status with error "Voting session havent started yet" (48ms)
        ✓ setVote() function should revert if called from ProposalsRegistrationStarted status with error "Voting session havent started yet" (46ms)
        ✓ tallyVotes() function should revert if called from ProposalsRegistrationStarted status with error "Current status is not voting session ended"
        ✓ endProposalsRegistering() is only callable by owner
        ✓ endProposalsRegistering() emit WorkflowStatusChange (47ms)
        ✓ endProposalsRegistering() changes status value to 2
      Test functions for status ProposalsRegistrationEnded (2)
        ✓ startProposalsRegistering() function should revert if called from ProposalsRegistrationEnded status with error "Registering proposals cant be started now" (50ms)
        ✓ addVoter() function should revert if called from ProposalsRegistrationEnded status with error "Registering proposals cant be started now" (50ms)
        ✓ endProposalsRegistering() function should revert if called from ProposalsRegistrationEnded status with error "Registering proposals havent started yet" (48ms)
        ✓ addProposal() function should revert if called from ProposalsRegistrationEnded status with error "Registering proposals havent started yet" (65ms)
        ✓ endVotingSession() function should revert if called from ProposalsRegistrationEnded status with error "Voting session havent started yet" (41ms)
        ✓ setVote() function should revert if called from ProposalsRegistrationEnded status with error "Voting session havent started yet" (57ms)
        ✓ tallyVotes() function should revert if called from ProposalsRegistrationEnded status with error "Current status is not voting session ended" (100ms)
        ✓ startVotingSession() is only callable by owner (92ms)
        ✓ startVotingSession() emit WorkflowStatusChange (116ms)
        ✓ startVotingSession() changes status value to 3
      Test functions for status VotingSessionStarted (3)
        ✓ setVote() function should work if called from VotingSessionStarted status (55ms)
        ✓ startProposalsRegistering() function should revert if called from VotingSessionStarted status with error "Registering proposals cant be started now" (56ms)
        ✓ addVoter() function should revert if called from VotingSessionStarted status with error "Registering proposals cant be started now" (85ms)
        ✓ endProposalsRegistering() function should revert if called from VotingSessionStarted status with error "Registering proposals havent started yet" (59ms)
        ✓ addProposal() function should revert if called from VotingSessionStarted status with error "Registering proposals havent started yet" (78ms)
        ✓ startVotingSession() function should revert if called from VotingSessionStarted status with error "Registering proposals phase is not finished" (49ms)
        ✓ tallyVotes() function should revert if called from VotingSessionStarted status with error "Current status is not voting session ended" (48ms)
        ✓ endVotingSession() is only callable by owner
        ✓ endVotingSession() emit WorkflowStatusChange
        ✓ endVotingSession() changes status value to 4
      Test functions for status VotingSessionEnded (4)
        ✓ startProposalsRegistering() function should revert if called from VotingSessionEnded status with error "Registering proposals cant be started now"
        ✓ addVoter() function should revert if called from VotingSessionEnded status with error "Registering proposals cant be started now"
        ✓ endProposalsRegistering() function should revert if called from VotingSessionEnded status with error "Registering proposals havent started yet"
        ✓ addProposal() function should revert if called from VotingSessionEnded status with error "Registering proposals havent started yet" (61ms)
        ✓ startVotingSession() function should revert if called from VotingSessionEnded status with error "Registering proposals phase is not finished" (56ms)
        ✓ endVotingSession() function should revert if called from VotingSessionEnded status with error "Voting session havent started yet" (39ms)
        ✓ setVote() function should revert if called from VotingSessionEnded status with error "Voting session havent started yet" (40ms)
        ✓ tallyVotes() is only callable by owner (49ms)
        ✓ tallyVotes() emit WorkflowStatusChange (40ms)
        ✓ tallyVotes() changes status value to 5
      Test functions for status VotesTallied (5)
        ✓ startProposalsRegistering() function should revert if called from VotesTallied status with error "Registering proposals cant be started now" (44ms)
        ✓ addVoter() function should revert if called from VotesTallied status with error "Registering proposals cant be started now" (40ms)
        ✓ endProposalsRegistering() function should revert if called from VotesTallied status with error "Registering proposals havent started yet" (62ms)
        ✓ addProposal() function should revert if called from VotesTallied status with error "Registering proposals havent started yet" (68ms)
        ✓ startVotingSession() function should revert if called from VotesTallied status with error "Registering proposals phase is not finished" (58ms)
        ✓ endVotingSession() function should revert if called from VotesTallied status with error "Voting session havent started yet" (55ms)
        ✓ setVote() function should revert if called from VotesTallied status with error "Voting session havent started yet" (65ms)
        ✓ tallyVotes() function should revert if called from VotesTallied status with error "Current status is not voting session ended" (52ms)
    Test addVoter function
      ✓ Only owner add voter (137ms)
      ✓ Add a voter with correct values (114ms)
      ✓ Can	 add a voter twice (74ms)
      ✓ Emits the VoterRegistered event (85ms)
    Test addProposal function
      ✓ Only voter can add proposal (121ms)
      ✓ Can	 add an empty proposal
      ✓ Add a proposal with correct values (119ms)
      ✓ Emits the ProposalRegistered event (118ms)
    Test setVote function
      ✓ Only voter can vote (134ms)
      ✓ Can	 vote for non existing proposal (42ms)
      ✓ Add a vote with correct values (272ms)
      ✓ Save vote to voter (182ms)
      ✓ Emits the Voted event (99ms)
    Test tallyVotes function
      ✓ Only owner can tally votes (121ms)
      ✓ Set correct winning proposal ID (110ms)
      
  79 passing (12s)

-------------|----------|----------|----------|----------|----------------|
File         |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
-------------|----------|----------|----------|----------|----------------|
 contracts/  |      100 |    96.43 |      100 |      100 |                |
  Voting.sol |      100 |    96.43 |      100 |      100 |                |
-------------|----------|----------|----------|----------|----------------|
All files    |      100 |    96.43 |      100 |      100 |                |
-------------|----------|----------|----------|----------|----------------|

````

