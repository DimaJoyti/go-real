// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./RealEstateNFT.sol";

/**
 * @title Marketplace
 * @dev Marketplace contract for trading real estate NFTs and fractional shares
 */
contract Marketplace is ReentrancyGuard, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _listingIdCounter;

    struct Listing {
        uint256 listingId;
        address nftContract;
        uint256 tokenId;
        address seller;
        uint256 price;
        uint256 shares; // For fractional sales
        bool isActive;
        bool isFractional; // true for share sales, false for full NFT sales
        uint256 createdAt;
        uint256 expiresAt;
    }

    struct Offer {
        uint256 offerId;
        uint256 listingId;
        address buyer;
        uint256 offerPrice;
        uint256 shares; // For fractional offers
        uint256 expiresAt;
        bool isActive;
    }

    // Platform fee in basis points (e.g., 250 = 2.5%)
    uint256 public platformFee = 250;
    
    // Mapping from listing ID to listing details
    mapping(uint256 => Listing) public listings;
    
    // Mapping from offer ID to offer details
    mapping(uint256 => Offer) public offers;
    
    // Mapping from NFT contract + token ID to active listing ID
    mapping(address => mapping(uint256 => uint256)) public activeListings;
    
    // Mapping to track all listings by seller
    mapping(address => uint256[]) public sellerListings;

    Counters.Counter private _offerIdCounter;

    // Events
    event ListingCreated(
        uint256 indexed listingId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        uint256 price,
        uint256 shares,
        bool isFractional
    );

    event ListingCancelled(uint256 indexed listingId);

    event NFTSold(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 price,
        uint256 shares
    );

    event OfferMade(
        uint256 indexed offerId,
        uint256 indexed listingId,
        address indexed buyer,
        uint256 offerPrice,
        uint256 shares
    );

    event OfferAccepted(
        uint256 indexed offerId,
        uint256 indexed listingId,
        address indexed buyer,
        address seller,
        uint256 price
    );

    event PlatformFeeUpdated(uint256 newFee);

    constructor() {}

    /**
     * @dev Create a listing for an NFT or fractional shares
     */
    function createListing(
        address nftContract,
        uint256 tokenId,
        uint256 price,
        uint256 shares,
        bool isFractional,
        uint256 duration
    ) public nonReentrant {
        require(price > 0, "Price must be greater than 0");
        require(duration > 0, "Duration must be greater than 0");
        
        IERC721 nft = IERC721(nftContract);
        
        if (isFractional) {
            // For fractional sales, check if seller has enough shares
            RealEstateNFT realEstateNFT = RealEstateNFT(nftContract);
            require(shares > 0, "Shares must be greater than 0");
            require(
                realEstateNFT.getUserShares(msg.sender, tokenId) >= shares,
                "Insufficient shares to list"
            );
        } else {
            // For full NFT sales, check ownership and approval
            require(nft.ownerOf(tokenId) == msg.sender, "You don't own this NFT");
            require(
                nft.getApproved(tokenId) == address(this) || 
                nft.isApprovedForAll(msg.sender, address(this)),
                "Marketplace not approved to transfer NFT"
            );
            shares = 0; // Full NFT sale doesn't use shares
        }

        uint256 listingId = _listingIdCounter.current();
        _listingIdCounter.increment();

        listings[listingId] = Listing({
            listingId: listingId,
            nftContract: nftContract,
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            shares: shares,
            isActive: true,
            isFractional: isFractional,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + duration
        });

        activeListings[nftContract][tokenId] = listingId;
        sellerListings[msg.sender].push(listingId);

        emit ListingCreated(listingId, nftContract, tokenId, msg.sender, price, shares, isFractional);
    }

    /**
     * @dev Purchase an NFT or fractional shares
     */
    function purchaseNFT(uint256 listingId) public payable nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.isActive, "Listing is not active");
        require(block.timestamp <= listing.expiresAt, "Listing has expired");
        require(msg.value >= listing.price, "Insufficient payment");
        require(msg.sender != listing.seller, "Cannot buy your own listing");

        // Calculate platform fee
        uint256 fee = (listing.price * platformFee) / 10000;
        uint256 sellerAmount = listing.price - fee;

        if (listing.isFractional) {
            // Handle fractional share purchase
            RealEstateNFT realEstateNFT = RealEstateNFT(listing.nftContract);
            
            // Verify seller still has the shares
            require(
                realEstateNFT.getUserShares(listing.seller, listing.tokenId) >= listing.shares,
                "Seller no longer has enough shares"
            );

            // Transfer shares from seller to buyer
            // Note: This requires the RealEstateNFT contract to have a transferShares function
            // that can be called by the marketplace
            realEstateNFT.transferShares(listing.tokenId, msg.sender, listing.shares);
        } else {
            // Handle full NFT purchase
            IERC721 nft = IERC721(listing.nftContract);
            require(nft.ownerOf(listing.tokenId) == listing.seller, "Seller no longer owns the NFT");
            
            // Transfer NFT from seller to buyer
            nft.safeTransferFrom(listing.seller, msg.sender, listing.tokenId);
        }

        // Transfer payments
        payable(listing.seller).transfer(sellerAmount);
        payable(owner()).transfer(fee);

        // Refund excess payment
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }

        // Mark listing as inactive
        listing.isActive = false;
        delete activeListings[listing.nftContract][listing.tokenId];

        emit NFTSold(listingId, msg.sender, listing.seller, listing.price, listing.shares);
    }

    /**
     * @dev Cancel a listing
     */
    function cancelListing(uint256 listingId) public {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "Only seller can cancel listing");
        require(listing.isActive, "Listing is not active");

        listing.isActive = false;
        delete activeListings[listing.nftContract][listing.tokenId];

        emit ListingCancelled(listingId);
    }

    /**
     * @dev Make an offer on a listing
     */
    function makeOffer(
        uint256 listingId,
        uint256 shares,
        uint256 duration
    ) public payable nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.isActive, "Listing is not active");
        require(msg.value > 0, "Offer must be greater than 0");
        require(msg.sender != listing.seller, "Cannot make offer on your own listing");
        require(duration > 0, "Duration must be greater than 0");

        if (listing.isFractional) {
            require(shares > 0 && shares <= listing.shares, "Invalid share amount");
        }

        uint256 offerId = _offerIdCounter.current();
        _offerIdCounter.increment();

        offers[offerId] = Offer({
            offerId: offerId,
            listingId: listingId,
            buyer: msg.sender,
            offerPrice: msg.value,
            shares: shares,
            expiresAt: block.timestamp + duration,
            isActive: true
        });

        emit OfferMade(offerId, listingId, msg.sender, msg.value, shares);
    }

    /**
     * @dev Accept an offer
     */
    function acceptOffer(uint256 offerId) public nonReentrant {
        Offer storage offer = offers[offerId];
        require(offer.isActive, "Offer is not active");
        require(block.timestamp <= offer.expiresAt, "Offer has expired");

        Listing storage listing = listings[offer.listingId];
        require(listing.seller == msg.sender, "Only seller can accept offer");
        require(listing.isActive, "Listing is not active");

        // Calculate platform fee
        uint256 fee = (offer.offerPrice * platformFee) / 10000;
        uint256 sellerAmount = offer.offerPrice - fee;

        if (listing.isFractional) {
            // Handle fractional share sale
            RealEstateNFT realEstateNFT = RealEstateNFT(listing.nftContract);
            realEstateNFT.transferShares(listing.tokenId, offer.buyer, offer.shares);
        } else {
            // Handle full NFT sale
            IERC721 nft = IERC721(listing.nftContract);
            nft.safeTransferFrom(msg.sender, offer.buyer, listing.tokenId);
        }

        // Transfer payments
        payable(msg.sender).transfer(sellerAmount);
        payable(owner()).transfer(fee);

        // Mark offer and listing as inactive
        offer.isActive = false;
        listing.isActive = false;
        delete activeListings[listing.nftContract][listing.tokenId];

        emit OfferAccepted(offerId, offer.listingId, offer.buyer, msg.sender, offer.offerPrice);
    }

    /**
     * @dev Withdraw an offer
     */
    function withdrawOffer(uint256 offerId) public nonReentrant {
        Offer storage offer = offers[offerId];
        require(offer.buyer == msg.sender, "Only buyer can withdraw offer");
        require(offer.isActive, "Offer is not active");

        offer.isActive = false;
        payable(msg.sender).transfer(offer.offerPrice);
    }

    /**
     * @dev Update platform fee (only owner)
     */
    function updatePlatformFee(uint256 newFee) public onlyOwner {
        require(newFee <= 1000, "Platform fee cannot exceed 10%");
        platformFee = newFee;
        emit PlatformFeeUpdated(newFee);
    }

    /**
     * @dev Get listing details
     */
    function getListing(uint256 listingId) public view returns (Listing memory) {
        return listings[listingId];
    }

    /**
     * @dev Get offer details
     */
    function getOffer(uint256 offerId) public view returns (Offer memory) {
        return offers[offerId];
    }

    /**
     * @dev Get all listings by seller
     */
    function getSellerListings(address seller) public view returns (uint256[] memory) {
        return sellerListings[seller];
    }

    /**
     * @dev Check if listing has expired
     */
    function isListingExpired(uint256 listingId) public view returns (bool) {
        return block.timestamp > listings[listingId].expiresAt;
    }

    /**
     * @dev Emergency function to withdraw contract balance (only owner)
     */
    function emergencyWithdraw() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
