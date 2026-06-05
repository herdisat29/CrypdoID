// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract CrypdoIDBadge is ERC721 {
    uint256 private _tokenIdCounter;
    mapping(address => mapping(uint8 => bool)) public hasMintedTier;
    mapping(uint256 => uint8) public tokenTier;

    constructor() ERC721("CrypdoID Badge", "CRYPDO") {}

    function mintBadge(uint8 tier) external {
        require(tier >= 1 && tier <= 3, "Invalid tier");
        require(!hasMintedTier[msg.sender][tier], "Already minted this tier");
        hasMintedTier[msg.sender][tier] = true;
        _tokenIdCounter++;
        tokenTier[_tokenIdCounter] = tier;
        _safeMint(msg.sender, _tokenIdCounter);
    }

    // OZ v5 Soulbound — override _update bukan _beforeTokenTransfer
    function _update(address to, uint256 tokenId, address auth)
        internal override returns (address)
    {
        address from = _ownerOf(tokenId);
        require(from == address(0) || to == address(0), "Soulbound: tidak bisa dipindah");
        return super._update(to, tokenId, auth);
    }

    function _tierName(uint8 tier) internal pure returns (string memory) {
        if (tier == 1) return "CrypdoID Explorer";
        if (tier == 2) return "CrypdoID Specialist";
        return "CrypdoID Legend";
    }

    function _tierDesc(uint8 tier) internal pure returns (string memory) {
        if (tier == 1) return "Completed first learning module.";
        if (tier == 2) return "Completed a full learning track.";
        return "Completed all master missions.";
    }

    function _buildSVG(uint8 tier) internal pure returns (string memory) {
        string memory color = tier == 1 ? "#cd7f32" : tier == 2 ? "#c0c0c0" : "#ffd700";
        string memory tierName = _tierName(tier);
        string memory part1 = string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">',
            '<rect width="400" height="400" fill="#0f172a" rx="40"/>',
            '<circle cx="200" cy="200" r="145" fill="', color, '" stroke="#1e2937" stroke-width="12"/>'
        ));
        string memory part2 = string(abi.encodePacked(
            '<text x="200" y="185" text-anchor="middle" font-family="Arial Black" font-size="26" font-weight="bold" fill="#ffffff">', tierName, '</text>',
            '<text x="200" y="225" text-anchor="middle" font-family="Arial" font-size="14" fill="#e2e8f0">On-chain Achievement</text>',
            '</svg>'
        ));
        return string(abi.encodePacked(part1, part2));
    }

    function _buildJSON(uint8 tier) internal pure returns (string memory) {
        string memory tierName = _tierName(tier);
        string memory desc = _tierDesc(tier);
        string memory img = Base64.encode(bytes(_buildSVG(tier)));
        string memory part1 = string(abi.encodePacked('{"name":"', tierName, '","description":"', desc, '"'));
        string memory part2 = string(abi.encodePacked(',"image":"data:image/svg+xml;base64,', img, '"}'));
        return string(abi.encodePacked(part1, part2));
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(ownerOf(tokenId) != address(0), "Nonexistent token");
        uint8 tier = tokenTier[tokenId];
        return string(abi.encodePacked(
            "data:application/json;base64,",
            Base64.encode(bytes(_buildJSON(tier)))
        ));
    }
}
