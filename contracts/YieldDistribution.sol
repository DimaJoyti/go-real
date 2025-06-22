// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./RealEstateNFT.sol";

/**
 * @title YieldDistribution
 * @dev Contract for distributing rental yields and property income to NFT shareholders
 */
contract YieldDistribution is ReentrancyGuard, Ownable {
    using SafeMath for uint256;
    
    RealEstateNFT public immutable realEstateNFT;
    
    struct YieldPool {
        uint256 tokenId;
        uint256 totalYield; // Total yield accumulated
        uint256 distributedYield; // Total yield already distributed
        uint256 lastDistribution; // Timestamp of last distribution
        uint256 yieldPerShare; // Accumulated yield per share
        mapping(address => uint256) userYieldDebt; // User's yield debt
        mapping(address => uint256) pendingYield; // User's pending yield
        bool isActive;
    }
    
    struct YieldDistributionEvent {
        uint256 tokenId;
        uint256 amount;
        uint256 timestamp;
        uint256 totalShares;
        string source; // "rental", "sale", "appreciation", etc.
    }
    
    // Mapping from token ID to yield pool
    mapping(uint256 => YieldPool) public yieldPools;
    
    // Mapping from token ID to distribution events
    mapping(uint256 => YieldDistributionEvent[]) public distributionHistory;
    
    // Mapping from user to token to claimed yield
    mapping(address => mapping(uint256 => uint256)) public userClaimedYield;
    
    // Platform fee for yield distribution (in basis points)
    uint256 public platformFee = 250; // 2.5%
    
    // Minimum yield amount for distribution
    uint256 public minimumDistribution = 0.01 ether;
    
    // Events
    event YieldDeposited(
        uint256 indexed tokenId,
        uint256 amount,
        string source,
        address indexed depositor
    );
    
    event YieldDistributed(
        uint256 indexed tokenId,
        uint256 totalAmount,
        uint256 platformFeeAmount,
        uint256 shareholderAmount,
        uint256 totalShares
    );
    
    event YieldClaimed(
        address indexed user,
        uint256 indexed tokenId,
        uint256 amount
    );
    
    event YieldPoolCreated(
        uint256 indexed tokenId,
        address indexed creator
    );
    
    event PlatformFeeUpdated(
        uint256 oldFee,
        uint256 newFee
    );

    constructor(RealEstateNFT _realEstateNFT) {
        realEstateNFT = _realEstateNFT;
    }
    
    /**
     * @dev Create a yield pool for a property
     */
    function createYieldPool(uint256 tokenId) public {
        require(realEstateNFT.ownerOf(tokenId) == msg.sender, "Only property owner can create yield pool");
        require(!yieldPools[tokenId].isActive, "Yield pool already exists");
        
        YieldPool storage pool = yieldPools[tokenId];
        pool.tokenId = tokenId;
        pool.totalYield = 0;
        pool.distributedYield = 0;
        pool.lastDistribution = block.timestamp;
        pool.yieldPerShare = 0;
        pool.isActive = true;
        
        emit YieldPoolCreated(tokenId, msg.sender);
    }
    
    /**
     * @dev Deposit yield for a property
     */
    function depositYield(
        uint256 tokenId,
        string memory source
    ) public payable nonReentrant {
        require(msg.value > 0, "Yield amount must be greater than 0");
        require(yieldPools[tokenId].isActive, "Yield pool not active");
        
        YieldPool storage pool = yieldPools[tokenId];
        pool.totalYield = pool.totalYield.add(msg.value);
        
        emit YieldDeposited(tokenId, msg.value, source, msg.sender);
        
        // Auto-distribute if above minimum threshold
        if (msg.value >= minimumDistribution) {
            _distributeYield(tokenId, msg.value);
        }
    }
    
    /**
     * @dev Distribute accumulated yield to shareholders
     */
    function distributeYield(uint256 tokenId) public nonReentrant {
        require(yieldPools[tokenId].isActive, "Yield pool not active");
        
        YieldPool storage pool = yieldPools[tokenId];
        uint256 pendingYield = pool.totalYield.sub(pool.distributedYield);
        require(pendingYield >= minimumDistribution, "Insufficient yield to distribute");
        
        _distributeYield(tokenId, pendingYield);
    }
    
    /**
     * @dev Internal function to distribute yield
     */
    function _distributeYield(uint256 tokenId, uint256 amount) internal {
        YieldPool storage pool = yieldPools[tokenId];
        uint256 totalShares = realEstateNFT.totalSharesIssued(tokenId);
        
        require(totalShares > 0, "No shares issued");
        
        // Calculate platform fee
        uint256 feeAmount = amount.mul(platformFee).div(10000);
        uint256 shareholderAmount = amount.sub(feeAmount);
        
        // Update yield per share
        uint256 yieldPerShareIncrease = shareholderAmount.mul(1e18).div(totalShares);
        pool.yieldPerShare = pool.yieldPerShare.add(yieldPerShareIncrease);
        
        // Update pool state
        pool.distributedYield = pool.distributedYield.add(amount);
        pool.lastDistribution = block.timestamp;
        
        // Transfer platform fee
        if (feeAmount > 0) {
            payable(owner()).transfer(feeAmount);
        }
        
        // Record distribution event
        distributionHistory[tokenId].push(YieldDistributionEvent({
            tokenId: tokenId,
            amount: shareholderAmount,
            timestamp: block.timestamp,
            totalShares: totalShares,
            source: "distribution"
        }));
        
        emit YieldDistributed(tokenId, amount, feeAmount, shareholderAmount, totalShares);
    }
    
    /**
     * @dev Calculate pending yield for a user
     */
    function pendingYield(address user, uint256 tokenId) public view returns (uint256) {
        YieldPool storage pool = yieldPools[tokenId];
        uint256 userShares = realEstateNFT.userShares(user, tokenId);
        
        if (userShares == 0) {
            return 0;
        }
        
        uint256 accumulatedYield = userShares.mul(pool.yieldPerShare).div(1e18);
        uint256 userDebt = pool.userYieldDebt[user];
        
        if (accumulatedYield > userDebt) {
            return accumulatedYield.sub(userDebt);
        }
        
        return 0;
    }
    
    /**
     * @dev Claim pending yield
     */
    function claimYield(uint256 tokenId) public nonReentrant {
        require(yieldPools[tokenId].isActive, "Yield pool not active");
        
        uint256 pending = pendingYield(msg.sender, tokenId);
        require(pending > 0, "No pending yield");
        
        YieldPool storage pool = yieldPools[tokenId];
        uint256 userShares = realEstateNFT.userShares(msg.sender, tokenId);
        
        // Update user's yield debt
        pool.userYieldDebt[msg.sender] = userShares.mul(pool.yieldPerShare).div(1e18);
        
        // Update claimed yield tracking
        userClaimedYield[msg.sender][tokenId] = userClaimedYield[msg.sender][tokenId].add(pending);
        
        // Transfer yield to user
        payable(msg.sender).transfer(pending);
        
        emit YieldClaimed(msg.sender, tokenId, pending);
    }
    
    /**
     * @dev Claim yield for multiple properties
     */
    function claimMultipleYields(uint256[] memory tokenIds) public nonReentrant {
        uint256 totalClaim = 0;
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            require(yieldPools[tokenId].isActive, "Yield pool not active");
            
            uint256 pending = pendingYield(msg.sender, tokenId);
            if (pending > 0) {
                YieldPool storage pool = yieldPools[tokenId];
                uint256 userShares = realEstateNFT.userShares(msg.sender, tokenId);
                
                // Update user's yield debt
                pool.userYieldDebt[msg.sender] = userShares.mul(pool.yieldPerShare).div(1e18);
                
                // Update claimed yield tracking
                userClaimedYield[msg.sender][tokenId] = userClaimedYield[msg.sender][tokenId].add(pending);
                
                totalClaim = totalClaim.add(pending);
                
                emit YieldClaimed(msg.sender, tokenId, pending);
            }
        }
        
        require(totalClaim > 0, "No pending yield to claim");
        payable(msg.sender).transfer(totalClaim);
    }
    
    /**
     * @dev Update user's yield debt when shares change
     */
    function updateUserYieldDebt(address user, uint256 tokenId) external {
        require(msg.sender == address(realEstateNFT), "Only RealEstateNFT contract");
        
        if (!yieldPools[tokenId].isActive) {
            return;
        }
        
        YieldPool storage pool = yieldPools[tokenId];
        uint256 userShares = realEstateNFT.userShares(user, tokenId);
        
        // Calculate and add pending yield before updating debt
        uint256 pending = pendingYield(user, tokenId);
        if (pending > 0) {
            pool.pendingYield[user] = pool.pendingYield[user].add(pending);
        }
        
        // Update yield debt
        pool.userYieldDebt[user] = userShares.mul(pool.yieldPerShare).div(1e18);
    }
    
    /**
     * @dev Get yield pool information
     */
    function getYieldPool(uint256 tokenId) public view returns (
        uint256 totalYield,
        uint256 distributedYield,
        uint256 lastDistribution,
        uint256 yieldPerShare,
        bool isActive
    ) {
        YieldPool storage pool = yieldPools[tokenId];
        return (
            pool.totalYield,
            pool.distributedYield,
            pool.lastDistribution,
            pool.yieldPerShare,
            pool.isActive
        );
    }
    
    /**
     * @dev Get distribution history for a property
     */
    function getDistributionHistory(uint256 tokenId) public view returns (YieldDistributionEvent[] memory) {
        return distributionHistory[tokenId];
    }
    
    /**
     * @dev Get user's total claimed yield for a property
     */
    function getUserClaimedYield(address user, uint256 tokenId) public view returns (uint256) {
        return userClaimedYield[user][tokenId];
    }
    
    /**
     * @dev Set platform fee (only owner)
     */
    function setPlatformFee(uint256 _platformFee) public onlyOwner {
        require(_platformFee <= 1000, "Platform fee cannot exceed 10%");
        
        uint256 oldFee = platformFee;
        platformFee = _platformFee;
        
        emit PlatformFeeUpdated(oldFee, _platformFee);
    }
    
    /**
     * @dev Set minimum distribution amount (only owner)
     */
    function setMinimumDistribution(uint256 _minimumDistribution) public onlyOwner {
        minimumDistribution = _minimumDistribution;
    }
    
    /**
     * @dev Emergency withdrawal (only owner)
     */
    function emergencyWithdraw(uint256 amount) public onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        payable(owner()).transfer(amount);
    }
    
    /**
     * @dev Get contract balance
     */
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
    
    // Allow contract to receive ETH
    receive() external payable {
        // ETH received for yield distribution
    }
}
