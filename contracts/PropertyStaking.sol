// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./RealEstateNFT.sol";

/**
 * @title PropertyStaking
 * @dev Staking contract for property NFT shares to earn additional rewards
 */
contract PropertyStaking is ReentrancyGuard, Ownable {
    using SafeMath for uint256;
    
    RealEstateNFT public immutable realEstateNFT;
    IERC20 public rewardToken; // Optional reward token (can be platform token)
    
    struct StakingPool {
        uint256 tokenId;
        uint256 totalStaked; // Total shares staked
        uint256 rewardRate; // Reward per second per staked share
        uint256 lastUpdateTime;
        uint256 rewardPerShareStored;
        uint256 periodFinish; // When current reward period ends
        uint256 rewardDuration; // Duration of reward period
        bool isActive;
        mapping(address => UserStake) userStakes;
    }
    
    struct UserStake {
        uint256 amount; // Amount of shares staked
        uint256 rewardPerSharePaid;
        uint256 rewards; // Pending rewards
        uint256 stakingTime; // When user started staking
        uint256 lockPeriod; // Lock period in seconds
    }
    
    struct StakingTier {
        uint256 minStakeAmount;
        uint256 lockPeriod; // in seconds
        uint256 rewardMultiplier; // in basis points (10000 = 1x)
        string name;
    }
    
    // Mapping from token ID to staking pool
    mapping(uint256 => StakingPool) public stakingPools;
    
    // Staking tiers for different lock periods
    StakingTier[] public stakingTiers;
    
    // Mapping from user to token to staking tier
    mapping(address => mapping(uint256 => uint256)) public userStakingTier;
    
    // Platform settings
    uint256 public defaultRewardRate = 1e15; // 0.001 tokens per second per share
    uint256 public defaultRewardDuration = 30 days;
    uint256 public earlyWithdrawalPenalty = 1000; // 10% penalty in basis points
    
    // Events
    event Staked(
        address indexed user,
        uint256 indexed tokenId,
        uint256 amount,
        uint256 tier
    );
    
    event Withdrawn(
        address indexed user,
        uint256 indexed tokenId,
        uint256 amount,
        uint256 penalty
    );
    
    event RewardPaid(
        address indexed user,
        uint256 indexed tokenId,
        uint256 reward
    );
    
    event StakingPoolCreated(
        uint256 indexed tokenId,
        uint256 rewardRate,
        uint256 rewardDuration
    );
    
    event RewardRateUpdated(
        uint256 indexed tokenId,
        uint256 newRewardRate
    );
    
    event StakingTierAdded(
        uint256 tierIndex,
        uint256 minStakeAmount,
        uint256 lockPeriod,
        uint256 rewardMultiplier,
        string name
    );

    constructor(RealEstateNFT _realEstateNFT, IERC20 _rewardToken) {
        realEstateNFT = _realEstateNFT;
        rewardToken = _rewardToken;
        
        // Initialize default staking tiers
        _initializeStakingTiers();
    }
    
    /**
     * @dev Initialize default staking tiers
     */
    function _initializeStakingTiers() internal {
        // Flexible tier - no lock, standard rewards
        stakingTiers.push(StakingTier({
            minStakeAmount: 1,
            lockPeriod: 0,
            rewardMultiplier: 10000, // 1x
            name: "Flexible"
        }));
        
        // 30-day lock tier
        stakingTiers.push(StakingTier({
            minStakeAmount: 10,
            lockPeriod: 30 days,
            rewardMultiplier: 12000, // 1.2x
            name: "30-Day Lock"
        }));
        
        // 90-day lock tier
        stakingTiers.push(StakingTier({
            minStakeAmount: 50,
            lockPeriod: 90 days,
            rewardMultiplier: 15000, // 1.5x
            name: "90-Day Lock"
        }));
        
        // 180-day lock tier
        stakingTiers.push(StakingTier({
            minStakeAmount: 100,
            lockPeriod: 180 days,
            rewardMultiplier: 20000, // 2x
            name: "180-Day Lock"
        }));
    }
    
    /**
     * @dev Create a staking pool for a property
     */
    function createStakingPool(
        uint256 tokenId,
        uint256 rewardRate,
        uint256 rewardDuration
    ) public {
        require(
            realEstateNFT.ownerOf(tokenId) == msg.sender || msg.sender == owner(),
            "Only property owner or contract owner"
        );
        require(!stakingPools[tokenId].isActive, "Staking pool already exists");
        
        StakingPool storage pool = stakingPools[tokenId];
        pool.tokenId = tokenId;
        pool.totalStaked = 0;
        pool.rewardRate = rewardRate > 0 ? rewardRate : defaultRewardRate;
        pool.lastUpdateTime = block.timestamp;
        pool.rewardPerShareStored = 0;
        pool.periodFinish = block.timestamp.add(rewardDuration > 0 ? rewardDuration : defaultRewardDuration);
        pool.rewardDuration = rewardDuration > 0 ? rewardDuration : defaultRewardDuration;
        pool.isActive = true;
        
        emit StakingPoolCreated(tokenId, pool.rewardRate, pool.rewardDuration);
    }
    
    /**
     * @dev Stake shares in a property
     */
    function stake(uint256 tokenId, uint256 amount, uint256 tierIndex) public nonReentrant updateReward(msg.sender, tokenId) {
        require(amount > 0, "Cannot stake 0");
        require(stakingPools[tokenId].isActive, "Staking pool not active");
        require(tierIndex < stakingTiers.length, "Invalid staking tier");
        require(realEstateNFT.userShares(msg.sender, tokenId) >= amount, "Insufficient shares");
        
        StakingTier memory tier = stakingTiers[tierIndex];
        require(amount >= tier.minStakeAmount, "Amount below minimum for tier");
        
        StakingPool storage pool = stakingPools[tokenId];
        UserStake storage userStake = pool.userStakes[msg.sender];
        
        // Transfer shares to staking contract (this would need to be implemented in RealEstateNFT)
        // For now, we'll track it logically
        
        userStake.amount = userStake.amount.add(amount);
        userStake.stakingTime = block.timestamp;
        userStake.lockPeriod = tier.lockPeriod;
        
        pool.totalStaked = pool.totalStaked.add(amount);
        userStakingTier[msg.sender][tokenId] = tierIndex;
        
        emit Staked(msg.sender, tokenId, amount, tierIndex);
    }
    
    /**
     * @dev Withdraw staked shares
     */
    function withdraw(uint256 tokenId, uint256 amount) public nonReentrant updateReward(msg.sender, tokenId) {
        require(amount > 0, "Cannot withdraw 0");
        
        StakingPool storage pool = stakingPools[tokenId];
        UserStake storage userStake = pool.userStakes[msg.sender];
        require(userStake.amount >= amount, "Insufficient staked amount");
        
        uint256 penalty = 0;
        
        // Check if lock period has passed
        if (userStake.lockPeriod > 0 && block.timestamp < userStake.stakingTime.add(userStake.lockPeriod)) {
            // Early withdrawal penalty
            penalty = amount.mul(earlyWithdrawalPenalty).div(10000);
        }
        
        userStake.amount = userStake.amount.sub(amount);
        pool.totalStaked = pool.totalStaked.sub(amount);
        
        // Transfer shares back to user (minus penalty if applicable)
        uint256 withdrawAmount = amount.sub(penalty);
        
        emit Withdrawn(msg.sender, tokenId, withdrawAmount, penalty);
    }
    
    /**
     * @dev Claim staking rewards
     */
    function getReward(uint256 tokenId) public nonReentrant updateReward(msg.sender, tokenId) {
        StakingPool storage pool = stakingPools[tokenId];
        UserStake storage userStake = pool.userStakes[msg.sender];
        uint256 reward = userStake.rewards;
        
        if (reward > 0) {
            userStake.rewards = 0;
            
            // Apply tier multiplier
            uint256 tierIndex = userStakingTier[msg.sender][tokenId];
            StakingTier memory tier = stakingTiers[tierIndex];
            reward = reward.mul(tier.rewardMultiplier).div(10000);
            
            // Transfer reward (ETH or token)
            if (address(rewardToken) != address(0)) {
                rewardToken.transfer(msg.sender, reward);
            } else {
                payable(msg.sender).transfer(reward);
            }
            
            emit RewardPaid(msg.sender, tokenId, reward);
        }
    }
    
    /**
     * @dev Exit staking (withdraw all and claim rewards)
     */
    function exit(uint256 tokenId) external {
        StakingPool storage pool = stakingPools[tokenId];
        UserStake storage userStake = pool.userStakes[msg.sender];
        
        withdraw(tokenId, userStake.amount);
        getReward(tokenId);
    }
    
    /**
     * @dev Calculate earned rewards for a user
     */
    function earned(address account, uint256 tokenId) public view returns (uint256) {
        StakingPool storage pool = stakingPools[tokenId];
        UserStake storage userStake = pool.userStakes[account];
        
        uint256 rewardPerShare = rewardPerShareStored(tokenId);
        uint256 tierIndex = userStakingTier[account][tokenId];
        StakingTier memory tier = stakingTiers[tierIndex];
        
        uint256 baseReward = userStake.amount
            .mul(rewardPerShare.sub(userStake.rewardPerSharePaid))
            .div(1e18)
            .add(userStake.rewards);
            
        return baseReward.mul(tier.rewardMultiplier).div(10000);
    }
    
    /**
     * @dev Calculate current reward per share
     */
    function rewardPerShareStored(uint256 tokenId) public view returns (uint256) {
        StakingPool storage pool = stakingPools[tokenId];
        
        if (pool.totalStaked == 0) {
            return pool.rewardPerShareStored;
        }
        
        return pool.rewardPerShareStored.add(
            lastTimeRewardApplicable(tokenId)
                .sub(pool.lastUpdateTime)
                .mul(pool.rewardRate)
                .mul(1e18)
                .div(pool.totalStaked)
        );
    }
    
    /**
     * @dev Get last time reward is applicable
     */
    function lastTimeRewardApplicable(uint256 tokenId) public view returns (uint256) {
        StakingPool storage pool = stakingPools[tokenId];
        return block.timestamp < pool.periodFinish ? block.timestamp : pool.periodFinish;
    }
    
    /**
     * @dev Get user staking info
     */
    function getUserStake(address account, uint256 tokenId) public view returns (
        uint256 amount,
        uint256 rewards,
        uint256 stakingTime,
        uint256 lockPeriod,
        uint256 tierIndex
    ) {
        StakingPool storage pool = stakingPools[tokenId];
        UserStake storage userStake = pool.userStakes[account];
        
        return (
            userStake.amount,
            earned(account, tokenId),
            userStake.stakingTime,
            userStake.lockPeriod,
            userStakingTier[account][tokenId]
        );
    }
    
    /**
     * @dev Get staking pool info
     */
    function getStakingPool(uint256 tokenId) public view returns (
        uint256 totalStaked,
        uint256 rewardRate,
        uint256 periodFinish,
        uint256 rewardDuration,
        bool isActive
    ) {
        StakingPool storage pool = stakingPools[tokenId];
        return (
            pool.totalStaked,
            pool.rewardRate,
            pool.periodFinish,
            pool.rewardDuration,
            pool.isActive
        );
    }
    
    /**
     * @dev Add new staking tier
     */
    function addStakingTier(
        uint256 minStakeAmount,
        uint256 lockPeriod,
        uint256 rewardMultiplier,
        string memory name
    ) public onlyOwner {
        stakingTiers.push(StakingTier({
            minStakeAmount: minStakeAmount,
            lockPeriod: lockPeriod,
            rewardMultiplier: rewardMultiplier,
            name: name
        }));
        
        emit StakingTierAdded(
            stakingTiers.length - 1,
            minStakeAmount,
            lockPeriod,
            rewardMultiplier,
            name
        );
    }
    
    /**
     * @dev Update reward rate for a pool
     */
    function updateRewardRate(uint256 tokenId, uint256 newRewardRate) public onlyOwner updateReward(address(0), tokenId) {
        StakingPool storage pool = stakingPools[tokenId];
        pool.rewardRate = newRewardRate;
        
        emit RewardRateUpdated(tokenId, newRewardRate);
    }
    
    /**
     * @dev Modifier to update rewards
     */
    modifier updateReward(address account, uint256 tokenId) {
        StakingPool storage pool = stakingPools[tokenId];
        pool.rewardPerShareStored = rewardPerShareStored(tokenId);
        pool.lastUpdateTime = lastTimeRewardApplicable(tokenId);
        
        if (account != address(0)) {
            UserStake storage userStake = pool.userStakes[account];
            userStake.rewards = earned(account, tokenId);
            userStake.rewardPerSharePaid = pool.rewardPerShareStored;
        }
        _;
    }
    
    /**
     * @dev Get all staking tiers
     */
    function getStakingTiers() public view returns (StakingTier[] memory) {
        return stakingTiers;
    }
    
    // Allow contract to receive ETH for rewards
    receive() external payable {}
}
