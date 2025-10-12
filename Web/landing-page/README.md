# CBX.earth

**Voluntary Carbon Credit (VCC) custodial ledger with on chain fractional retirement.**

### What we do differently

- **Lower fees** - traditional brokers charge 20 to 40%
- **Fractional retirement** - retire less than one tonne of carbon at once.
- **Full transparency** - know exactly what credits you are buying, and their quality.
- **NFT receipts** - receive receipts from Verra in the form of NFTs.

### What is the voluntary carbon credit market?

- In short, the voluntary carbon credit market is a way for people to pay "carbon farmers" to **remove carbon from the atmosphere**.
- If a farmer removes 10 tonnes of carbon through a forest they planted, a **ratings agency** would issue them **10 credits**.
- They can then **sell those credits** to individuals wishing to offset their carbon footprint.
- The individuals **"retire" these credits** (remove from the market), and are issued with a **retirement receipt** from the same ratings agency.
- The **largest ratings agency is Verra** which accounts for about half of all voluntary carbon credits. Their clients include Disney, Shell and Gucci.
- **Not all carbon credits are equal** - they are specific to each project and some are better than others!

### Why is the VCC market broken?

- **Brokers charge astronomical (> 20%) fees**
- Most brokers do not send retirement receipts - **users have no proof of retirement**
- **Users are unable to tell a high quality credit from a bad one** - we've made a quick tool for this.
- Many brokers sell poor quality credits from poorly maintained carbon projects.

**It is clear that this is an emerging market suffering from inequality of information exploitation.**

### How does CBX.earth work?

- We buy high quality VCS Gold rated credits from Verra
- These form a pool
- We issue one CBX token per credit
- Users can **buy a CBX token** for the average price of credits in the pool with a small fee
- Users can **retire a CBX token** by sending to our Retirer.sol contract.
- Since we sell **fractional tokens**, our Retirer.sol has a matching algorithm to form integer CBX token amounts.
- This is gas intensive, so is **only possible on Etherlink L2** where gas is much cheaper.
- The CBX tokens are burnt, and a record of their original owners and amounts is sent off chain to us.
- We retire a matching number of Verra carbon credits from our pool.
- When we receive the **retirement receipt** from Verra, we send **NFTs** of it to the owners.
- In the NFT's metadata, the fractional amount of carbon offsets retired by its owner is recorded.
- We call this process "splitting the retirement receipt".

### Find out more
 - our official whitepaper is FractionalRetirment.pdf contained in this directory
 - try out our website and demo here: https://cbx.earth
