// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title RealEstateNFT
 * @dev NFT contract for tokenizing real estate properties with fractional ownership
 */
contract RealEstateNFT is ERC721, ERC721URIStorage, ERC721Burnable, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    struct Property {
        string name;
        string propertyAddress;
        string propertyType; // residential, commercial, industrial, land, mixed_use
        uint256 totalValue;
        uint256 tokenSupply;
        uint256 pricePerToken;
        address creator;
        uint256 royaltyPercentage; // Basis points (e.g., 250 = 2.5%)
        bool isListed;
        uint256 createdAt;
    }

    struct FractionalOwnership {
        uint256 tokenId;
        address owner;
        uint256 shares;
        uint256 totalShares;
    }

    // Mapping from token ID to property details
    mapping(uint256 => Property) public properties;
    
    // Mapping from token ID to fractional ownership details
    mapping(uint256 => FractionalOwnership[]) public fractionalOwners;
    
    // Mapping from token ID to total shares issued
    mapping(uint256 => uint256) public totalSharesIssued;
    
    // Mapping from user to their owned shares per token
    mapping(address => mapping(uint256 => uint256)) public userShares;

    // Events
    event PropertyMinted(
        uint256 indexed tokenId,
        address indexed creator,
        string name,
        uint256 totalValue,
        uint256 tokenSupply
    );
    
    event SharesPurchased(
        uint256 indexed tokenId,
        address indexed buyer,
        uint256 shares,
        uint256 totalPaid
    );
    
    event SharesTransferred(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to,
        uint256 shares
    );

    event RoyaltyPaid(
        uint256 indexed tokenId,
        address indexed recipient,
        uint256 amount
    );

    constructor() ERC721("Challenz Real Estate", "CRE") {}

    /**
     * @dev Mint a new real estate NFT
     */
    function mintProperty(
        address to,
        string memory name,
        string memory propertyAddress,
        string memory propertyType,
        uint256 totalValue,
        uint256 tokenSupply,
        uint256 pricePerToken,
        uint256 royaltyPercentage,
        string memory tokenURI
    ) public returns (uint256) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(propertyAddress).length > 0, "Property address cannot be empty");
        require(totalValue > 0, "Total value must be greater than 0");
        require(tokenSupply > 0, "Token supply must be greater than 0");
        require(pricePerToken > 0, "Price per token must be greater than 0");
        require(royaltyPercentage <= 1000, "Royalty cannot exceed 10%"); // Max 10%

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);

        properties[tokenId] = Property({
            name: name,
            propertyAddress: propertyAddress,
            propertyType: propertyType,
            totalValue: totalValue,
            tokenSupply: tokenSupply,
            pricePerToken: pricePerToken,
            creator: to,
            royaltyPercentage: royaltyPercentage,
            isListed: false,
            createdAt: block.timestamp
        });

        emit PropertyMinted(tokenId, to, name, totalValue, tokenSupply);
        return tokenId;
    }

    /**
     * @dev Purchase fractional shares of a property
     */
    function purchaseShares(uint256 tokenId, uint256 shares) public payable nonReentrant {
        require(_exists(tokenId), "Token does not exist");
        require(shares > 0, "Shares must be greater than 0");
        
        Property storage property = properties[tokenId];
        require(property.isListed, "Property is not listed for sale");
        require(totalSharesIssued[tokenId] + shares <= property.tokenSupply, "Not enough shares available");
        
        uint256 totalCost = shares * property.pricePerToken;
        require(msg.value >= totalCost, "Insufficient payment");

        // Calculate royalty for the creator
        uint256 royaltyAmount = (totalCost * property.royaltyPercentage) / 10000;
        uint256 sellerAmount = totalCost - royaltyAmount;

        // Update fractional ownership
        userShares[msg.sender][tokenId] += shares;
        totalSharesIssued[tokenId] += shares;

        // Add to fractional owners array if first purchase
        bool isExistingOwner = false;
        for (uint i = 0; i < fractionalOwners[tokenId].length; i++) {
            if (fractionalOwners[tokenId][i].owner == msg.sender) {
                fractionalOwners[tokenId][i].shares += shares;
                isExistingOwner = true;
                break;
            }
        }

        if (!isExistingOwner) {
            fractionalOwners[tokenId].push(FractionalOwnership({
                tokenId: tokenId,
                owner: msg.sender,
                shares: shares,
                totalShares: property.tokenSupply
            }));
        }

        // Transfer payments
        if (royaltyAmount > 0) {
            payable(property.creator).transfer(royaltyAmount);
            emit RoyaltyPaid(tokenId, property.creator, royaltyAmount);
        }

        payable(ownerOf(tokenId)).transfer(sellerAmount);

        // Refund excess payment
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }

        emit SharesPurchased(tokenId, msg.sender, shares, totalCost);
    }

    /**
     * @dev Transfer fractional shares between users
     */
    function transferShares(uint256 tokenId, address to, uint256 shares) public {
        require(_exists(tokenId), "Token does not exist");
        require(to != address(0), "Cannot transfer to zero address");
        require(userShares[msg.sender][tokenId] >= shares, "Insufficient shares");
        require(shares > 0, "Shares must be greater than 0");

        userShares[msg.sender][tokenId] -= shares;
        userShares[to][tokenId] += shares;

        // Update fractional owners array
        for (uint i = 0; i < fractionalOwners[tokenId].length; i++) {
            if (fractionalOwners[tokenId][i].owner == msg.sender) {
                fractionalOwners[tokenId][i].shares -= shares;
                if (fractionalOwners[tokenId][i].shares == 0) {
                    // Remove owner if no shares left
                    fractionalOwners[tokenId][i] = fractionalOwners[tokenId][fractionalOwners[tokenId].length - 1];
                    fractionalOwners[tokenId].pop();
                }
                break;
            }
        }

        // Add to recipient's fractional ownership
        bool isExistingOwner = false;
        for (uint i = 0; i < fractionalOwners[tokenId].length; i++) {
            if (fractionalOwners[tokenId][i].owner == to) {
                fractionalOwners[tokenId][i].shares += shares;
                isExistingOwner = true;
                break;
            }
        }

        if (!isExistingOwner) {
            fractionalOwners[tokenId].push(FractionalOwnership({
                tokenId: tokenId,
                owner: to,
                shares: shares,
                totalShares: properties[tokenId].tokenSupply
            }));
        }

        emit SharesTransferred(tokenId, msg.sender, to, shares);
    }

    /**
     * @dev Set listing status for a property
     */
    function setListingStatus(uint256 tokenId, bool isListed) public {
        require(_exists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Only owner can change listing status");
        
        properties[tokenId].isListed = isListed;
    }

    /**
     * @dev Get property details
     */
    function getProperty(uint256 tokenId) public view returns (Property memory) {
        require(_exists(tokenId), "Token does not exist");
        return properties[tokenId];
    }

    /**
     * @dev Get fractional owners of a property
     */
    function getFractionalOwners(uint256 tokenId) public view returns (FractionalOwnership[] memory) {
        require(_exists(tokenId), "Token does not exist");
        return fractionalOwners[tokenId];
    }

    /**
     * @dev Get user's shares for a specific token
     */
    function getUserShares(address user, uint256 tokenId) public view returns (uint256) {
        return userShares[user][tokenId];
    }

    /**
     * @dev Get available shares for purchase
     */
    function getAvailableShares(uint256 tokenId) public view returns (uint256) {
        require(_exists(tokenId), "Token does not exist");
        return properties[tokenId].tokenSupply - totalSharesIssued[tokenId];
    }

    // Override functions required by Solidity
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
