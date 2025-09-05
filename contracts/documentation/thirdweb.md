
---

### **Developer Guide: Calling Smart Contracts with the Thirdweb SDK (v5)**

**Objective:** This document provides a practical guide for interacting with the `CBX.Earth` smart contracts (`Factory` and `CBX`) using the latest Thirdweb SDK (v5). The focus is on a React frontend that uses Thirdweb's email-based Smart Wallets.

**Audience:** Aadit Nagpal (Technical Co-founder)

**Key SDK Version:** `@thirdweb-dev/react@5` and `@thirdweb-dev/sdk@4` (for utilities).

---

### **Part 1: Initial Project Setup**

First, ensure your React project is set up with the necessary Thirdweb packages and provider.

1.  **Installation:**
    ```bash
    npm install @thirdweb-dev/react @thirdweb-dev/sdk ethers
    ```

2.  **Set up the Thirdweb Provider:**
    In your main app file (e.g., `src/main.jsx` or `src/App.jsx`), wrap your application with `ThirdwebProvider`.

    ```jsx
    // src/main.jsx
    import React from 'react';
    import ReactDOM from 'react-dom/client';
    import { ThirdwebProvider } from '@thirdweb-dev/react';
    import App from './App';

    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <ThirdwebProvider>
          <App />
        </ThirdwebProvider>
      </React.StrictMode>
    );
    ```

### **Part 2: Connecting the User (Smart Wallet)**

Thirdweb's UI components make this incredibly simple. The `ConnectButton` will handle the entire flow: showing the modal, letting the user enter their email, sending a confirmation, and creating/connecting their Smart Wallet.

*   **Client ID:** You need a `clientId` from your Thirdweb dashboard. Store this in your environment variables (e.g., `.env.local`).
*   **Chain Definition:** You must define the chain you are working on (Polygon).

```jsx
// Example: A Header component
import { ConnectButton, useActiveAccount } from "@thirdweb-dev/react";
import { createThirdwebClient } from "thirdweb";
import { polygon } from "thirdweb/chains";

// 1. Create the Thirdweb Client
const client = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID, // Your client ID from the dashboard
});

// 2. Define the wallets you want to support (here, just Smart Wallet via email)
import { smartWallet, embeddedWallet } from "thirdweb/wallets";

const smartWalletConfig = {
  factoryAddress: "YOUR_SMART_WALLET_FACTORY_ADDRESS", // Get this from your Thirdweb dashboard
  gasless: true, // Highly recommended for good UX
};

export const Header = () => {
  const account = useActiveAccount();

  return (
    <div>
      <ConnectButton
        client={client}
        chain={polygon}
        wallets={[
          smartWallet(embeddedWallet(), smartWalletConfig),
        ]}
        connectModal={{
          size: "compact",
          title: "Login to CBX.Earth",
        }}
      />
      {account && <p>Connected: {account.address}</p>}
    </div>
  );
};
```

### **Part 3: Reading Data from Contracts (`view` functions)**

To populate the UI, you'll constantly need to fetch data. The `useReadContract` hook is the primary tool for this.

**Concept:** This hook handles fetching data, caching it, and re-fetching when necessary. It provides `data` and `isLoading` states.

**Example: Building a Buyer Portal Project Card**

Let's fetch the data for a single project card using the `getPoolSummary` function you created.

```jsx
import { useReadContract, useActiveAccount } from "@thirdweb-dev/react";
import { getContract } from "thirdweb";
import { polygon } from "thirdweb/chains";

// Assume 'client' is created as shown in Part 2

const POOL_ADDRESS = "0x..."; // The address of the specific CBX pool
const CBX_ABI = [...]; // The ABI of your CBX.sol contract

const ProjectCard = () => {
  const account = useActiveAccount();
  const userAddress = account?.address || "0x0000000000000000000000000000000000000000";

  // 1. Get the contract instance
  const contract = getContract({
    client,
    chain: polygon,
    address: POOL_ADDRESS,
    abi: CBX_ABI,
  });

  // 2. Use the useReadContract hook
  const { data: poolSummary, isLoading } = useReadContract({
    contract: contract,
    method: "function getPoolSummary(address _user) view returns ((string name, ...))",
    params: [userAddress], // Arguments for the smart contract function
  });

  if (isLoading) {
    return <div>Loading project details...</div>;
  }

  if (!poolSummary) {
    return <div>Could not fetch project data.</div>;
  }

  // 3. Render the data
  // Note: All BigNumber values from the hook need to be formatted for display
  const pricePerCredit = Number(poolSummary.pricePerTokenWithFee) * 100 / 1e6;
  const userBalanceTonnes = Number(poolSummary.userBalance) / 100;

  return (
    <div>
      <h2>{poolSummary.name}</h2>
      <p>Price per Credit: ${pricePerCredit.toFixed(2)} USDC</p>
      <p>Your Balance: {userBalanceTonnes} Tonnes</p>
      {/* ... other data ... */}
    </div>
  );
};
```

---

### **Part 4: Writing Data to Contracts (Executing Transactions)**

For actions like buying, retiring, or withdrawing, you need to send a transaction. The `useSendTransaction` hook is the tool for this.

**Concept:** The modern pattern is a two-step process:
1.  **Prepare the transaction:** Define which function to call and with what arguments.
2.  **Send the transaction:** The hook gives you a `mutate` function that, when called, triggers the wallet confirmation flow.

#### **Example 1: Simple Transaction (No Arguments)**

Let's implement the "Withdraw Profits" button for the Seller Portal.

```jsx
import { useSendTransaction } from "@thirdweb-dev/react";
import { prepareContractCall } from "thirdweb";

// Assume 'contract' is already defined as in the previous example

const WithdrawButton = ({ poolContract }) => {
  // 1. Use the useSendTransaction hook
  const { mutate: sendTx, isPending } = useSendTransaction();

  const handleWithdraw = () => {
    // 2. Prepare the transaction
    const transaction = prepareContractCall({
      contract: poolContract,
      method: "function withDrawUSDCProfits()",
      params: [], // No arguments needed for this function
    });
    
    // 3. Send the transaction
    sendTx(transaction, {
      onSuccess: () => {
        alert("Profits Withdrawn Successfully!");
        // You would typically re-fetch data here
      },
      onError: (error) => {
        console.error("Withdrawal failed", error);
        alert("Withdrawal Failed!");
      },
    });
  };

  return (
    <button onClick={handleWithdraw} disabled={isPending}>
      {isPending ? "Withdrawing..." : "Withdraw Profits"}
    </button>
  );
};
```

#### **Example 2: Transaction with Arguments and `payable` Value**

This is the most complex case. Let's implement the **"Buy & Retire"** button from the Buyer Portal.

```jsx
import { useSendTransaction } from "@thirdweb-dev/react";
import { prepareContractCall } from "thirdweb";
import { ethers } from "ethers"; // For converting ETH/MATIC to Wei

// Assume 'poolContract' is defined and we have the user's input
// const amountToRetireInTonnes = 5.5; 
// const RETIREMENT_FEE_IN_MATIC = "0.05"; // This should be fetched from the contract

const BuyAndRetireButton = ({ poolContract, amountInTonnes, retirementFee }) => {
  const { mutate: sendTx, isPending } = useSendTransaction();

  const handleBuyAndRetire = () => {
    // 1. Convert frontend inputs to smart contract format
    const amountOfCBXOut = amountInTonnes * 100;
    const feeInWei = ethers.utils.parseEther(retirementFee); // e.g., "0.05" -> 50000000000000000n

    // 2. Prepare the transaction with params and a payable value
    const transaction = prepareContractCall({
      contract: poolContract,
      method: "function buyAndRetireTokensWithUSDC(uint256 amountOfCBXOut)",
      params: [amountOfCBXOut],
      value: feeInWei, // The 'value' key is for sending ETH/MATIC
    });

    // 3. Send the transaction
    sendTx(transaction, {
      onSuccess: () => alert("Purchase & Retirement Successful!"),
      onError: (error) => alert(`Error: ${error.message}`),
    });
  };

  return (
    <button onClick={handleBuyAndRetire} disabled={isPending}>
      {isPending ? "Processing..." : "Buy & Retire"}
    </button>
  );
};
```

This guide covers the core workflows your developer will need. The key is to embrace the hook-based, modular nature of the latest Thirdweb SDK.
