// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title GitScience™ SovereignIPNFT (ERC-721 + EIP-2981)
 * @notice Децентрализованная токенизация научных открытий, патентов и математических моделей.
 * @dev Включает EIP-2981 стандарт роялти с привязкой к смарт-контракту AmanatSplitter (55/15/30).
 */

interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

interface IERC721 is IERC165 {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    function balanceOf(address owner) external view returns (uint256 balance);
    function ownerOf(uint256 tokenId) external view returns (address owner);
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function transferFrom(address from, address to, uint256 tokenId) external;
    function approve(address to, uint256 tokenId) external;
    function getApproved(uint256 tokenId) external view returns (address operator);
    function setApprovalForAll(address operator, bool _approved) external;
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}

interface IERC2981 is IERC165 {
    function royaltyInfo(uint256 tokenId, uint256 salePrice) external view returns (address receiver, uint256 royaltyAmount);
}

contract SovereignIPNFT is IERC721, IERC2981 {
    string public name = "GitScience Sovereign IP-NFT";
    string public symbol = "GS-IPNFT";

    address public immutable founderWallet;
    address public immutable amanatSplitterAddress;
    uint256 public nextTokenId = 1;

    struct PatentRecord {
        string registrationCode;
        string sha256PayloadHash;
        string astMerkleDigest;
        string tokenURI;
        address leadAuthor;
        uint256 mintedAt;
    }

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    mapping(uint256 => PatentRecord) public patentRecords;

    event PatentTokenized(
        uint256 indexed tokenId,
        string registrationCode,
        string sha256Hash,
        address indexed author,
        string tokenURI
    );

    constructor(address _founderWallet, address _amanatSplitter) {
        require(_founderWallet != address(0), "Invalid founder");
        require(_amanatSplitter != address(0), "Invalid splitter");
        founderWallet = _founderWallet;
        amanatSplitterAddress = _amanatSplitter;
    }

    function supportsInterface(bytes4 interfaceId) public pure override returns (bool) {
        return interfaceId == type(IERC721).interfaceId || 
               interfaceId == type(IERC2981).interfaceId ||
               interfaceId == type(IERC165).interfaceId;
    }

    function balanceOf(address owner) public view override returns (uint256) {
        require(owner != address(0), "Address zero query");
        return _balances[owner];
    }

    function ownerOf(uint256 tokenId) public view override returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "Nonexistent token");
        return owner;
    }

    function tokenURI(uint256 tokenId) public view returns (string memory) {
        require(_owners[tokenId] != address(0), "Nonexistent token");
        return patentRecords[tokenId].tokenURI;
    }

    /**
     * @notice Минтинг нового суверенного IP-NFT с привязкой Prior Art
     */
    function mintIPNFT(
        address to,
        string calldata registrationCode,
        string calldata sha256Hash,
        string calldata astMerkle,
        string calldata uri
    ) external returns (uint256) {
        require(to != address(0), "Cannot mint to zero address");
        uint256 tokenId = nextTokenId++;

        _owners[tokenId] = to;
        _balances[to] += 1;

        patentRecords[tokenId] = PatentRecord({
            registrationCode: registrationCode,
            sha256PayloadHash: sha256Hash,
            astMerkleDigest: astMerkle,
            tokenURI: uri,
            leadAuthor: to,
            mintedAt: block.timestamp
        });

        emit Transfer(address(0), to, tokenId);
        emit PatentTokenized(tokenId, registrationCode, sha256Hash, to, uri);

        return tokenId;
    }

    /**
     * @notice EIP-2981 Стандарт роялти: 3000 bps (30%) направляется в AmanatSplitter
     */
    function royaltyInfo(uint256, uint256 salePrice) external view override returns (address, uint256) {
        uint256 royaltyAmount = (salePrice * 3000) / 10000; // 30% роялти протоколу
        return (amanatSplitterAddress, royaltyAmount);
    }

    // Стандартные трансферные методы ERC-721
    function approve(address to, uint256 tokenId) external override {
        address owner = ownerOf(tokenId);
        require(msg.sender == owner || isApprovedForAll(owner, msg.sender), "Not authorized");
        _tokenApprovals[tokenId] = to;
        emit Approval(owner, to, tokenId);
    }

    function getApproved(uint256 tokenId) public view override returns (address) {
        require(_owners[tokenId] != address(0), "Nonexistent token");
        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) external override {
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address owner, address operator) public view override returns (bool) {
        return _operatorApprovals[owner][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) public override {
        require(ownerOf(tokenId) == from, "Incorrect owner");
        require(to != address(0), "Transfer to zero address");
        require(msg.sender == from || getApproved(tokenId) == msg.sender || isApprovedForAll(from, msg.sender), "Not authorized");

        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;
        delete _tokenApprovals[tokenId];

        emit Transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) external override {
        transferFrom(from, to, tokenId);
    }
}
