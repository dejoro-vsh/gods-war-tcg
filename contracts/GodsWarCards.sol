// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";

contract GodsWarCards is ERC1155, Ownable, ERC2981 {
    using Strings for uint256;
    
    // We can change the base URI later if we move images to IPFS
    string public baseURI;
    
    // Track total minted for each card ID
    mapping(uint256 => uint256) public totalSupply;

    // Pass msg.sender to the Ownable constructor (required in OpenZeppelin 5.x)
    constructor(string memory _baseURI) ERC1155(_baseURI) Ownable(msg.sender) {
        baseURI = _baseURI;
        // Set default royalty to 5% (500 basis points) directed to the deployer
        _setDefaultRoyalty(msg.sender, 500);
    }

    // Function allowing the Server (Owner) to mint cards to users for free
    function serverMint(address to, uint256 id, uint256 amount) public onlyOwner {
        _mint(to, id, amount, "");
        totalSupply[id] += amount;
    }

    // Allows updating the metadata URL if images move
    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
        baseURI = newuri;
    }

    // Standard OpenZeppelin override to return the correct URL for each token ID
    function uri(uint256 tokenId) public view override returns (string memory) {
        return string(abi.encodePacked(baseURI, tokenId.toString(), ".json"));
    }

    // Override supportsInterface to resolve conflict between ERC1155 and ERC2981
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
