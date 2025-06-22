import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'
import { toast } from 'react-hot-toast'

// Contract ABIs (simplified for demo)
const REAL_ESTATE_NFT_ABI = [
  "function mintProperty(string memory uri, uint256 totalValue, uint256 tokenSupply) public returns (uint256)",
  "function buyShares(uint256 tokenId, uint256 shares) public payable",
  "function sellShares(uint256 tokenId, uint256 shares) public",
  "function userShares(address user, uint256 tokenId) public view returns (uint256)",
  "function totalSharesIssued(uint256 tokenId) public view returns (uint256)",
  "function properties(uint256 tokenId) public view returns (tuple(uint256 totalValue, uint256 tokenSupply, uint256 pricePerShare, bool isActive))",
  "function getAvailableShares(uint256 tokenId) public view returns (uint256)",
  "function ownerOf(uint256 tokenId) public view returns (address)",
  "function tokenURI(uint256 tokenId) public view returns (string)",
  "event PropertyMinted(uint256 indexed tokenId, address indexed owner, uint256 totalValue, uint256 tokenSupply)",
  "event SharesPurchased(uint256 indexed tokenId, address indexed buyer, uint256 shares, uint256 totalCost)",
  "event SharesSold(uint256 indexed tokenId, address indexed seller, uint256 shares, uint256 totalReceived)"
]

const YIELD_DISTRIBUTION_ABI = [
  "function createYieldPool(uint256 tokenId) public",
  "function depositYield(uint256 tokenId, string memory source) public payable",
  "function claimYield(uint256 tokenId) public",
  "function pendingYield(address user, uint256 tokenId) public view returns (uint256)",
  "function getYieldPool(uint256 tokenId) public view returns (uint256, uint256, uint256, uint256, bool)",
  "event YieldDeposited(uint256 indexed tokenId, uint256 amount, string source, address indexed depositor)",
  "event YieldClaimed(address indexed user, uint256 indexed tokenId, uint256 amount)"
]

const PROPERTY_GOVERNANCE_ABI = [
  "function createPropertyProposal(uint256 tokenId, string memory title, string memory description, uint8 proposalType, uint256 amount, address recipient, string memory details) public returns (uint256)",
  "function castVote(uint256 proposalId, uint8 support) public",
  "function getVotingPower(address account, uint256 tokenId) public view returns (uint256)",
  "function isGovernanceActive(uint256 tokenId) public view returns (bool)",
  "event PropertyProposalCreated(uint256 indexed proposalId, uint256 indexed tokenId, address indexed proposer, string title, uint8 proposalType)"
]

const PROPERTY_STAKING_ABI = [
  "function stake(uint256 tokenId, uint256 amount, uint256 tierIndex) public",
  "function withdraw(uint256 tokenId, uint256 amount) public",
  "function getReward(uint256 tokenId) public",
  "function earned(address account, uint256 tokenId) public view returns (uint256)",
  "function getUserStake(address account, uint256 tokenId) public view returns (uint256, uint256, uint256, uint256, uint256)",
  "event Staked(address indexed user, uint256 indexed tokenId, uint256 amount, uint256 tier)"
]

// Contract addresses (would be environment variables in production)
const CONTRACT_ADDRESSES = {
  REAL_ESTATE_NFT: process.env.NEXT_PUBLIC_REAL_ESTATE_NFT_ADDRESS || '0x...',
  YIELD_DISTRIBUTION: process.env.NEXT_PUBLIC_YIELD_DISTRIBUTION_ADDRESS || '0x...',
  PROPERTY_GOVERNANCE: process.env.NEXT_PUBLIC_PROPERTY_GOVERNANCE_ADDRESS || '0x...',
  PROPERTY_STAKING: process.env.NEXT_PUBLIC_PROPERTY_STAKING_ADDRESS || '0x...',
}

export interface WalletState {
  isConnected: boolean
  address: string | null
  balance: string | null
  chainId: number | null
  provider: ethers.providers.Web3Provider | null
  signer: ethers.Signer | null
}

export interface PropertyData {
  tokenId: number
  totalValue: string
  tokenSupply: string
  pricePerShare: string
  isActive: boolean
  owner: string
  uri: string
  userShares: string
  availableShares: string
}

export interface YieldData {
  totalYield: string
  distributedYield: string
  lastDistribution: string
  yieldPerShare: string
  isActive: boolean
  pendingYield: string
}

export interface StakeData {
  amount: string
  rewards: string
  stakingTime: string
  lockPeriod: string
  tierIndex: string
}

export const useWeb3 = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: null,
    chainId: null,
    provider: null,
    signer: null,
  })

  const [contracts, setContracts] = useState<{
    realEstateNFT: ethers.Contract | null
    yieldDistribution: ethers.Contract | null
    propertyGovernance: ethers.Contract | null
    propertyStaking: ethers.Contract | null
  }>({
    realEstateNFT: null,
    yieldDistribution: null,
    propertyGovernance: null,
    propertyStaking: null,
  })

  const [isLoading, setIsLoading] = useState(false)

  // Initialize contracts when provider is available
  useEffect(() => {
    if (walletState.provider && walletState.signer) {
      const realEstateNFT = new ethers.Contract(
        CONTRACT_ADDRESSES.REAL_ESTATE_NFT,
        REAL_ESTATE_NFT_ABI,
        walletState.signer
      )

      const yieldDistribution = new ethers.Contract(
        CONTRACT_ADDRESSES.YIELD_DISTRIBUTION,
        YIELD_DISTRIBUTION_ABI,
        walletState.signer
      )

      const propertyGovernance = new ethers.Contract(
        CONTRACT_ADDRESSES.PROPERTY_GOVERNANCE,
        PROPERTY_GOVERNANCE_ABI,
        walletState.signer
      )

      const propertyStaking = new ethers.Contract(
        CONTRACT_ADDRESSES.PROPERTY_STAKING,
        PROPERTY_STAKING_ABI,
        walletState.signer
      )

      setContracts({
        realEstateNFT,
        yieldDistribution,
        propertyGovernance,
        propertyStaking,
      })
    }
  }, [walletState.provider, walletState.signer])

  // Connect wallet
  const connectWallet = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') {
      toast.error('Please install MetaMask to use this feature')
      return
    }

    try {
      setIsLoading(true)
      
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' })
      
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const address = await signer.getAddress()
      const balance = await provider.getBalance(address)
      const network = await provider.getNetwork()

      setWalletState({
        isConnected: true,
        address,
        balance: ethers.utils.formatEther(balance),
        chainId: network.chainId,
        provider,
        signer,
      })

      toast.success('Wallet connected successfully!')
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      toast.error('Failed to connect wallet')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setWalletState({
      isConnected: false,
      address: null,
      balance: null,
      chainId: null,
      provider: null,
      signer: null,
    })
    setContracts({
      realEstateNFT: null,
      yieldDistribution: null,
      propertyGovernance: null,
      propertyStaking: null,
    })
    toast.success('Wallet disconnected')
  }, [])

  // Property NFT functions
  const mintProperty = useCallback(async (
    uri: string,
    totalValue: string,
    tokenSupply: string
  ) => {
    if (!contracts.realEstateNFT) {
      toast.error('Contract not initialized')
      return
    }

    try {
      setIsLoading(true)
      const tx = await contracts.realEstateNFT.mintProperty(
        uri,
        ethers.utils.parseEther(totalValue),
        tokenSupply
      )
      
      const receipt = await tx.wait()
      const event = receipt.events?.find((e: any) => e.event === 'PropertyMinted')
      const tokenId = event?.args?.tokenId.toString()

      toast.success(`Property minted successfully! Token ID: ${tokenId}`)
      return { tokenId, transactionHash: receipt.transactionHash }
    } catch (error) {
      console.error('Failed to mint property:', error)
      toast.error('Failed to mint property')
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [contracts.realEstateNFT])

  const buyShares = useCallback(async (tokenId: number, shares: number) => {
    if (!contracts.realEstateNFT) {
      toast.error('Contract not initialized')
      return
    }

    try {
      setIsLoading(true)
      
      // Get property info to calculate cost
      const property = await contracts.realEstateNFT.properties(tokenId)
      const totalCost = property.pricePerShare.mul(shares)

      const tx = await contracts.realEstateNFT.buyShares(tokenId, shares, {
        value: totalCost
      })
      
      const receipt = await tx.wait()
      toast.success(`Successfully purchased ${shares} shares!`)
      return receipt
    } catch (error) {
      console.error('Failed to buy shares:', error)
      toast.error('Failed to buy shares')
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [contracts.realEstateNFT])

  const sellShares = useCallback(async (tokenId: number, shares: number) => {
    if (!contracts.realEstateNFT) {
      toast.error('Contract not initialized')
      return
    }

    try {
      setIsLoading(true)
      const tx = await contracts.realEstateNFT.sellShares(tokenId, shares)
      const receipt = await tx.wait()
      toast.success(`Successfully sold ${shares} shares!`)
      return receipt
    } catch (error) {
      console.error('Failed to sell shares:', error)
      toast.error('Failed to sell shares')
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [contracts.realEstateNFT])

  const getPropertyData = useCallback(async (tokenId: number): Promise<PropertyData | null> => {
    if (!contracts.realEstateNFT || !walletState.address) return null

    try {
      const [property, owner, uri, userShares, availableShares] = await Promise.all([
        contracts.realEstateNFT.properties(tokenId),
        contracts.realEstateNFT.ownerOf(tokenId),
        contracts.realEstateNFT.tokenURI(tokenId),
        contracts.realEstateNFT.userShares(walletState.address, tokenId),
        contracts.realEstateNFT.getAvailableShares(tokenId),
      ])

      return {
        tokenId,
        totalValue: ethers.utils.formatEther(property.totalValue),
        tokenSupply: property.tokenSupply.toString(),
        pricePerShare: ethers.utils.formatEther(property.pricePerShare),
        isActive: property.isActive,
        owner,
        uri,
        userShares: userShares.toString(),
        availableShares: availableShares.toString(),
      }
    } catch (error) {
      console.error('Failed to get property data:', error)
      return null
    }
  }, [contracts.realEstateNFT, walletState.address])

  // Yield distribution functions
  const claimYield = useCallback(async (tokenId: number) => {
    if (!contracts.yieldDistribution) {
      toast.error('Contract not initialized')
      return
    }

    try {
      setIsLoading(true)
      const tx = await contracts.yieldDistribution.claimYield(tokenId)
      const receipt = await tx.wait()
      toast.success('Yield claimed successfully!')
      return receipt
    } catch (error) {
      console.error('Failed to claim yield:', error)
      toast.error('Failed to claim yield')
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [contracts.yieldDistribution])

  const getYieldData = useCallback(async (tokenId: number): Promise<YieldData | null> => {
    if (!contracts.yieldDistribution || !walletState.address) return null

    try {
      const [yieldPool, pendingYield] = await Promise.all([
        contracts.yieldDistribution.getYieldPool(tokenId),
        contracts.yieldDistribution.pendingYield(walletState.address, tokenId),
      ])

      return {
        totalYield: ethers.utils.formatEther(yieldPool[0]),
        distributedYield: ethers.utils.formatEther(yieldPool[1]),
        lastDistribution: yieldPool[2].toString(),
        yieldPerShare: ethers.utils.formatEther(yieldPool[3]),
        isActive: yieldPool[4],
        pendingYield: ethers.utils.formatEther(pendingYield),
      }
    } catch (error) {
      console.error('Failed to get yield data:', error)
      return null
    }
  }, [contracts.yieldDistribution, walletState.address])

  // Staking functions
  const stakeShares = useCallback(async (tokenId: number, amount: number, tierIndex: number) => {
    if (!contracts.propertyStaking) {
      toast.error('Contract not initialized')
      return
    }

    try {
      setIsLoading(true)
      const tx = await contracts.propertyStaking.stake(tokenId, amount, tierIndex)
      const receipt = await tx.wait()
      toast.success(`Successfully staked ${amount} shares!`)
      return receipt
    } catch (error) {
      console.error('Failed to stake shares:', error)
      toast.error('Failed to stake shares')
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [contracts.propertyStaking])

  const unstakeShares = useCallback(async (tokenId: number, amount: number) => {
    if (!contracts.propertyStaking) {
      toast.error('Contract not initialized')
      return
    }

    try {
      setIsLoading(true)
      const tx = await contracts.propertyStaking.withdraw(tokenId, amount)
      const receipt = await tx.wait()
      toast.success(`Successfully unstaked ${amount} shares!`)
      return receipt
    } catch (error) {
      console.error('Failed to unstake shares:', error)
      toast.error('Failed to unstake shares')
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [contracts.propertyStaking])

  const claimStakingRewards = useCallback(async (tokenId: number) => {
    if (!contracts.propertyStaking) {
      toast.error('Contract not initialized')
      return
    }

    try {
      setIsLoading(true)
      const tx = await contracts.propertyStaking.getReward(tokenId)
      const receipt = await tx.wait()
      toast.success('Staking rewards claimed successfully!')
      return receipt
    } catch (error) {
      console.error('Failed to claim staking rewards:', error)
      toast.error('Failed to claim staking rewards')
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [contracts.propertyStaking])

  const getStakeData = useCallback(async (tokenId: number): Promise<StakeData | null> => {
    if (!contracts.propertyStaking || !walletState.address) return null

    try {
      const stakeInfo = await contracts.propertyStaking.getUserStake(walletState.address, tokenId)
      
      return {
        amount: stakeInfo[0].toString(),
        rewards: ethers.utils.formatEther(stakeInfo[1]),
        stakingTime: stakeInfo[2].toString(),
        lockPeriod: stakeInfo[3].toString(),
        tierIndex: stakeInfo[4].toString(),
      }
    } catch (error) {
      console.error('Failed to get stake data:', error)
      return null
    }
  }, [contracts.propertyStaking, walletState.address])

  // Listen for account changes
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet()
        } else if (accounts[0] !== walletState.address) {
          // Reconnect with new account
          connectWallet()
        }
      }

      const handleChainChanged = () => {
        // Reload the page when chain changes
        window.location.reload()
      }

      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [walletState.address, connectWallet, disconnectWallet])

  return {
    // Wallet state
    walletState,
    isLoading,
    
    // Wallet functions
    connectWallet,
    disconnectWallet,
    
    // Property NFT functions
    mintProperty,
    buyShares,
    sellShares,
    getPropertyData,
    
    // Yield functions
    claimYield,
    getYieldData,
    
    // Staking functions
    stakeShares,
    unstakeShares,
    claimStakingRewards,
    getStakeData,
    
    // Contracts
    contracts,
  }
}
