// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CrypdoIDArchetype is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    struct ArchetypeStats {
        string archetypeType;
        uint8 fomo;
        uint8 greed;
        uint8 scamResistance;
    }

    mapping(uint256 => ArchetypeStats) public archetypeStats;
    mapping(address => bool) public hasMinted;

    event ArchetypeMinted(address indexed user, uint256 indexed tokenId, string archetypeType);

    constructor(address initialOwner)
        ERC721("CrypdoID Archetype", "CDA")
        Ownable(initialOwner)
    {}

    // User mint sendiri — lebih aman dari versi lama
    function mintArchetype(
        string memory uri,
        string memory _archetypeType,
        uint8 _fomo,
        uint8 _greed,
        uint8 _scamResistance
    ) public {
        require(!hasMinted[msg.sender], "Wallet already owns a CrypdoID Archetype");
        uint256 tokenId = _nextTokenId++;
        hasMinted[msg.sender] = true;
        archetypeStats[tokenId] = ArchetypeStats({
            archetypeType: _archetypeType,
            fomo: _fomo,
            greed: _greed,
            scamResistance: _scamResistance
        });
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);
        emit ArchetypeMinted(msg.sender, tokenId, _archetypeType);
    }

    // Admin mint untuk airdrop
    function adminMint(
        address to,
        string memory uri,
        string memory _archetypeType,
        uint8 _fomo,
        uint8 _greed,
        uint8 _scamResistance
    ) public onlyOwner {
        require(!hasMinted[to], "Wallet already owns a CrypdoID Archetype");
        uint256 tokenId = _nextTokenId++;
        hasMinted[to] = true;
        archetypeStats[tokenId] = ArchetypeStats({
            archetypeType: _archetypeType,
            fomo: _fomo,
            greed: _greed,
            scamResistance: _scamResistance
        });
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        emit ArchetypeMinted(to, tokenId, _archetypeType);
    }

    function tokenURI(uint256 tokenId)
        public view override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
