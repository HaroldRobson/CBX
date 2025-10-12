pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract NFTReceipt is ERC721 {
    struct RetirementReceipt {
        string documentHash;
        uint256 value; // in TOKENS not credits. IE 100 of these is one carbon credit.
        uint256 purchaseDate;
        uint256 receivalDate;
        address originalPool;
    }

    struct PendingRetirement {
        // sendReceipts() expects an abi encoded array of these - exactly as we emitted in emit RetirementBundle in CBX.sol
        uint256 tokens;
        address user;
        uint256 timestamp;
    }

    mapping(uint256 => RetirementReceipt) private receipts;

    address public owner;
    uint256 public NFTID;

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    constructor() ERC721("CBX Carbon Retirement Receipt", "CBXR") {
        owner = msg.sender;
        NFTID = 0;
    }

    function mintWithData(
        address retirer,
        address originalPool,
        string memory documentHash,
        uint256 value,
        uint256 purchaseDate
    ) private {
        NFTID++;
        RetirementReceipt memory retirementReceipt = RetirementReceipt({
            documentHash: documentHash,
            value: value,
            purchaseDate: purchaseDate,
            receivalDate: block.timestamp,
            originalPool: originalPool
        });
        _mint(retirer, NFTID);
        receipts[NFTID] = retirementReceipt;
    }

    function sendReceipts(bytes memory retirementBundle, address originalPool, string memory documentHash)
        external
        onlyOwner
    {
        PendingRetirement[] memory retirements = abi.decode(retirementBundle, (PendingRetirement[]));
        for (uint256 i = 0; i < retirements.length; i++) {
            mintWithData(
                retirements[i].user, originalPool, documentHash, retirements[i].tokens, retirements[i].timestamp
            );
        }
    }
    /* EXAMPLE JSON I FOUND ON STACK EXCHANGE:
    {"name":"Square #1",
    "description":"",
    "image":"https://tenthousandsu.com/erc721/00001.svg",
    "external_url":"https://tenthousandsu.com/square#00001",
    "attributes":[{"trait_type":"Row",
    "value":1},
    {"trait_type":"Column",
    "value":1},
    {"trait_type":"Manhattan distance to center",
    "value":98},
    {"trait_type":"Prime divisors",
    "value":0},
    {"trait_type":"Palindrome",
    "value":"ALL SAME DIGIT"}]}
    */

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        RetirementReceipt memory receipt = receipts[tokenId];

        string memory json = string(
            abi.encodePacked( // apparently there is a strict json format to allow metamask to display the NFT properly.
                '{"name": "Receipt from ',
                Strings.toHexString(uint256(uint160(receipt.originalPool)), 20),
                '"',
                ', "description": "Click to view PDF"',
                /*SVG*/
                ', "image": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjMyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSIzNSUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Q0FSQk9OIFJFVElSRU1FTlQ8L3RleHQ+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+UkVDRUlQVDwvdGV4dD48dGV4dCB4PSI1MCUiIHk9IjY1JSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5jbGljayB0byB2aWV3PC90ZXh0Pjwvc3ZnPg=="',
                ', "external_url": "https://ipfs.io/ipfs/',
                receipt.documentHash,
                '"',
                ', "attributes": [{"trait_type": "tokens", "value":',
                Strings.toString(receipt.value),
                "}",
                ', {"trait_type": "Purchase Date", "value":',
                Strings.toString(receipt.purchaseDate),
                "}",
                ', {"trait_type": "Receival Date", "value":',
                Strings.toString(receipt.receivalDate),
                "}]}"
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(json))));
    }
}
