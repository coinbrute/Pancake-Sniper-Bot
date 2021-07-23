/* IMPORTS */
const ethers = require('ethers');
const { ChainId, Token, TokenAmount, Fetcher, Pair, Route, Trade, TradeType, Percent } = require('@pancakeswap-libs/sdk');
const Web3 = require('web3');
const conn = require('pancake_connect');
const { JsonRpcProvider } = require('@ethersproject/providers');
require("dotenv").config();

/* CONSTANTS */
const INPUT_TOKEN_ADDRESS = process.env.TESTNET_WBNB // Address of token for buying with i.e. busd
const OUTPUT_TOKEN_ADDRESS = process.env.TESTNET_WBNB // Address of token for outputing snipes with i.e. WBNB  <-- BUSD 
const AMOUNT_USED_TO_BUY = ".3" // Amount of input token to buy with
const SLIPPAGE_AMT = "25" // Slippage for snipe in percent start high for new listing snipes
const PANCAKE_ROUTER = process.env.TESTNET_ROUTER // MAINNET Pancakeswap Router address
const PANCAKE_FACTORY = process.env.TESTNET_FACTORY // MAINNET Pancakeswap Factory address
const PRIVATE_KEY = process.env.MAINNET_PRIVATE_KEY

/* CONFIGS */
const PROVIDER = new JsonRpcProvider(process.env.TESTNET_RPC); // BSC MAINNET RPC URL
const web3 = new Web3(process.env.GETBLOCK_WS_TESTNET); // GETBLOCK API WSS FEED CURRENT RATE LIMIT 40k/24hr period
const { address: admin } = web3.eth.accounts.wallet.add(PRIVATE_KEY); // Create admin object to register wallet account
console.log(`---------- Configuration Complete ----------`)

/* SETUP CONSTANTS */
const inputTokenWeb3 = web3.utils.toChecksumAddress(INPUT_TOKEN_ADDRESS);
const outputTokenWeb3 = web3.utils.toChecksumAddress(OUTPUT_TOKEN_ADDRESS);
const amtToBuy = AMOUNT_USED_TO_BUY;
const slippage = SLIPPAGE_AMT;
const pancakeRouter = PANCAKE_ROUTER;
const pvt_key = PRIVATE_KEY;
const tx_signer = conn.wallet(pvt_key, PROVIDER);
const factory = new ethers.Contract(PANCAKE_FACTORY, ['event PairCreated(address indexed token0, address indexed token1, address pair, uint)'], tx_signer);


/* Variables */
let found_and_bought = 0;
factory.on('PairCreated', async(token0, token1) => {
    switch(found_and_bought) {
        case 0:
            console.log(`-------------------------------------------------------`);
            console.log(`
            New LP-Pair Found - Scanning for addresses
            ==========================================
            Token 1 : ${token0}
            Token 2 : ${token1}
            `);
            let input, output;
            if(token0 == outputTokenWeb3 && token1 == inputTokenWeb3) {
                console.log(`Only input token matches token expected`)
                input = token1;
                output = token0;
                found_and_bought = 1;
            } else if(token1 == outputTokenWeb3 && token0 == inputTokenWeb3) {
                console.log(`Only output token matches token expected`)
                input = token0;
                output = token1;
                found_and_bought = 1;
            } else if(input === undefined) {
                console.log(`Neither token matches expected addresses`)
                console.log(`-------------------------------------------------------`);
                return;
            }
            await swap(input, output);
            break;
        case 1:
            await swap(inputTokenWeb3, outputTokenWeb3);
            break;
        case 2:
            console.log(`---------- Token Purchased ----------`);
            process.exit(1); // ADD IN FEATURE TO CHECK WALLET AND ADJUST FOR MINIMUM BALANCE
    }
});

const swap = async(input, output) => {
    const [INPUT, OUTPUT] = await Promise.all([input, output].map(address => {new Token(ChainId.BSCTESTNET,address,18)}));
    const ONE_ETH_IN_WEI = web3.utils.toBN(web3.utils.toWei('1')); // converts ether values to wei i.e. easy to understand values 
    const tradeAmt = ONE_ETH_IN_WEI.div(web3.utils.toBN('100')); // one_eth_in_wei / 1000
    const pair = await Fetcher.fetchPairData(INPUT, OUTPUT, PROVIDER);
    const router = await new Route([pair], INPUT);
    const trade = await new Trade(router, new TokenAmount(INPUT, tradeAmt), TradeType.EXACT_INPUT);
    const slip = new Percent(slippage, '100');
    const min = trade.minimumAmountOut(slip).raw;
    const path = [INPUT.address, OUTPUT.address];
    const to = admin;
    const deadline = Math.floor(Date.now()/1000)+60+20;
    console.log("Connecting to Pancakeswap.......")
    const ps = new ethers.Contract(pancakeRouter, ['function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'], tx_signer);
    console.log(`<<<<<---------- Connected to Pancakeswap ---------->>>>>`);
    console.log("Approving tx on Pancakeswap......");
    let abi = ["function approve(address _spender, uint256 _value) public returns (bool success)"];
    console.log(`...`);
    let contract = new ethers.Contract(INPUT.address, abi, tx_signer);
    console.log(`...`);
    let response = await contract.approve(pancakeRouter, ethers.utils.parseUnits('1000.0', 18), {gasLimit: 300000, gasPrice: 5e9});
    console.log(`...`);
    console.log(`<<<<<---------- Approved on Pancakeswap ---------->>>>>`);
    console.log(`Creating Transaction`);      
    let amtIn = ethers.utils.parseUnits(amtToBuy, 18);
    let minAmtOut = ethers.utils.parseUnits(web3.utils.fromWei(min.toString()), 18);
    const tx = await ps.swapExactTokensForTokens(amtIn,minAmtOut,path,to,deadline,{gasLimit: ethers.utils.hexlify(300000), gasPrice: ethers.utils.parseUnits("9","gwei")});
    console.log(`Tx-hash: ${tx.hash}`);
    const receipt = tx.wait();
    detected_and_bought = 2;
    console.log(`Tx was mined in block ${receipt.blockNumber}`);
    process.exit(1);
}

process.on('unhandledRejection', () => {console.log(`
----------------------------------------------------------------
    Rejected, review your BNB balance for fees and try again.
----------------------------------------------------------------
`)})