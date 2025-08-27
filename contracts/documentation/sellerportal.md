---

### **Developer Documentation: Seller Portal**

**Objective:** To provide a comprehensive guide for building the frontend of the CBX.Earth Seller Portal. This document maps UI components directly to the necessary smart contract functions and their return types.

**Primary Contracts Used:** `Factory.sol` and `CBX.sol`

---

### **Page 1: "My Pools" Dashboard (Figma Page 14)**

This is the main landing page for a logged-in seller. It displays all the carbon credit pools they have created and allows them to manage them.

#### **1.1 Data Population: Fetching the Seller's Pools**

To render this page, you first need to get a list of all pools associated with the currently connected seller's wallet address.

*   **Function to Call:** `getSellersPools(address sellerAddress)` on the `Factory` contract.
*   **Argument:** The connected seller's wallet address (e.g., from their MetaMask or Thirdweb wallet).
*   **Returns:** An array of `Pool` structs: `Factory.Pool[] memory`.

#### **In-Depth Return Type: The `Pool` Struct**

The `getSellersPools` function returns an array of this struct. Each element in the array represents one pool the seller has created. Your frontend will iterate through this array to build the UI.

| Field Name | Solidity Type | Description | Frontend Action / Notes |
| :--- | :--- | :--- | :--- |
| `status` | `enum PoolStatus` | The current state of the pool. It will be an integer: `0` (PENDING_APPROVAL), `1` (ACTIVE), or `2` (INACTIVE). | Use this integer to filter the pools into the correct tabs ("Active 3", "Pending Approval 1", "Inactive 2" in the Figma). |
| `poolAddress` | `address` | **The unique address of the CBX token contract for this specific pool.** | **Crucial:** You must store this address. You will use it to instantiate a new `CBX` contract object (e.g., `new ethers.Contract(poolAddress, CBX_ABI, provider)`) to call functions specific to that pool. |
| `IPFS_URI` | `string` | The IPFS link to the detailed off-chain documentation for the carbon credits. | Provide this as a link for the seller to view their project details. |
| `seller` | `address` | The wallet address of the seller who owns this pool. | Can be used for verification, but you already have this from the function call. |
| `pricePerToken`| `uint256` | The base price per token set by the seller. | This is the raw value. For display, you'll likely want the price per credit: `(pricePerToken * 100) / 1,000,000` to get the USDC dollar value. |
| `deposit` | `uint256` | The security deposit paid by the seller to create the pool. | Informational. The seller gets this back when the pool is closed. |
| `initialSupply`| `uint256` | The total number of tokens that were minted when the pool was created. | Use this to display the total size of the pool. **Display Value: `initialSupply / 100` to show tonnes.** |
| `registry` | `uint256` | An integer representing the credit registry (e.g., 0 for Verra, 1 for Gold Standard). | Map this integer to a human-readable string in the UI. |

#### **1.2 Populating Individual Pool Cards**

After fetching the list of pools, you need to make additional calls to the specific `CBX` contract for each pool to get real-time data.

*   **For "Amount Sold":**
    *   The `Pool` struct gives you `initialSupply`.
    *   You need to call `getReserves()` on the `CBX` contract (using the `poolAddress`). This returns a `uint256` representing the tokens *remaining*.
    *   **Calculation:** `amountSoldInTokens = initialSupply - reserves`
    *   **Display Value:** Show a string like `"{amountSoldInTokens / 100} / {initialSupply / 100} Tonnes"`.

*   **For "Profits Earned":**
    *   **Function to Call:** `sellerProfit()` on the `CBX` contract (using the `poolAddress`).
    *   **Returns:** A `uint256` representing the total profit in the smallest unit of USDC.
    *   **Display Value:** To show the dollar amount, you **must divide by 1,000,000** (since USDC has 6 decimals). Format it as a currency string (e.g., "$29,400.00 USDC").

#### **1.3 Button Functionality**

*   **"Withdraw Profits" Button:**
    *   **Action:** This triggers a transaction to transfer the seller's accumulated USDC profits from the pool contract to their wallet.
    *   **Contract to Call:** `CBX` (at the specific `poolAddress` of the card).
    *   **Function to Call:** `withDrawUSDCProfits()`
    *   **Arguments:** None.
    *   **Note:** This is a write transaction. The UI should show pending/success/fail states.

*   **"Cancel Pool" Button:**
    *   **Action:** This triggers a transaction to permanently deactivate the pool. Any unsold tokens will be burned, and the seller's initial 1 ETH deposit will be returned.
    *   **Contract to Call:** `CBX` (at the specific `poolAddress` of the card).
    *   **Function to Call:** `closePool()`
    *   **Arguments:** None.
    *   **Note:** This is a significant, irreversible action. **The UI must show a confirmation modal** (e.g., "Are you sure you want to cancel this pool? This action cannot be undone.") before sending the transaction.

---

### **Page 2: "List New Credits" Form (Figma Page 13)**

This is a multi-step form in the UI that collects all necessary information to create a new carbon credit pool. This entire process culminates in a **single** smart contract transaction.

#### **2.1 The Final Transaction**

When the seller clicks "Submit" on the final "Review & Submit" step, you will call one function.

*   **Function to Call:** `createPool(...)` on the `Factory` contract.
*   **This is a `payable` function.** The frontend must send the required security deposit along with the transaction.
    *   First, fetch the required deposit amount by calling `poolCreationDeposit()` on the `Factory` contract.
    *   Send this amount in the `value` field of the transaction object.

#### **2.2 Mapping Form Fields to Function Arguments**

Here is how the data collected in the form maps to the arguments of the `createPool` function.

| Form Field (from Figma) | Argument Name | Data Type | Frontend Transformation / Notes |
| :--- | :--- | :--- | :--- |
| Project Name, etc. | `IPFS` | `string` | The frontend will need to gather all metadata (Project Name, Developer, Country, etc.), create a JSON file, upload it to an IPFS service (like Pinata), and pass the resulting URI here. |
| Price per Credit | `pricePerToken` | `uint256` | **CRITICAL:** The user will enter a dollar value (e.g., "12.50"). You must convert this to the correct integer format. **Formula: `uint256((userInputPrice / 100) * 1_000_000)`**. Example: $12.50 -> `(12.50 / 100) * 1e6 = 125000`. |
| Number of Tonnes | `_initialSupply` | `uint256` | **CRITICAL:** The user will enter the number of tonnes (e.g., "5000"). You must convert this to the token amount. **Formula: `userInputTonnes * 100`**. Example: 5000 Tonnes -> `500000`. |
| (Auto-filled) | `SellerAddress` | `address` | Use the connected seller's wallet address. |
| Serial Number Range | `serialNumber` | `string` | Pass the string directly from the input field. |
| Registry | `_registry` | `uint256` | The dropdown should map the selected string (e.g., "Verra") to its corresponding integer value (`0`). |

#### **General Notes for the Developer**

*   **Error Handling:** All write transactions (`createPool`, `withDrawUSDCProfits`, `closePool`) can fail. The UI must handle these potential errors gracefully and provide feedback to the user.
*   **Transaction States:** Use a state management library to track the status of transactions (e.g., "Pending confirmation in wallet...", "Transaction sent, waiting for confirmation...", "Success!").
*   **Data Formatting:** Always be mindful of the conversions between human-readable numbers (tonnes, dollars) and the `uint256` values required by the smart contracts. Double-check the formulas provided above.
