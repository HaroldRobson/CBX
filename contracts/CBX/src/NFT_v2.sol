
pragma solidity ^0.8.0;
import "./IFactory.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";


contract NFTReceipt is ERC721 {
    struct RetirementReceipt {
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
    struct awaitingReceipt {
      PendingRetirement[] pendingRetirements;
      uint256 totalValue;// in tokens not credits
      uint256 firstNFTID;
      uint256 lastNFTID;
      uint256 bundle;
      IFactory.Pool pool;
    }
    mapping(uint256 => awaitingReceipt) public awaitingReceipts;
    mapping(uint256 => bool) public awaitingReceiptsHandled;
    mapping(uint256 => RetirementReceipt) private receipts;

    mapping(uint256 => bool) public isRetired;
    mapping(uint256 => string) public IPFSHash;

    address public owner;
    address public factory;
    uint256 public NFTID;
    uint256 public bundleCounter;
    string private _name;
    string private _symbol;

    function name() public view override returns (string memory) { 
        return _name;
    }

    function symbol() public view override returns (string memory) { 
        return _symbol;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }
    modifier onlyPool() {
        IFactory.Pool memory pool = IFactory(factory).getPool(msg.sender);
        require(pool.initialSupply != 0); // if the initial supply is 0 then the address was a null pool.
        _;
    }

    constructor() ERC721("CBX Carbon Retirement Receipt", "CBXR") { }
    function initialise(address _owner) public {// constructed by Factory only.
        _name = "CBX Carbon Retirement Receipt";
        _symbol = "CBXR";
        factory = msg.sender;
        owner = _owner;
        NFTID = 0;
        bundleCounter = 0;
    }

    function mintWithOutIPFS(address retirer, address originalPool, uint256 value, uint256 purchaseDate) private {
        NFTID++;
        RetirementReceipt memory retirementReceipt = RetirementReceipt({
            value: value,
            purchaseDate: purchaseDate,
            receivalDate: block.timestamp,
            originalPool: originalPool
        });
        _mint(retirer, NFTID);
        receipts[NFTID] = retirementReceipt;
    }

    function sendReceipts(bytes memory retirementBundle) external onlyPool { 
        PendingRetirement[] memory retirements = abi.decode(retirementBundle, (PendingRetirement[]));
        uint256 totalTokensInBundle = 0;
        uint256 first = NFTID + 1;
        for (uint256 i = 0; i < retirements.length; i++) {
            mintWithOutIPFS(retirements[i].user, msg.sender, retirements[i].tokens, retirements[i].timestamp);
            totalTokensInBundle += retirements[i].tokens;
        }
        uint256 last = NFTID;
        IFactory.Pool memory pool = IFactory(factory).getPool(msg.sender);
        awaitingReceipt memory AwaitingReceipt = awaitingReceipt({
            pendingRetirements: retirements,
            totalValue: totalTokensInBundle,
            firstNFTID: first,
            lastNFTID: last,
            bundle: bundleCounter,
            pool: pool
        });
        awaitingReceipts[bundleCounter] = AwaitingReceipt;
        bundleCounter++;

    }
    function getPendingBundles() external view returns (awaitingReceipt[] memory) {
        uint256 num = 0;
        for (uint i = 0; i < bundleCounter; i++) {
            if (awaitingReceiptsHandled[i] == false) {
                num++;
            }
        }
        uint256 index = 0;
        awaitingReceipt[] memory AwaitingReceipts = new awaitingReceipt[](num);
        for (uint i = 0; i < bundleCounter; i++) {
            if (awaitingReceiptsHandled[i] == false) {
            AwaitingReceipts[index] = awaitingReceipts[i];
            index++;
            }
        }
        return AwaitingReceipts;

    }

    function getAwaitingReceipt(uint256 bundleId) external view returns (awaitingReceipt memory) {
        return awaitingReceipts[bundleId];
    }

    function validateReceipts(uint256 bundle, string memory IPFS) public onlyOwner {
        require(!awaitingReceiptsHandled[bundle], "Bundle has already been handled");
        awaitingReceipt memory AwaitingReceipt = awaitingReceipts[bundle];
        for (uint256 i = AwaitingReceipt.firstNFTID; i < AwaitingReceipt.lastNFTID + 1; i++) {
           isRetired[i] = true; 
           IPFSHash[i] = IPFS;
        }
        require(AwaitingReceipt.firstNFTID != 0, "Bundle does not exist");
        awaitingReceiptsHandled[bundle] = true; 
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
        ownerOf(tokenId);
        RetirementReceipt memory receipt = receipts[tokenId];
        string memory IPFS = IPFSHash[tokenId];
        string memory json = string(
            abi.encodePacked( // apparently there is a strict json format to allow metamask to display the NFT properly.
                '{"name": "Receipt from ',
                Strings.toHexString(uint256(uint160(receipt.originalPool)), 20),
                '"',
                ', "description": "Click to view PDF"',
                /*SVG*/
                ', "image": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjMyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSIzNSUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Q0FSQk9OIFJFVElSRU1FTlQ8L3RleHQ+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+UkVDRUlQVDwvdGV4dD48dGV4dCB4PSI1MCUiIHk9IjY1JSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5jbGljayB0byB2aWV3PC90ZXh0Pjwvc3ZnPg=="',
                ', "external_url": "https://ipfs.io/ipfs/',
                IPFS,
                '"',
                ', "attributes": [{"trait_type": "tokens", "value":',
                Strings.toString(receipt.value),
                "}",
                ', {"trait_type": "Purchase Date", "value":',
                Strings.toString(receipt.purchaseDate),
                "}",
                ', {"trait_type": "has receipt", "value":',
                isRetired[tokenId] ? "true" : "false",
                "}",
                ', {"trait_type": "Receival Date", "value":',
                Strings.toString(receipt.receivalDate),
                "}]}"
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(json))));
    }
}
