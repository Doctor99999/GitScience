// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AmanatSplitter
 * @dev GitScience Sovereign Protocol Revenue Splitter
 * Implements the 55/15/30 Consensus Rule.
 */
contract AmanatSplitter {
    address public immutable founderTreasury;
    
    event RoyaltyDistributed(
        string registrationCode,
        address indexed author,
        uint256 authorShare,
        uint256 infraShare,
        uint256 founderShare,
        uint256 totalAmount
    );
    
    constructor(address _founderTreasury) {
        require(_founderTreasury != address(0), "Invalid founder treasury");
        founderTreasury = _founderTreasury;
    }
    
    /**
     * @dev Distribute royalty payment according to the 55/15/30 split.
     * Overages or remainders due to division stay in the contract (dust).
     * 
     * @param author The verified wallet address of the manuscript author
     * @param infraNode The verified wallet address of the infra/reviewer node
     * @param registrationCode The GitScience registration code
     */
    function distributeRoyalty(
        address payable author,
        address payable infraNode,
        string calldata registrationCode
    ) external payable {
        require(msg.value > 0, "No value sent");
        require(author != address(0), "Invalid author address");
        require(infraNode != address(0), "Invalid infra node address");
        
        uint256 total = msg.value;
        
        // Basis Points (bps): 10000 = 100%
        // 55% Authors (5500 bps)
        uint256 authorShare = (total * 5500) / 10000;
        
        // 15% Infra/Reviewers (1500 bps)
        uint256 infraShare = (total * 1500) / 10000;
        
        // 30% Founder Treasury (3000 bps)
        uint256 founderShare = total - authorShare - infraShare;
        
        // Disburse
        (bool successAuthor, ) = author.call{value: authorShare}("");
        require(successAuthor, "Author transfer failed");
        
        (bool successInfra, ) = infraNode.call{value: infraShare}("");
        require(successInfra, "Infra transfer failed");
        
        (bool successFounder, ) = payable(founderTreasury).call{value: founderShare}("");
        require(successFounder, "Founder transfer failed");
        
        emit RoyaltyDistributed(
            registrationCode,
            author,
            authorShare,
            infraShare,
            founderShare,
            total
        );
    }
    
    /**
     * @dev Fallback to receive ETH just in case
     */
    receive() external payable {}
}
