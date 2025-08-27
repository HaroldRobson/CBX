
---

### **Developer Documentation: Buyer Portal**

**Objective:** To provide a comprehensive guide for building the frontend of the CBX.Earth Buyer Portal. This document maps UI components from Figma (pages 10-12) to the necessary smart contract functions and their return types.

**Primary Contracts Used:** `Factory.sol` and `CBX.sol`

---

### **Page 1: Marketplace — "Buy Carbon Credits" (Figma Page 10)**

This is the main discovery page where users find and purchase tokenized carbon credits.

#### **1.1 Data Population: Fetching and Displaying Projects**

The first step is to get a list of all active carbon credit pools and display them as cards.

*   **Initial Data Fetch:**
    *   **Function to Call:** `getActivePools()` on the `Factory` contract.
    *   **Returns:** An array of `Pool` structs: `Factory.Pool[] memory`. The UI will be built by iterating over this array.
    *   **Note for Scalability:** For a future-proof design, implement pagination. This will require a function like `getActivePoolsPaginated(offset, limit)` to be added to the `Factory` contract.

*   **Populating Each Project Card:**
    For each `Pool` struct returned from the factory, you have the static data. To get the live, dynamic data for each card, you must make calls to the specific `CBX` contract using the `pool.poolAddress` from the struct.

| UI Element (Figma) | Function to Call (on `CBX` contract) | In-Depth Return & Transformation |
| :--- | :--- | :--- |
| **Project Name, Developer, etc.** | (From `Pool` struct) | The `IPFS_URI` field contains a link to a JSON file with this metadata. The frontend must fetch this file from IPFS to display these details. |
| **Available** | `getReserves()` | **Returns:** `uint256` (number of tokens left). **Display Value:** To show tonnes, you must **divide this value by 100**. |
| **Price/Credit** | `getUSDCPricePerCreditWithFee()` | **Returns:** `uint256` (price in smallest USDC unit). **Display Value:** To show dollars, you must **divide this value by 1,000,000** (USDC has 6 decimals). Format as currency (e.g., "$12.50 USDC"). |
| **You Own** | `getPoolSummary(address _user)` | **Returns:** `PoolSummary` struct. Use the `userBalance` field (`uint256`). **Display Value:** To show tonnes, **divide `userBalance` by 100**. Pass the connected user's wallet address as the `_user` argument. |

#### **1.2 Button Functionality**

*   **"Buy Credits" Button:**
    *   **Action:** Allows a user to purchase `CBX` tokens, which will then appear in their portfolio. This is a **two-transaction process** for the user.
    *   **Step 1: Approve USDC Spending.** Before the purchase, the user must grant the `CBX` contract permission to spend their USDC.
        *   **Contract:** `USDC` (address: `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359`)
        *   **Function:** `approve(address spender, uint256 amount)`
        *   **Arguments:**
            *   `spender`: The `pool.poolAddress` of the `CBX` contract they are buying from.
            *   `amount`: The total cost of the purchase in smallest USDC units. You can calculate this by calling `calculatePurchaseCost(amountOfCBXOut)` on the `CBX` contract first.
    *   **Step 2: Execute Purchase.** After a successful approval.
        *   **Contract:** `CBX` (at the specific `pool.poolAddress`).
        *   **Function:** `buyTokensWithUSDC(uint256 amountOfCBXOut)`
        *   **Argument:**
            *   `amountOfCBXOut`: The number of tonnes the user entered, **multiplied by 100**. (e.g., 5.5 tonnes -> `550`).

*   **"Buy & Retire" Button:**
    *   **Action:** Allows a user to purchase and immediately retire credits in a single transaction. This is also a **two-transaction process** (approve, then the main call).
    *   **Step 1: Approve USDC Spending.** Same as above.
    *   **Step 2: Execute Buy & Retire.**
        *   **Contract:** `CBX` (at the specific `pool.poolAddress`).
        *   **Function:** `buyAndRetireTokensWithUSDC(uint256 amountOfCBXOut)`
        *   **This is a `payable` function.** You must fetch the fee and send it with the transaction.
            1.  Call the `RETIREMET_GAS_FEE()` view function on the `CBX` contract to get the required fee in Wei.
            2.  Pass this fee amount in the `value` field of the transaction object.
        *   **Argument:**
            *   `amountOfCBXOut`: The number of tonnes the user entered, **multiplied by 100**.

---

### **Page 2: Portfolio — "View Credits" (Figma Page 11)**

This page displays all the carbon credit tokens the user currently owns across all projects.

#### **2.1 Data Population**

*   **Fetching the User's Portfolio:**
    *   There is no single function to get this. The frontend must build the portfolio list with the following logic:
        1.  Call `Factory.getActivePools()` to get an array of all active pools.
        2.  For each `Pool` in the array, call `balanceOf(connectedUserAddress)` on its `CBX` contract (`pool.poolAddress`).
        3.  If the returned balance is greater than `0`, add this pool to a list that will be rendered on the portfolio page.
*   **Populating Each Portfolio Card:**
    *   **Amount Owned:** You already have this from the `balanceOf` call. **Display Value: `balance / 100` Tonnes.**
    *   **Price Paid:** This information is **not stored on-chain**. The DApp backend must listen to `TokensPurchasedWithUSDC` events, store the purchase history for each user in a database, and provide it to the frontend via an API.
    *   **Current Value:** `(user_balance_in_tokens * current_price_per_token) / 1,000,000`.
*   **Populating Header Stats:**
    *   **Total Credits Owned:** Sum all the `balanceOf` results from the portfolio fetch logic and **divide the final sum by 100**.
    *   **Retired Credits:** This data is also **not stored on-chain** as a simple number. Your backend must listen for `TokensQueued` events where the `user` is the connected address. Sum the `tokens` amount from all their past retirement events and provide this total to the frontend via an API. **Display Value: `total_retired_tokens / 100` Tonnes.**

#### **2.2 Button Functionality**

*   **"Retire Credits" Button:**
    *   **Action:** Burns the user's `CBX` tokens and adds their request to the off-chain retirement queue.
    *   **Contract:** `CBX` (at the `pool.poolAddress` of the specific card).
    *   **Function:** `retire(uint256 amountOfTokens)`
    *   **This is a `payable` function.** The frontend must send the `RETIREMET_GAS_FEE()` (fetched from the `CBX` contract) as the `value` of the transaction.
    *   **Argument:**
        *   `amountOfTokens`: The number of tonnes to retire, **multiplied by 100**.

---

