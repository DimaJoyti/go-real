'use client'

import { useState, useEffect } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { parseEther, formatEther, Address } from 'viem'
import toast from 'react-hot-toast'

// Contract ABIs (simplified - in production, import from generated types)
const REAL_ESTATE_NFT_ABI = [
  'function mintProperty(address to, string name, string propertyAddress, string propertyType, uint256 totalValue, uint256 tokenSupply, uint256 pricePerToken, uint256 royaltyPercentage, string tokenURI) returns (uint256)',
  'function purchaseShares(uint256 tokenId, uint256 shares) payable',
  'function transferShares(uint256 tokenId, address to, uint256 shares)',
  'function getProperty(uint256 tokenId) view returns (tuple)',
  'function getUserShares(address user, uint256 tokenId) view returns (uint256)',
  'function getAvailableShares(uint256 tokenId) view returns (uint256)',
  'function setListingStatus(uint256 tokenId, bool isListed)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function approve(address to, uint256 tokenId)',
  'function setApprovalForAll(address operator, bool approved)',
] as const

const MARKETPLACE_ABI = [
  'function createListing(address nftContract, uint256 tokenId, uint256 price, uint256 shares, bool isFractional, uint256 duration)',
  'function purchaseNFT(uint256 listingId) payable',
  'function cancelListing(uint256 listingId)',
  'function makeOffer(uint256 listingId, uint256 shares, uint256 duration) payable',
  'function acceptOffer(uint256 offerId)',
  'function withdrawOffer(uint256 offerId)',
  'function getListing(uint256 listingId) view returns (tuple)',
  'function getOffer(uint256 offerId) view returns (tuple)',
  'function platformFee() view returns (uint256)',
] as const

const CHALLENGE_REWARDS_ABI = [
  'function createChallenge(string title, uint256 startTime, uint256 endTime, uint256 maxParticipants, tuple rewardDist) payable returns (uint256)',
  'function joinChallenge(uint256 challengeId)',
  'function submitEntry(uint256 challengeId, string submissionHash)',
  'function updateScore(uint256 challengeId, address participant, uint256 score)',
  'function completeChallenge(uint256 challengeId)',
  'function getChallenge(uint256 challengeId) view returns (tuple)',
  'function getChallengeParticipants(uint256 challengeId) view returns (tuple[])',
  'function isParticipating(uint256 challengeId, address participant) view returns (bool)',
] as const

export function useWeb3Contracts() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const [loading, setLoading] = useState(false)

  const contractAddresses = {
    realEstateNFT: process.env.NEXT_PUBLIC_REAL_ESTATE_NFT_CONTRACT as Address,
    marketplace: process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT as Address,
    challengeRewards: process.env.NEXT_PUBLIC_CHALLENGE_REWARDS_CONTRACT as Address,
  }

  // Real Estate NFT Contract Functions
  const mintRealEstateNFT = async (nftData: {
    name: string
    propertyAddress: string
    propertyType: string
    totalValue: number
    tokenSupply: number
    pricePerToken: number
    royaltyPercentage: number
    tokenURI: string
  }) => {
    if (!walletClient || !address) {
      toast.error('Please connect your wallet')
      return null
    }

    try {
      setLoading(true)
      
      const { request } = await publicClient!.simulateContract({
        address: contractAddresses.realEstateNFT,
        abi: REAL_ESTATE_NFT_ABI,
        functionName: 'mintProperty',
        args: [
          address,
          nftData.name,
          nftData.propertyAddress,
          nftData.propertyType,
          BigInt(nftData.totalValue * 100), // Convert to cents
          BigInt(nftData.tokenSupply),
          parseEther(nftData.pricePerToken.toString()),
          BigInt(nftData.royaltyPercentage * 100), // Convert to basis points
          nftData.tokenURI
        ],
        account: address,
      })

      const hash = await walletClient.writeContract(request)
      
      toast.success('NFT minting transaction submitted!')
      return hash
    } catch (error: any) {
      console.error('Error minting NFT:', error)
      toast.error(`Failed to mint NFT: ${error.message}`)
      return null
    } finally {
      setLoading(false)
    }
  }

  const purchaseNFTShares = async (tokenId: number, shares: number, pricePerToken: number) => {
    if (!walletClient || !address) {
      toast.error('Please connect your wallet')
      return null
    }

    try {
      setLoading(true)
      
      const totalCost = parseEther((shares * pricePerToken).toString())

      const { request } = await publicClient!.simulateContract({
        address: contractAddresses.realEstateNFT,
        abi: REAL_ESTATE_NFT_ABI,
        functionName: 'purchaseShares',
        args: [BigInt(tokenId), BigInt(shares)],
        value: totalCost,
        account: address,
      })

      const hash = await walletClient.writeContract(request)
      
      toast.success('Share purchase transaction submitted!')
      return hash
    } catch (error: any) {
      console.error('Error purchasing shares:', error)
      toast.error(`Failed to purchase shares: ${error.message}`)
      return null
    } finally {
      setLoading(false)
    }
  }

  const transferNFTShares = async (tokenId: number, to: Address, shares: number) => {
    if (!walletClient || !address) {
      toast.error('Please connect your wallet')
      return null
    }

    try {
      setLoading(true)

      const { request } = await publicClient!.simulateContract({
        address: contractAddresses.realEstateNFT,
        abi: REAL_ESTATE_NFT_ABI,
        functionName: 'transferShares',
        args: [BigInt(tokenId), to, BigInt(shares)],
        account: address,
      })

      const hash = await walletClient.writeContract(request)
      
      toast.success('Share transfer transaction submitted!')
      return hash
    } catch (error: any) {
      console.error('Error transferring shares:', error)
      toast.error(`Failed to transfer shares: ${error.message}`)
      return null
    } finally {
      setLoading(false)
    }
  }

  // Marketplace Contract Functions
  const createMarketplaceListing = async (listingData: {
    nftContract: Address
    tokenId: number
    price: number
    shares: number
    isFractional: boolean
    duration: number // in seconds
  }) => {
    if (!walletClient || !address) {
      toast.error('Please connect your wallet')
      return null
    }

    try {
      setLoading(true)

      // First approve marketplace to transfer NFT/shares if needed
      if (!listingData.isFractional) {
        const { request: approveRequest } = await publicClient!.simulateContract({
          address: listingData.nftContract,
          abi: REAL_ESTATE_NFT_ABI,
          functionName: 'approve',
          args: [contractAddresses.marketplace, BigInt(listingData.tokenId)],
          account: address,
        })

        await walletClient.writeContract(approveRequest)
        toast.success('NFT approved for marketplace')
      }

      const { request } = await publicClient!.simulateContract({
        address: contractAddresses.marketplace,
        abi: MARKETPLACE_ABI,
        functionName: 'createListing',
        args: [
          listingData.nftContract,
          BigInt(listingData.tokenId),
          parseEther(listingData.price.toString()),
          BigInt(listingData.shares),
          listingData.isFractional,
          BigInt(listingData.duration)
        ],
        account: address,
      })

      const hash = await walletClient.writeContract(request)
      
      toast.success('Listing created successfully!')
      return hash
    } catch (error: any) {
      console.error('Error creating listing:', error)
      toast.error(`Failed to create listing: ${error.message}`)
      return null
    } finally {
      setLoading(false)
    }
  }

  const purchaseFromMarketplace = async (listingId: number, price: number) => {
    if (!walletClient || !address) {
      toast.error('Please connect your wallet')
      return null
    }

    try {
      setLoading(true)

      const { request } = await publicClient!.simulateContract({
        address: contractAddresses.marketplace,
        abi: MARKETPLACE_ABI,
        functionName: 'purchaseNFT',
        args: [BigInt(listingId)],
        value: parseEther(price.toString()),
        account: address,
      })

      const hash = await walletClient.writeContract(request)
      
      toast.success('Purchase transaction submitted!')
      return hash
    } catch (error: any) {
      console.error('Error purchasing from marketplace:', error)
      toast.error(`Failed to purchase: ${error.message}`)
      return null
    } finally {
      setLoading(false)
    }
  }

  // Challenge Contract Functions
  const createChallenge = async (challengeData: {
    title: string
    startTime: number
    endTime: number
    maxParticipants: number
    rewardPool: number
    rewardDistribution: {
      firstPlace: number
      secondPlace: number
      thirdPlace: number
      participation: number
    }
  }) => {
    if (!walletClient || !address) {
      toast.error('Please connect your wallet')
      return null
    }

    try {
      setLoading(true)

      const rewardDist = [
        BigInt(challengeData.rewardDistribution.firstPlace * 100), // Convert to basis points
        BigInt(challengeData.rewardDistribution.secondPlace * 100),
        BigInt(challengeData.rewardDistribution.thirdPlace * 100),
        BigInt(challengeData.rewardDistribution.participation * 100)
      ]

      const { request } = await publicClient!.simulateContract({
        address: contractAddresses.challengeRewards,
        abi: CHALLENGE_REWARDS_ABI,
        functionName: 'createChallenge',
        args: [
          challengeData.title,
          BigInt(challengeData.startTime),
          BigInt(challengeData.endTime),
          BigInt(challengeData.maxParticipants),
          rewardDist
        ],
        value: parseEther(challengeData.rewardPool.toString()),
        account: address,
      })

      const hash = await walletClient.writeContract(request)
      
      toast.success('Challenge created successfully!')
      return hash
    } catch (error: any) {
      console.error('Error creating challenge:', error)
      toast.error(`Failed to create challenge: ${error.message}`)
      return null
    } finally {
      setLoading(false)
    }
  }

  const joinChallenge = async (challengeId: number) => {
    if (!walletClient || !address) {
      toast.error('Please connect your wallet')
      return null
    }

    try {
      setLoading(true)

      const { request } = await publicClient!.simulateContract({
        address: contractAddresses.challengeRewards,
        abi: CHALLENGE_REWARDS_ABI,
        functionName: 'joinChallenge',
        args: [BigInt(challengeId)],
        account: address,
      })

      const hash = await walletClient.writeContract(request)
      
      toast.success('Joined challenge successfully!')
      return hash
    } catch (error: any) {
      console.error('Error joining challenge:', error)
      toast.error(`Failed to join challenge: ${error.message}`)
      return null
    } finally {
      setLoading(false)
    }
  }

  // Read Functions
  const getUserShares = async (tokenId: number, userAddress?: Address) => {
    if (!publicClient) return 0

    try {
      const shares = await publicClient.readContract({
        address: contractAddresses.realEstateNFT,
        abi: REAL_ESTATE_NFT_ABI,
        functionName: 'getUserShares',
        args: [userAddress || address!, BigInt(tokenId)],
      })

      return Number(shares)
    } catch (error) {
      console.error('Error getting user shares:', error)
      return 0
    }
  }

  const getAvailableShares = async (tokenId: number) => {
    if (!publicClient) return 0

    try {
      const shares = await publicClient.readContract({
        address: contractAddresses.realEstateNFT,
        abi: REAL_ESTATE_NFT_ABI,
        functionName: 'getAvailableShares',
        args: [BigInt(tokenId)],
      })

      return Number(shares)
    } catch (error) {
      console.error('Error getting available shares:', error)
      return 0
    }
  }

  const getPropertyDetails = async (tokenId: number) => {
    if (!publicClient) return null

    try {
      const property = await publicClient.readContract({
        address: contractAddresses.realEstateNFT,
        abi: REAL_ESTATE_NFT_ABI,
        functionName: 'getProperty',
        args: [BigInt(tokenId)],
      })

      return property
    } catch (error) {
      console.error('Error getting property details:', error)
      return null
    }
  }

  return {
    // State
    loading,
    isConnected,
    address,
    contractAddresses,

    // NFT Functions
    mintRealEstateNFT,
    purchaseNFTShares,
    transferNFTShares,

    // Marketplace Functions
    createMarketplaceListing,
    purchaseFromMarketplace,

    // Challenge Functions
    createChallenge,
    joinChallenge,

    // Read Functions
    getUserShares,
    getAvailableShares,
    getPropertyDetails,
  }
}
