
---

### **Developer Documentation: Admin Portal**

**Objective:** To provide a comprehensive guide for building the frontend of the CBX.Earth Admin Portal. This portal is for the platform owner to manage pool approvals, process retirements, handle finances, and configure platform-wide settings.

**Primary Contracts Used:** `Factory.sol` and `CBX.sol`

The Admin Portal should be structured into logical sections. Here are the four key features and how to build them.

---

### **1. Feature: Pool Approval Queue**

**Use Case:** To review newly created carbon credit pools and officially activate them, making them visible in the public marketplace.

#### **1.1 Data Population**

The main component of this page is a list of all pools that are awaiting approval.

*   **Function to Call:** `getPendingPools()` on the `Factory` contract.
*   **Returns:** An array of `Pool` structs: `Factory.Pool[] memory`.
*   **UI Logic:** The frontend should iterate through this array. If the array is empty, it should display a message like "No pools are currently awaiting approval." Otherwise, it should render a card or list item for each pending pool.

#### **In-Depth Return Type: The `Pool` Struct**

For each `Pool` struct returned, the admin will need to see specific details to make an approval decision.

| Field Name | Solidity Type | Description | Frontend Action / Notes |
| :--- | :--- | :--- | :--- |
| `poolAddress` | `address` | The address of the new `CBX` contract. | **Crucial:** This address is the argument needed for the `activatePool` function. |
| `seller` | `address` | The wallet address of the project developer who submitted the pool. | Display for informational and security purposes. |
| `IPFS_URI` | `string` | The IPFS link to the project's documentation. | **This is the most important field for review.** The UI must render this as a clickable link that opens in a new tab so the admin can perform off-chain due diligence. |
| `initialSupply`| `uint256` | The total number of tokens to be listed. | **Display Value:** `initialSupply / 100` Tonnes. |
| `pricePerToken`| `uint256` | The base price per token set by the seller. | Display the price per credit for easier review. **Display Value:** `(pricePerToken * 100) / 1,000,000` USD. |
| `registry` | `uint256` | The integer representing the credit registry. | Map the integer to a human-readable string (e.g., 0 -> "Verra"). |

#### **1.2 Button Functionality**

*   **"Approve Pool" Button:**
    *   **Action:** Activates the pool, changing its status from `PENDING_APPROVAL` to `ACTIVE`.
    *   **Contract to Call:** `Factory`.
    *   **Function to Call:** `activatePool(address poolAddress)`
    *   **Argument:** The `poolAddress` from the `Pool` struct you are approving.
    *   **UI Feedback:** After a successful transaction, the page should refresh, and the approved pool should disappear from the pending queue.

*   **"Reject Pool" Button:**
    *   **Note:** There is no on-chain "rejection" function. Rejection is an off-chain social process. This button in the UI would trigger an email or other communication to the seller explaining why their submission was not approved. It would *not* initiate a transaction. The pool would remain in the `PENDING_APPROVAL` state on-chain unless you decide to add a destructive "reject" function later.

---

### **2. Feature: Retirement Processing**

**Use Case:** To monitor the retirement queues across all active pools and process them to generate retirement bundles for off-chain execution.

#### **2.1 Data Population**

This page should display a list of all `ACTIVE` pools and the status of their retirement queues.

1.  **Get All Active Pools:** First, call `getActivePools()` on the `Factory` contract to get an array of all active `Pool` structs.
2.  **Get Queue Status for Each Pool:** For each `Pool` in the array, make two calls to its `CBX` contract (using its `poolAddress`):
    *   `getPendingCount()`: Returns `uint256`. This tells you how many retirement requests are in that pool's queue.
    *   `getPendingRetirements(uint256 _offset, uint256 _limit)`: Returns `PendingRetirement[] memory`. Use this to display the actual contents of the queue (user address and token amount) in a detail view.

#### **2.2 Button Functionality**

*   **"Process Retirements" Button:**
    *   **Action:** Executes the core retirement logic, bundling pending requests. This button would appear next to any pool with a pending count greater than 0.
    *   **Contract to Call:** `CBX` (at the specific `poolAddress` you want to process).
    *   **Function to Call:** `processRetirements()`
    *   **Note for Developer:** This function can be gas-intensive. While a manual button is good for the UI, a backend script/service should ideally be set up to call this function automatically when a queue reaches a certain threshold. The UI button serves as a manual override. After a successful transaction, the "Pending Count" for that pool should update.

---

### **3. Feature: Platform Financials & Configuration**

**Use Case:** To view platform-wide revenue and manage key parameters like fees and deposits.

#### **3.1 Data Population**

*   **Total Platform Fees Collected:**
    *   There is no single function for this. The frontend must iterate through **all** pools (by calling `getAllPools()` on `Factory`) and for each pool, call `feesCollected()` on its `CBX` contract.
    *   The UI should then sum these values to display a "Total Earnable Revenue."
    *   **Display Value:** Remember to divide the final `uint256` sum by **1,000,000** to show the USDC dollar value.

*   **Current Platform Settings:**
    *   **Function to Call (on `Factory`):**
        *   `fee()` -> returns `uint256` (in basis points, e.g., 300 = 3%).
        *   `poolCreationDeposit()` -> returns `uint256` (in Wei). **Display Value:** `deposit / 1e18` ETH/MATIC.
        *   `retirementGasFee()` -> returns `uint256` (in Wei). **Display Value:** `fee / 1e18` ETH/MATIC.

#### **3.2 Button Functionality**

*   **"Withdraw Fees" (Per Pool):**
    *   Next to each pool's `feesCollected` display, there should be a withdraw button.
    *   **Contract:** `CBX` (at the specific `poolAddress`).
    *   **Function:** `withDrawUSDCFees()`

*   **"Update Settings" Form:**
    *   The UI will have input fields for each setting. A "Save Changes" button would trigger the corresponding transaction.
    *   **Contract:** `Factory`.
    *   **Functions:**
        *   `changeFee(uint256 _fee)`: Argument must be in basis points.
        *   `changePoolCreationDeposit(uint256 _poolCreationDeposit)`: The frontend must take a user input (e.g., "1.5" ETH) and convert it to Wei: `1.5 * 1e18`.
        *   `changeRetirementGasFee(uint256 _fee)`: Same as above, convert user input to Wei.

---

### **4. Feature: Emergency Management**

**Use Case:** To provide the owner with powerful tools to manage pools in unexpected situations (e.g., suspected fraud, request from seller).

*   **Data Population:** This section could list all pools (`getAllPools()`) regardless of status.
*   **Button Functionality:**
    *   **"Force Close Pool" Button:**
        *   **Action:** Immediately deactivates a pool. This is an `onlyOwner` version of the seller's `closePool` function.
        *   **Contract:** `CBX` (at the specific `poolAddress` to be closed).
        *   **Function:** `closepool()` (lowercase 'p').
        *   **UI Warning:** This is a powerful and destructive action. The UI **must** implement a strong confirmation modal (e.g., requiring the admin to type the pool's name) before executing the transaction.
