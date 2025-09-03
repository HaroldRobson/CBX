pragma solidity ^0.8.0;
import "./IFactory.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "forge-std/console.sol";
interface INFTReceipts {
    function sendReceipts(bytes memory retirementBundle) external;
}
contract CBX is ERC20 {
    address public owner;
    address public seller;
    address public NFTContractAddress;
    uint256 public pricePerToken; // IN 10^6 of a USD!!
    address public factory;
    address USDC;
    uint256 public fee; // in basis points eg 300 = 3% fee. applied only to purchases
    uint256 public RETIREMET_GAS_FEE; // so retirers cover the cost of the owner the processRetirements() function
    uint256 public sellerProfit;
    uint256 public feesCollected;
    uint256 public constant MAX_PENDING_RETIREMENTS = 2000;
    bool private _initialised;
    string private _name;
    string private _symbol;

    enum PoolStatus {
        PENDING_APPROVAL,
        ACTIVE,
        INACTIVE
    } // inactive means no more credits can be purchased, however they can still be retired.

    PoolStatus status;
    IERC20 USDCtokens;

    event newCreditsPurchased(uint256 amountOfNewTokens, uint256 pricePayedPerNewToken);
    event tokensMinted(uint256 amountOfNewTokens);
    event priceUpdated(uint256 newPrice);
    event feesUpdated(uint256 fee);
    event withdrawnUSDC(uint256 amount);
    event TokensPurchasedWithUSDC(address indexed buyer, uint256 amount, uint256 cost);
    event reserveOfCBXChanged(uint256 newReserve);
    event poolDeactivated(uint256 reservesLeft);
    event transferoffChain(uint256 amount, string details);

    struct PoolSummary {
        // used in getPoolSummary
        string name;
        string symbol;
        uint8 decimals;
        uint256 totalSupply;
        uint256 pricePerToken;
        uint256 pricePerTokenWithFee;
        uint256 remainingSupply;
        address seller;
        address owner;
        PoolStatus status;
        uint256 feeBps;
        uint256 userBalance;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    modifier onlySeller() {
        require(msg.sender == seller);
        _;
    }

    modifier onlyFactory() {
        require(msg.sender == factory);
        _;
    }
    constructor() ERC20("", "") {
    } // moved to initialise becasue of create2
    
    function name() public view override returns (string memory) { 
        return _name;
    }

    function symbol() public view override returns (string memory) { 
        return _symbol;
    }

    function initialise(
        uint256 _fee,
        uint256 amountOfTokens, // 1 token = 0.01 carbon credits
        uint256 _pricePerToken, // in usdc with 1e6 at the end. EG 5 USD per credit = 5e6 per Credit = 5e4 per token.
        address Owner,
        address Seller,
        string memory Name,
        uint256 index,
        address _NFTContractAddress
    ) external {
        factory = msg.sender;
        NFTContractAddress = _NFTContractAddress;
        // _setNameSymbol(Name, string(abi.encodePacked("CBX", Strings.toString(index))));
        _name = Name;
        _symbol = string(abi.encodePacked("CBX", Strings.toString(index)));
        owner = Owner;
        seller = Seller;
        USDC = 0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582; // polygon Amoy testnet
        fee = _fee;
        USDCtokens = IERC20(USDC);
        require(_pricePerToken > 1e4, "This price seems too low - check your decimals"); // Charge at least 1 dollar per carbon credit
        _mint(address(this), amountOfTokens);
        pricePerToken = _pricePerToken;
        emit tokensMinted(amountOfTokens);
        emit priceUpdated(pricePerToken);
        sellerProfit = 0;
        feesCollected = 0;
        RETIREMET_GAS_FEE = 0.05 ether;
        status = PoolStatus.PENDING_APPROVAL;
    }

    function activate() external onlyFactory {
        status = PoolStatus.ACTIVE;
    }

    function decimals() public view virtual override returns (uint8) {
        return 2;
    }

    function getUSDCPricePerCreditWithFee() public view returns (uint256) {
        return (pricePerToken * (1e4 + fee)) / 1e2; // 100 times price per token
    }

    function getUSDCPricePerTokenWithFee() public view returns (uint256) {
        return (pricePerToken * (1e4 + fee)) / 1e4;
    }

    function _closePool() private {
        emit poolDeactivated(balanceOf(address(this)));
        status = PoolStatus.INACTIVE;
        IFactory iFactory = IFactory(factory);
        if (balanceOf(address(this)) > 0) {
            iFactory.deActivatePool(true, balanceOf(address(this)));
            _burn(address(this), balanceOf(address(this)));
        } else {
            iFactory.deActivatePool(false, balanceOf(address(this)));
        }
        require(sellerProfit + feesCollected >= USDCtokens.balanceOf(address(this)), "insufficient funds");
        USDCtokens.transfer(owner, feesCollected);
        USDCtokens.transfer(seller, sellerProfit);
    }

    function withDrawUSDCFees() public onlyOwner {
        require(sellerProfit + feesCollected >= USDCtokens.balanceOf(address(this)), "insufficient funds");
        USDCtokens.transfer(owner, feesCollected);
        feesCollected = 0;
    }

    function withDrawUSDCFeesPartial(uint256 amount, address recipient) public onlyOwner {
        require(amount + sellerProfit <= USDCtokens.balanceOf(address(this)), "insufficient funds");
        USDCtokens.transfer(recipient, amount); //
        feesCollected -= amount;
    }

    function withDrawUSDCProfits() public onlySeller {
        require(sellerProfit + feesCollected >= USDCtokens.balanceOf(address(this)), "insufficient funds");
        USDCtokens.transfer(seller, sellerProfit); //
        sellerProfit = 0;
    }

    function withDrawUSDCProfitsPartial(uint256 amount) public onlySeller {
        require(amount + feesCollected <= USDCtokens.balanceOf(address(this)), "insufficient funds");
        USDCtokens.transfer(seller, amount); //
        sellerProfit -= amount;
    }

    function getReserves() public view returns (uint256) {
        return balanceOf(address(this));
    }

    function closePool() public onlySeller {
        _closePool();
    }

    function closepool() public onlyOwner {
        _closePool();
    }

    function buyTokensWithUSDC(uint256 amountOfCBXOut) external {
        // should be 100 times the tota number of credits the user wants
        require(amountOfCBXOut <= balanceOf(address(this)), "We don't have enough carbon credits in our pool");
        uint256 pricePerTokenWithFee = getUSDCPricePerTokenWithFee();
        uint256 costInUSDC = amountOfCBXOut * pricePerTokenWithFee;
        require(USDCtokens.transferFrom(msg.sender, address(this), costInUSDC), "ALERT: TRANSFER FAILED"); // this requires the customer to call (IERC20(USDC_ADDRESS)).approve(address(this), amountOfCBXOut * getPricePerTokenWithFee())
        _transfer(address(this), msg.sender, amountOfCBXOut);
        sellerProfit += costInUSDC * 1e4 / (1e4 + fee);
        feesCollected += costInUSDC * fee / (1e4 + fee);
        emit TokensPurchasedWithUSDC(msg.sender, amountOfCBXOut, costInUSDC);
        emit reserveOfCBXChanged(balanceOf(address(this)));
        if (balanceOf(address(this)) == 0) {
            _closePool();
        }
    }

    function buyAndRetireTokensWithUSDC(uint256 amountOfCBXOut) external payable {
        // should be 100 times the tota number of credits the user wants
        require(amountOfCBXOut <= balanceOf(address(this)), "We don't have enough carbon credits in our pool");
        require(pendingRetirementQueue.length < MAX_PENDING_RETIREMENTS, "Retirement queue is full, try again later");
        require(msg.value >= RETIREMET_GAS_FEE);
        payable(owner).transfer(msg.value); // transfer some XTZ to the owner for gas when they call processRetirements();
        uint256 pricePerTokenWithFee = getUSDCPricePerTokenWithFee();
        uint256 costInUSDC = amountOfCBXOut * pricePerTokenWithFee;
        require(USDCtokens.transferFrom(msg.sender, address(this), costInUSDC), "ALERT: TRANSFER FAILED"); // this requires the customer to call (IERC20(USDC_ADDRESS)).approve(address(this), amountOfCBXOut * getPricePerTokenWithFee())
        _burn(address(this), amountOfCBXOut);

        // Add to pending queue
        pendingRetirementQueue.push(
            PendingRetirement({tokens: amountOfCBXOut, user: msg.sender, timestamp: block.timestamp})
        );
        emit TokensQueued(msg.sender, amountOfCBXOut);
        sellerProfit += costInUSDC * 1e4 / (1e4 + fee);
        feesCollected += costInUSDC * fee / (1e4 + fee);
        emit TokensPurchasedWithUSDC(msg.sender, amountOfCBXOut, costInUSDC);
        emit reserveOfCBXChanged(balanceOf(address(this)));
        if (balanceOf(address(this)) == 0) {
            _closePool();
        }
    }

    function sellerTransfer(address recipient, uint256 amount) public onlySeller {
        _transfer(address(this), recipient, amount);
    }

    function setFee(uint256 _fee) external onlyOwner {
        // in basis point
        fee = _fee;
    }

    function setRetirementGasFee(uint256 _fee) external onlyOwner {
        RETIREMET_GAS_FEE = _fee; // make sure to include 1e18 in input
    }

    function getPoolSummary(address _user) external view returns (PoolSummary memory) {
        return PoolSummary({
            name: name(),
            symbol: symbol(),
            decimals: decimals(),
            totalSupply: totalSupply(),
            pricePerToken: pricePerToken,
            pricePerTokenWithFee: getUSDCPricePerTokenWithFee(),
            remainingSupply: getReserves(),
            seller: seller,
            owner: owner,
            status: status,
            feeBps: fee,
            userBalance: balanceOf(_user)
        });
    }

    ///////////THE REMAINING CODE IS FOR RETIREMENT

    struct PendingRetirement {
        uint256 tokens;
        address user;
        uint256 timestamp;
    }

    PendingRetirement[] public pendingRetirementQueue;
    PendingRetirement[] public retirementBundle;

    function split(uint8 index, uint256 sizeOfAmountToRemove) internal {
        PendingRetirement memory retirementToSplit = pendingRetirementQueue[index];
        PendingRetirement memory stayForNextBatch = PendingRetirement({
            tokens: retirementToSplit.tokens - sizeOfAmountToRemove,
            user: retirementToSplit.user,
            timestamp: retirementToSplit.timestamp
        });
        PendingRetirement memory addToBundle = PendingRetirement({
            tokens: sizeOfAmountToRemove,
            user: retirementToSplit.user,
            timestamp: retirementToSplit.timestamp
        });

        pendingRetirementQueue[index] = stayForNextBatch;
        retirementBundle.push(addToBundle);
    }

    // Events
    event TokensQueued(address indexed user, uint256 tokens);
    event RetirementBundle(uint256 indexed bundleId, uint256 bundleSize, bytes RetirementData, address originalPool);

    uint256 public bundleCounter = 0;

    // User queues credits for retirement
    function retire(uint256 amountOfTokens) external payable {
        require(pendingRetirementQueue.length < MAX_PENDING_RETIREMENTS, "Retirement queue is full, try again later");
        require(msg.value >= RETIREMET_GAS_FEE);
        payable(owner).transfer(msg.value); // transfer some XTZ to the owner for gas when they call processRetirements();
        _burn(msg.sender, amountOfTokens);

        // Add to pending queue
        pendingRetirementQueue.push(
            PendingRetirement({tokens: amountOfTokens, user: msg.sender, timestamp: block.timestamp})
        );

        emit TokensQueued(msg.sender, amountOfTokens);
    }

    // Process retirements into bundles (called by owner periodically)
    function processRetirements() public onlyOwner {
        require(pendingRetirementQueue.length != 0, "QUEUE IS TOO SMALL");
        uint8 maxBundleLength = uint8(pendingRetirementQueue.length);
        if (pendingRetirementQueue.length < maxBundleLength) return;
        uint256 totalTokens = 0; // total tokens in our proposed bundle (will most likely NOT be divisble by 100)
        uint256 residue; // residue mod 100
        for (uint256 i = 0; i < maxBundleLength; i++) {
            totalTokens += pendingRetirementQueue[i].tokens;
        }

        residue = totalTokens % 100;
        uint256 totalToKeep = 0;
        uint8 indexToSplit;
        if (residue != 0) {
            indexToSplit = maxBundleLength;
            while (totalToKeep < residue) {
                if (indexToSplit == 0) {
                    return;
                }
                indexToSplit -= 1;
                totalToKeep += pendingRetirementQueue[indexToSplit].tokens; // "totalToKeep" counts backwards until it overshoots the residue. We then split the PendingRetirement to account for this.
            }
            split(indexToSplit, totalToKeep - residue);
        } else {
            indexToSplit = maxBundleLength;
        }
        uint256 retirementTotal = 0;
        for (uint256 i = 0; i < indexToSplit; i++) {
            retirementTotal += pendingRetirementQueue[i].tokens;
            retirementBundle.push(pendingRetirementQueue[i]);
        }
        if (residue != 0) {
            retirementTotal += totalToKeep - residue; // if we did do a split, make sure it is accounted for.
        }
        require(totalTokens - residue == retirementTotal, "SOMETHING DOESNT ADD UP!");
        bundleCounter++;
        bytes memory retirementData = abi.encode(retirementBundle);
        emit RetirementBundle(bundleCounter, retirementTotal, retirementData, address(this)); // retirementTotal should be divisible by 100
        INFTReceipts NFTReceipts = INFTReceipts(NFTContractAddress);
        NFTReceipts.sendReceipts(retirementData); // auto send a pending receipt.
        delete retirementBundle;
        for (uint256 i = 0; i < pendingRetirementQueue.length - indexToSplit; i++) {
            pendingRetirementQueue[i] = pendingRetirementQueue[i + indexToSplit]; // shift entire queue forward.
        }
        for (uint256 i = 0; i < indexToSplit; i++) {
            pendingRetirementQueue.pop(); // remove duplicates
        }
        return;
    }

    // View pending retirements
    function getPendingCount() external view returns (uint256) {
        return pendingRetirementQueue.length;
    }

    function transferOffChain(uint256 amountOfTokens, string memory details) external payable {
        require(msg.value >= RETIREMET_GAS_FEE);
        uint256 residue = amountOfTokens % 100;
        uint256 amountToBurn = amountOfTokens - residue;
        payable(owner).transfer(msg.value); // transfer some XTZ to the owner for gas when they call processRetirements();
        _burn(msg.sender, amountToBurn);
        emit transferoffChain(amountToBurn, details);
    }
}
