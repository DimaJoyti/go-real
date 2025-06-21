import axios from 'axios'

// Pinata IPFS service configuration
const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_API_KEY
const PINATA_JWT = process.env.PINATA_JWT

const pinataAxios = axios.create({
  baseURL: 'https://api.pinata.cloud',
  headers: {
    'pinata_api_key': PINATA_API_KEY,
    'pinata_secret_api_key': PINATA_SECRET_KEY,
  }
})

export interface IPFSUploadResult {
  hash: string
  url: string
  size: number
}

export interface NFTMetadata {
  name: string
  description: string
  image: string
  external_url?: string
  attributes: Array<{
    trait_type: string
    value: string | number
    display_type?: string
  }>
  properties: {
    property_address: string
    property_type: string
    total_value: number
    token_supply: number
    creator: string
    created_at: string
  }
}

/**
 * Upload a file to IPFS via Pinata
 */
export async function uploadFileToIPFS(file: File, options?: {
  name?: string
  keyvalues?: Record<string, string>
}): Promise<IPFSUploadResult> {
  try {
    const formData = new FormData()
    formData.append('file', file)

    // Add metadata
    const metadata = {
      name: options?.name || file.name,
      keyvalues: options?.keyvalues || {}
    }
    formData.append('pinataMetadata', JSON.stringify(metadata))

    // Add options
    const pinataOptions = {
      cidVersion: 1,
    }
    formData.append('pinataOptions', JSON.stringify(pinataOptions))

    const response = await pinataAxios.post('/pinning/pinFileToIPFS', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    })

    const { IpfsHash, PinSize } = response.data

    return {
      hash: IpfsHash,
      url: `${process.env.NEXT_PUBLIC_IPFS_GATEWAY}/ipfs/${IpfsHash}`,
      size: PinSize
    }
  } catch (error: any) {
    console.error('Error uploading file to IPFS:', error)
    throw new Error(`Failed to upload file to IPFS: ${error.message}`)
  }
}

/**
 * Upload JSON metadata to IPFS
 */
export async function uploadJSONToIPFS(
  data: any,
  name: string = 'metadata.json'
): Promise<IPFSUploadResult> {
  try {
    const response = await pinataAxios.post('/pinning/pinJSONToIPFS', data, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const { IpfsHash, PinSize } = response.data

    return {
      hash: IpfsHash,
      url: `${process.env.NEXT_PUBLIC_IPFS_GATEWAY}/ipfs/${IpfsHash}`,
      size: PinSize
    }
  } catch (error: any) {
    console.error('Error uploading JSON to IPFS:', error)
    throw new Error(`Failed to upload JSON to IPFS: ${error.message}`)
  }
}

/**
 * Create and upload NFT metadata to IPFS
 */
export async function createAndUploadNFTMetadata(
  nftData: {
    name: string
    description: string
    imageFile: File
    property_address: string
    property_type: string
    total_value: number
    token_supply: number
    creator: string
    attributes: Array<{
      trait_type: string
      value: string | number
      display_type?: string
    }>
  }
): Promise<{ metadataHash: string; metadataUrl: string; imageHash: string; imageUrl: string }> {
  try {
    // First upload the image
    console.log('Uploading image to IPFS...')
    const imageResult = await uploadFileToIPFS(nftData.imageFile, {
      name: `${nftData.name}-image`,
      keyvalues: {
        type: 'nft-image',
        property_type: nftData.property_type
      }
    })

    // Create metadata object
    const metadata: NFTMetadata = {
      name: nftData.name,
      description: nftData.description,
      image: imageResult.url,
      external_url: `${process.env.NEXT_PUBLIC_APP_URL}/marketplace/nft/${nftData.name}`,
      attributes: nftData.attributes,
      properties: {
        property_address: nftData.property_address,
        property_type: nftData.property_type,
        total_value: nftData.total_value,
        token_supply: nftData.token_supply,
        creator: nftData.creator,
        created_at: new Date().toISOString()
      }
    }

    // Upload metadata
    console.log('Uploading metadata to IPFS...')
    const metadataResult = await uploadJSONToIPFS(metadata, `${nftData.name}-metadata.json`)

    return {
      metadataHash: metadataResult.hash,
      metadataUrl: metadataResult.url,
      imageHash: imageResult.hash,
      imageUrl: imageResult.url
    }
  } catch (error: any) {
    console.error('Error creating NFT metadata:', error)
    throw new Error(`Failed to create NFT metadata: ${error.message}`)
  }
}

/**
 * Upload video file to IPFS (for films)
 */
export async function uploadVideoToIPFS(
  videoFile: File,
  metadata?: {
    title: string
    description: string
    category: string
    tags: string[]
  }
): Promise<IPFSUploadResult> {
  try {
    console.log('Uploading video to IPFS...')
    
    const result = await uploadFileToIPFS(videoFile, {
      name: metadata?.title || videoFile.name,
      keyvalues: {
        type: 'video',
        category: metadata?.category || 'unknown',
        tags: metadata?.tags?.join(',') || ''
      }
    })

    return result
  } catch (error: any) {
    console.error('Error uploading video to IPFS:', error)
    throw new Error(`Failed to upload video to IPFS: ${error.message}`)
  }
}

/**
 * Fetch content from IPFS
 */
export async function fetchFromIPFS(hash: string): Promise<any> {
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_IPFS_GATEWAY}/ipfs/${hash}`)
    return response.data
  } catch (error: any) {
    console.error('Error fetching from IPFS:', error)
    throw new Error(`Failed to fetch from IPFS: ${error.message}`)
  }
}

/**
 * Get file info from Pinata
 */
export async function getFileInfo(hash: string): Promise<any> {
  try {
    const response = await pinataAxios.get(`/data/pinList?hashContains=${hash}`)
    return response.data.rows[0] || null
  } catch (error: any) {
    console.error('Error getting file info:', error)
    return null
  }
}

/**
 * Pin existing IPFS content to Pinata
 */
export async function pinByHash(
  hash: string,
  name: string,
  keyvalues?: Record<string, string>
): Promise<void> {
  try {
    const data = {
      hashToPin: hash,
      pinataMetadata: {
        name,
        keyvalues: keyvalues || {}
      }
    }

    await pinataAxios.post('/pinning/pinByHash', data)
  } catch (error: any) {
    console.error('Error pinning by hash:', error)
    throw new Error(`Failed to pin by hash: ${error.message}`)
  }
}

/**
 * Unpin content from Pinata
 */
export async function unpinFromIPFS(hash: string): Promise<void> {
  try {
    await pinataAxios.delete(`/pinning/unpin/${hash}`)
  } catch (error: any) {
    console.error('Error unpinning from IPFS:', error)
    throw new Error(`Failed to unpin from IPFS: ${error.message}`)
  }
}

/**
 * Get IPFS gateway URL for a hash
 */
export function getIPFSUrl(hash: string): string {
  return `${process.env.NEXT_PUBLIC_IPFS_GATEWAY}/ipfs/${hash}`
}

/**
 * Extract IPFS hash from URL
 */
export function extractIPFSHash(url: string): string | null {
  const match = url.match(/\/ipfs\/([a-zA-Z0-9]+)/)
  return match ? match[1] : null
}

/**
 * Validate IPFS hash format
 */
export function isValidIPFSHash(hash: string): boolean {
  // Basic validation for IPFS hash (CIDv0 and CIDv1)
  const cidv0Regex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/
  const cidv1Regex = /^[a-z2-7]{59}$/
  
  return cidv0Regex.test(hash) || cidv1Regex.test(hash)
}

/**
 * Get usage statistics from Pinata
 */
export async function getPinataUsage(): Promise<any> {
  try {
    const response = await pinataAxios.get('/data/userPinnedDataTotal')
    return response.data
  } catch (error: any) {
    console.error('Error getting Pinata usage:', error)
    return null
  }
}
