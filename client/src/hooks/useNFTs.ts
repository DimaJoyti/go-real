'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import { RealEstateNFT, PropertyType, CreateNFTForm, Listing, ListingStatus } from '@/types'
import toast from 'react-hot-toast'

export function useNFTs() {
  const [nfts, setNfts] = useState<RealEstateNFT[]>([])
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseClient()

  useEffect(() => {
    fetchNFTs()
    fetchListings()
  }, [])

  const fetchNFTs = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('real_estate_nfts')
        .select(`
          *,
          creator:users(id, username, avatar_url)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setNfts(data || [])
    } catch (error: any) {
      console.error('Error fetching NFTs:', error)
      toast.error('Failed to load NFTs')
    } finally {
      setLoading(false)
    }
  }

  const fetchListings = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          nft:real_estate_nfts(
            *,
            creator:users(id, username, avatar_url)
          )
        `)
        .eq('status', ListingStatus.ACTIVE)
        .order('created_at', { ascending: false })

      if (error) throw error

      setListings(data || [])
    } catch (error: any) {
      console.error('Error fetching listings:', error)
      toast.error('Failed to load marketplace listings')
    }
  }

  const createNFT = async (nftData: CreateNFTForm, userId: string) => {
    try {
      setLoading(true)

      // Upload image to Supabase Storage
      const imageFile = nftData.image
      const imageFileName = `${Date.now()}-${imageFile.name}`
      
      const { data: imageUpload, error: imageError } = await supabase.storage
        .from('nfts')
        .upload(`images/${imageFileName}`, imageFile)

      if (imageError) throw imageError

      const { data: { publicUrl: imageUrl } } = supabase.storage
        .from('nfts')
        .getPublicUrl(`images/${imageFileName}`)

      // Create metadata object
      const metadata = {
        name: nftData.name,
        description: nftData.description,
        image: imageUrl,
        attributes: nftData.attributes,
        properties: {
          property_address: nftData.property_address,
          property_type: nftData.property_type,
          total_value: nftData.total_value,
          token_supply: nftData.token_supply,
        }
      }

      // Upload metadata to IPFS (simplified - in production use Pinata or similar)
      const metadataUri = `ipfs://placeholder-${Date.now()}`

      // Create NFT record
      const { data, error } = await supabase
        .from('real_estate_nfts')
        .insert({
          token_id: Math.floor(Math.random() * 1000000), // In production, get from smart contract
          contract_address: process.env.NEXT_PUBLIC_REAL_ESTATE_NFT_CONTRACT || '0x...',
          name: nftData.name,
          description: nftData.description,
          image_url: imageUrl,
          metadata_uri: metadataUri,
          property_address: nftData.property_address,
          property_type: nftData.property_type,
          total_value: nftData.total_value,
          token_supply: nftData.token_supply,
          price_per_token: nftData.price_per_token,
          currency: nftData.currency,
          owner_address: '0x...', // Will be set after minting
          creator_id: userId,
          is_listed: false,
          royalty_percentage: nftData.royalty_percentage,
          attributes: metadata.attributes,
        })
        .select()
        .single()

      if (error) throw error

      toast.success('NFT created successfully!')
      await fetchNFTs()
      return { data, error: null }
    } catch (error: any) {
      console.error('Error creating NFT:', error)
      toast.error('Failed to create NFT')
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const listNFT = async (nftId: string, price: number, currency: string, quantity: number) => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .insert({
          nft_id: nftId,
          seller_address: '0x...', // Get from wallet
          price,
          currency,
          quantity,
          status: ListingStatus.ACTIVE,
        })
        .select()
        .single()

      if (error) throw error

      // Update NFT listing status
      await supabase
        .from('real_estate_nfts')
        .update({ is_listed: true })
        .eq('id', nftId)

      toast.success('NFT listed successfully!')
      await fetchNFTs()
      await fetchListings()
      return { data, error: null }
    } catch (error: any) {
      console.error('Error listing NFT:', error)
      toast.error('Failed to list NFT')
      return { data: null, error }
    }
  }

  const purchaseNFT = async (listingId: string, buyerAddress: string) => {
    try {
      // In production, this would interact with smart contracts
      // For now, we'll simulate the purchase
      
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .select('*')
        .eq('id', listingId)
        .single()

      if (listingError) throw listingError

      // Update listing status
      await supabase
        .from('listings')
        .update({ status: ListingStatus.SOLD })
        .eq('id', listingId)

      // Update NFT owner
      await supabase
        .from('real_estate_nfts')
        .update({ 
          owner_address: buyerAddress,
          is_listed: false 
        })
        .eq('id', listing.nft_id)

      // Create transaction record
      await supabase
        .from('transactions')
        .insert({
          type: 'sale',
          from_address: listing.seller_address,
          to_address: buyerAddress,
          nft_id: listing.nft_id,
          amount: listing.price,
          currency: listing.currency,
          tx_hash: `0x${Math.random().toString(16).substr(2, 64)}`, // Mock hash
          block_number: Math.floor(Math.random() * 1000000),
          status: 'confirmed',
        })

      toast.success('NFT purchased successfully!')
      await fetchNFTs()
      await fetchListings()
      return { error: null }
    } catch (error: any) {
      console.error('Error purchasing NFT:', error)
      toast.error('Failed to purchase NFT')
      return { error }
    }
  }

  const getNFTById = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('real_estate_nfts')
        .select(`
          *,
          creator:users(id, username, avatar_url)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error: any) {
      console.error('Error fetching NFT:', error)
      return { data: null, error }
    }
  }

  const filterNFTs = (propertyType?: PropertyType, priceRange?: [number, number]) => {
    return nfts.filter(nft => {
      if (propertyType && nft.property_type !== propertyType) return false
      if (priceRange) {
        const [min, max] = priceRange
        if (nft.price_per_token < min || nft.price_per_token > max) return false
      }
      return true
    })
  }

  const searchNFTs = (query: string) => {
    const lowercaseQuery = query.toLowerCase()
    return nfts.filter(nft =>
      nft.name.toLowerCase().includes(lowercaseQuery) ||
      nft.description.toLowerCase().includes(lowercaseQuery) ||
      nft.property_address.toLowerCase().includes(lowercaseQuery)
    )
  }

  return {
    nfts,
    listings,
    loading,
    createNFT,
    listNFT,
    purchaseNFT,
    getNFTById,
    filterNFTs,
    searchNFTs,
    refetch: () => {
      fetchNFTs()
      fetchListings()
    },
  }
}
