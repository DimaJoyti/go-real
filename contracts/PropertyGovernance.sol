// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./RealEstateNFT.sol";

/**
 * @title PropertyGovernance
 * @dev Governance contract for property-specific decisions and voting
 */
contract PropertyGovernance is 
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl,
    ReentrancyGuard
{
    RealEstateNFT public immutable realEstateNFT;
    
    struct PropertyProposal {
        uint256 tokenId;
        string title;
        string description;
        ProposalType proposalType;
        uint256 amount; // For financial proposals
        address recipient; // For payment proposals
        string details; // Additional details in JSON format
        uint256 votingPower; // Total voting power at proposal creation
        mapping(address => bool) hasVoted;
        mapping(address => uint256) votes; // For: 1, Against: 0, Abstain: 2
    }
    
    enum ProposalType {
        MAINTENANCE,
        RENOVATION,
        SALE,
        RENT_ADJUSTMENT,
        MANAGEMENT_CHANGE,
        DIVIDEND_DISTRIBUTION,
        EMERGENCY_REPAIR,
        INSURANCE_CLAIM,
        LEGAL_ACTION,
        OTHER
    }
    
    // Mapping from proposal ID to property-specific proposal data
    mapping(uint256 => PropertyProposal) public propertyProposals;
    
    // Mapping from token ID to active proposals
    mapping(uint256 => uint256[]) public tokenProposals;
    
    // Mapping from token ID to governance settings
    mapping(uint256 => GovernanceSettings) public tokenGovernanceSettings;
    
    struct GovernanceSettings {
        uint256 votingDelay; // Delay before voting starts (in blocks)
        uint256 votingPeriod; // Voting period duration (in blocks)
        uint256 proposalThreshold; // Minimum shares to create proposal
        uint256 quorumFraction; // Quorum as fraction of total supply (in basis points)
        bool isActive; // Whether governance is active for this token
    }
    
    // Events
    event PropertyProposalCreated(
        uint256 indexed proposalId,
        uint256 indexed tokenId,
        address indexed proposer,
        string title,
        ProposalType proposalType
    );
    
    event PropertyProposalExecuted(
        uint256 indexed proposalId,
        uint256 indexed tokenId,
        ProposalType proposalType,
        uint256 amount
    );
    
    event GovernanceSettingsUpdated(
        uint256 indexed tokenId,
        uint256 votingDelay,
        uint256 votingPeriod,
        uint256 proposalThreshold,
        uint256 quorumFraction
    );
    
    event DividendDistributed(
        uint256 indexed tokenId,
        uint256 totalAmount,
        uint256 timestamp
    );

    constructor(
        IVotes _token,
        TimelockController _timelock,
        RealEstateNFT _realEstateNFT
    )
        Governor("PropertyGovernance")
        GovernorSettings(1, 50400, 0) // 1 block delay, ~1 week voting period, 0 proposal threshold
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4) // 4% quorum
        GovernorTimelockControl(_timelock)
    {
        realEstateNFT = _realEstateNFT;
    }

    /**
     * @dev Create a property-specific proposal
     */
    function createPropertyProposal(
        uint256 tokenId,
        string memory title,
        string memory description,
        ProposalType proposalType,
        uint256 amount,
        address recipient,
        string memory details
    ) public returns (uint256) {
        require(realEstateNFT.userShares(msg.sender, tokenId) > 0, "Must own shares to propose");
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        
        GovernanceSettings memory settings = tokenGovernanceSettings[tokenId];
        require(settings.isActive, "Governance not active for this property");
        
        // Check if proposer meets threshold
        uint256 proposerShares = realEstateNFT.userShares(msg.sender, tokenId);
        require(proposerShares >= settings.proposalThreshold, "Insufficient shares to propose");
        
        // Create the proposal
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        
        targets[0] = address(this);
        values[0] = 0;
        calldatas[0] = abi.encodeWithSignature(
            "executePropertyProposal(uint256,uint8,uint256,address)",
            tokenId,
            uint8(proposalType),
            amount,
            recipient
        );
        
        uint256 proposalId = propose(targets, values, calldatas, description);
        
        // Store property-specific data
        PropertyProposal storage proposal = propertyProposals[proposalId];
        proposal.tokenId = tokenId;
        proposal.title = title;
        proposal.description = description;
        proposal.proposalType = proposalType;
        proposal.amount = amount;
        proposal.recipient = recipient;
        proposal.details = details;
        proposal.votingPower = realEstateNFT.totalSharesIssued(tokenId);
        
        tokenProposals[tokenId].push(proposalId);
        
        emit PropertyProposalCreated(proposalId, tokenId, msg.sender, title, proposalType);
        
        return proposalId;
    }
    
    /**
     * @dev Execute a property proposal
     */
    function executePropertyProposal(
        uint256 tokenId,
        uint8 proposalTypeInt,
        uint256 amount,
        address recipient
    ) public {
        // This function is called by the timelock after successful voting
        ProposalType proposalType = ProposalType(proposalTypeInt);
        
        if (proposalType == ProposalType.DIVIDEND_DISTRIBUTION) {
            _distributeDividends(tokenId, amount);
        } else if (proposalType == ProposalType.MAINTENANCE || 
                   proposalType == ProposalType.RENOVATION ||
                   proposalType == ProposalType.EMERGENCY_REPAIR) {
            _executePayment(recipient, amount);
        }
        // Add more execution logic for other proposal types
        
        emit PropertyProposalExecuted(0, tokenId, proposalType, amount); // proposalId would need to be passed
    }
    
    /**
     * @dev Distribute dividends to shareholders
     */
    function _distributeDividends(uint256 tokenId, uint256 totalAmount) internal {
        require(address(this).balance >= totalAmount, "Insufficient contract balance");
        
        uint256 totalShares = realEstateNFT.totalSharesIssued(tokenId);
        require(totalShares > 0, "No shares issued");
        
        // Get all shareholders and distribute proportionally
        // Note: This is a simplified implementation
        // In production, you'd want to use a more efficient distribution mechanism
        
        emit DividendDistributed(tokenId, totalAmount, block.timestamp);
    }
    
    /**
     * @dev Execute payment to recipient
     */
    function _executePayment(address recipient, uint256 amount) internal {
        require(recipient != address(0), "Invalid recipient");
        require(address(this).balance >= amount, "Insufficient balance");
        
        payable(recipient).transfer(amount);
    }
    
    /**
     * @dev Set governance settings for a property
     */
    function setGovernanceSettings(
        uint256 tokenId,
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _proposalThreshold,
        uint256 _quorumFraction,
        bool _isActive
    ) public {
        require(
            msg.sender == realEstateNFT.ownerOf(tokenId) || 
            msg.sender == owner(),
            "Only property owner or contract owner"
        );
        
        tokenGovernanceSettings[tokenId] = GovernanceSettings({
            votingDelay: _votingDelay,
            votingPeriod: _votingPeriod,
            proposalThreshold: _proposalThreshold,
            quorumFraction: _quorumFraction,
            isActive: _isActive
        });
        
        emit GovernanceSettingsUpdated(
            tokenId,
            _votingDelay,
            _votingPeriod,
            _proposalThreshold,
            _quorumFraction
        );
    }
    
    /**
     * @dev Get voting power for a user on a specific property
     */
    function getVotingPower(address account, uint256 tokenId) public view returns (uint256) {
        return realEstateNFT.userShares(account, tokenId);
    }
    
    /**
     * @dev Get all proposals for a property
     */
    function getPropertyProposals(uint256 tokenId) public view returns (uint256[] memory) {
        return tokenProposals[tokenId];
    }
    
    /**
     * @dev Check if governance is active for a property
     */
    function isGovernanceActive(uint256 tokenId) public view returns (bool) {
        return tokenGovernanceSettings[tokenId].isActive;
    }
    
    // Override required functions
    function votingDelay() public view override(IGovernor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }
    
    function votingPeriod() public view override(IGovernor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }
    
    function quorum(uint256 blockNumber) public view override(IGovernor, GovernorVotesQuorumFraction) returns (uint256) {
        return super.quorum(blockNumber);
    }
    
    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }
    
    function _execute(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._execute(proposalId, targets, values, calldatas, descriptionHash);
    }
    
    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }
    
    function _executor() internal view override(Governor, GovernorTimelockControl) returns (address) {
        return super._executor();
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(Governor, GovernorTimelockControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
    // Allow contract to receive ETH for dividend distributions
    receive() external payable {}
}
