// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title ChallengeRewards
 * @dev Smart contract for managing challenge rewards and distributions
 */
contract ChallengeRewards is ReentrancyGuard, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _challengeIdCounter;

    struct Challenge {
        uint256 challengeId;
        string title;
        address creator;
        uint256 rewardPool;
        uint256 startTime;
        uint256 endTime;
        uint256 maxParticipants;
        uint256 currentParticipants;
        bool isActive;
        bool rewardsDistributed;
        RewardDistribution rewardDistribution;
    }

    struct RewardDistribution {
        uint256 firstPlace;    // Percentage in basis points
        uint256 secondPlace;   // Percentage in basis points
        uint256 thirdPlace;    // Percentage in basis points
        uint256 participation; // Percentage in basis points for all participants
    }

    struct Participant {
        address participant;
        uint256 joinedAt;
        uint256 score;
        bool hasSubmitted;
        string submissionHash; // IPFS hash of submission
    }

    // Mapping from challenge ID to challenge details
    mapping(uint256 => Challenge) public challenges;
    
    // Mapping from challenge ID to participants
    mapping(uint256 => Participant[]) public challengeParticipants;
    
    // Mapping from challenge ID and participant address to participant index
    mapping(uint256 => mapping(address => uint256)) public participantIndex;
    
    // Mapping from challenge ID to winners
    mapping(uint256 => address[]) public challengeWinners;
    
    // Mapping to track if user is participating in a challenge
    mapping(uint256 => mapping(address => bool)) public isParticipating;

    // Events
    event ChallengeCreated(
        uint256 indexed challengeId,
        address indexed creator,
        string title,
        uint256 rewardPool,
        uint256 startTime,
        uint256 endTime
    );

    event ParticipantJoined(
        uint256 indexed challengeId,
        address indexed participant,
        uint256 joinedAt
    );

    event SubmissionMade(
        uint256 indexed challengeId,
        address indexed participant,
        string submissionHash
    );

    event ScoreUpdated(
        uint256 indexed challengeId,
        address indexed participant,
        uint256 score
    );

    event RewardsDistributed(
        uint256 indexed challengeId,
        address[] winners,
        uint256[] amounts
    );

    event ChallengeCompleted(uint256 indexed challengeId);

    constructor() {}

    /**
     * @dev Create a new challenge
     */
    function createChallenge(
        string memory title,
        uint256 startTime,
        uint256 endTime,
        uint256 maxParticipants,
        RewardDistribution memory rewardDist
    ) public payable returns (uint256) {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(startTime > block.timestamp, "Start time must be in the future");
        require(endTime > startTime, "End time must be after start time");
        require(maxParticipants > 0, "Max participants must be greater than 0");
        require(msg.value > 0, "Reward pool must be greater than 0");
        
        // Validate reward distribution (should total 100% or 10000 basis points)
        uint256 totalDistribution = rewardDist.firstPlace + rewardDist.secondPlace + 
                                   rewardDist.thirdPlace + rewardDist.participation;
        require(totalDistribution <= 10000, "Total distribution cannot exceed 100%");

        uint256 challengeId = _challengeIdCounter.current();
        _challengeIdCounter.increment();

        challenges[challengeId] = Challenge({
            challengeId: challengeId,
            title: title,
            creator: msg.sender,
            rewardPool: msg.value,
            startTime: startTime,
            endTime: endTime,
            maxParticipants: maxParticipants,
            currentParticipants: 0,
            isActive: true,
            rewardsDistributed: false,
            rewardDistribution: rewardDist
        });

        emit ChallengeCreated(challengeId, msg.sender, title, msg.value, startTime, endTime);
        return challengeId;
    }

    /**
     * @dev Join a challenge
     */
    function joinChallenge(uint256 challengeId) public {
        Challenge storage challenge = challenges[challengeId];
        require(challenge.isActive, "Challenge is not active");
        require(block.timestamp >= challenge.startTime, "Challenge has not started");
        require(block.timestamp <= challenge.endTime, "Challenge has ended");
        require(!isParticipating[challengeId][msg.sender], "Already participating");
        require(
            challenge.currentParticipants < challenge.maxParticipants,
            "Challenge is full"
        );

        challengeParticipants[challengeId].push(Participant({
            participant: msg.sender,
            joinedAt: block.timestamp,
            score: 0,
            hasSubmitted: false,
            submissionHash: ""
        }));

        participantIndex[challengeId][msg.sender] = challengeParticipants[challengeId].length - 1;
        isParticipating[challengeId][msg.sender] = true;
        challenge.currentParticipants++;

        emit ParticipantJoined(challengeId, msg.sender, block.timestamp);
    }

    /**
     * @dev Submit entry for a challenge
     */
    function submitEntry(uint256 challengeId, string memory submissionHash) public {
        require(isParticipating[challengeId][msg.sender], "Not participating in challenge");
        
        Challenge storage challenge = challenges[challengeId];
        require(challenge.isActive, "Challenge is not active");
        require(block.timestamp <= challenge.endTime, "Challenge has ended");

        uint256 index = participantIndex[challengeId][msg.sender];
        Participant storage participant = challengeParticipants[challengeId][index];
        
        participant.submissionHash = submissionHash;
        participant.hasSubmitted = true;

        emit SubmissionMade(challengeId, msg.sender, submissionHash);
    }

    /**
     * @dev Update participant score (only challenge creator or owner)
     */
    function updateScore(
        uint256 challengeId,
        address participant,
        uint256 score
    ) public {
        Challenge storage challenge = challenges[challengeId];
        require(
            msg.sender == challenge.creator || msg.sender == owner(),
            "Only creator or owner can update scores"
        );
        require(isParticipating[challengeId][participant], "Address is not participating");

        uint256 index = participantIndex[challengeId][participant];
        challengeParticipants[challengeId][index].score = score;

        emit ScoreUpdated(challengeId, participant, score);
    }

    /**
     * @dev Complete challenge and distribute rewards
     */
    function completeChallenge(uint256 challengeId) public nonReentrant {
        Challenge storage challenge = challenges[challengeId];
        require(
            msg.sender == challenge.creator || msg.sender == owner(),
            "Only creator or owner can complete challenge"
        );
        require(challenge.isActive, "Challenge is not active");
        require(block.timestamp > challenge.endTime, "Challenge has not ended");
        require(!challenge.rewardsDistributed, "Rewards already distributed");

        // Sort participants by score (descending)
        Participant[] memory participants = challengeParticipants[challengeId];
        _sortParticipantsByScore(participants);

        // Determine winners and distribute rewards
        address[] memory winners = new address[](3);
        uint256[] memory amounts = new uint256[](participants.length);
        uint256 totalDistributed = 0;

        // Distribute top 3 rewards
        if (participants.length > 0 && participants[0].hasSubmitted) {
            winners[0] = participants[0].participant;
            amounts[0] = (challenge.rewardPool * challenge.rewardDistribution.firstPlace) / 10000;
            totalDistributed += amounts[0];
            if (amounts[0] > 0) {
                payable(winners[0]).transfer(amounts[0]);
            }
        }

        if (participants.length > 1 && participants[1].hasSubmitted) {
            winners[1] = participants[1].participant;
            amounts[1] = (challenge.rewardPool * challenge.rewardDistribution.secondPlace) / 10000;
            totalDistributed += amounts[1];
            if (amounts[1] > 0) {
                payable(winners[1]).transfer(amounts[1]);
            }
        }

        if (participants.length > 2 && participants[2].hasSubmitted) {
            winners[2] = participants[2].participant;
            amounts[2] = (challenge.rewardPool * challenge.rewardDistribution.thirdPlace) / 10000;
            totalDistributed += amounts[2];
            if (amounts[2] > 0) {
                payable(winners[2]).transfer(amounts[2]);
            }
        }

        // Distribute participation rewards
        uint256 participationReward = (challenge.rewardPool * challenge.rewardDistribution.participation) / 10000;
        if (participationReward > 0 && participants.length > 0) {
            uint256 rewardPerParticipant = participationReward / participants.length;
            for (uint256 i = 0; i < participants.length; i++) {
                if (participants[i].hasSubmitted) {
                    payable(participants[i].participant).transfer(rewardPerParticipant);
                    totalDistributed += rewardPerParticipant;
                }
            }
        }

        // Return remaining funds to creator
        uint256 remaining = challenge.rewardPool - totalDistributed;
        if (remaining > 0) {
            payable(challenge.creator).transfer(remaining);
        }

        challenge.isActive = false;
        challenge.rewardsDistributed = true;
        challengeWinners[challengeId] = winners;

        emit RewardsDistributed(challengeId, winners, amounts);
        emit ChallengeCompleted(challengeId);
    }

    /**
     * @dev Get challenge details
     */
    function getChallenge(uint256 challengeId) public view returns (Challenge memory) {
        return challenges[challengeId];
    }

    /**
     * @dev Get challenge participants
     */
    function getChallengeParticipants(uint256 challengeId) public view returns (Participant[] memory) {
        return challengeParticipants[challengeId];
    }

    /**
     * @dev Get challenge winners
     */
    function getChallengeWinners(uint256 challengeId) public view returns (address[] memory) {
        return challengeWinners[challengeId];
    }

    /**
     * @dev Check if challenge has ended
     */
    function hasChallengeEnded(uint256 challengeId) public view returns (bool) {
        return block.timestamp > challenges[challengeId].endTime;
    }

    /**
     * @dev Sort participants by score (bubble sort for simplicity)
     */
    function _sortParticipantsByScore(Participant[] memory participants) private pure {
        uint256 length = participants.length;
        for (uint256 i = 0; i < length - 1; i++) {
            for (uint256 j = 0; j < length - i - 1; j++) {
                if (participants[j].score < participants[j + 1].score) {
                    Participant memory temp = participants[j];
                    participants[j] = participants[j + 1];
                    participants[j + 1] = temp;
                }
            }
        }
    }

    /**
     * @dev Emergency function to cancel challenge and refund (only owner)
     */
    function emergencyCancelChallenge(uint256 challengeId) public onlyOwner {
        Challenge storage challenge = challenges[challengeId];
        require(challenge.isActive, "Challenge is not active");
        require(!challenge.rewardsDistributed, "Rewards already distributed");

        challenge.isActive = false;
        payable(challenge.creator).transfer(challenge.rewardPool);
    }
}
