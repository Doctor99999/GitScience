import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Deploys the GitScienceT on-chain layer:
 *   1. AmanatSplitter (55/15/30 bps revenue split + B2B Gross-Up)
 *   2. SovereignIPNFT (ERC-721 + EIP-2981, routes 30% royalties to AmanatSplitter)
 *
 * Required env (see .env.example):
 *   PRIVATE_KEY          deployer key (no 0x prefix required)
 *   RPC_URL              JSON-RPC endpoint of the target network
 *   INFRASTRUCTURE_POOL  recipient wallet for the 15% infrastructure pool
 * Optional:
 *   FOUNDER_WALLET      defaults to the canonical protocol founder
 *   ETHERSCAN_API_KEY   enables `hardhat verify` post-deploy
 */
async function main(): Promise<void> {
  const founder: string =
    process.env.FOUNDER_WALLET || "0x71C2B09934D3E08A52e52d7da7DAbFAc484EFE37";
  const infraPool: string | undefined = process.env.INFRASTRUCTURE_POOL;

  if (!infraPool || !infraPool.startsWith("0x")) {
    throw new Error("Set INFRASTRUCTURE_POOL (0x...) in .env before deploying");
  }

  const [deployer] = await ethers.getSigners();
  console.log("Deployer :", deployer.address);
  console.log("Founder  :", founder);
  console.log("InfraPool:", infraPool);

  const Splitter = await ethers.getContractFactory("AmanatSplitter");
  const splitter = await Splitter.deploy(founder, infraPool);
  await splitter.waitForDeployment();
  const splitterAddr = await splitter.getAddress();
  console.log("AmanatSplitter deployed ->", splitterAddr);

  const NFT = await ethers.getContractFactory("SovereignIPNFT");
  const nft = await NFT.deploy(founder, splitterAddr);
  await nft.waitForDeployment();
  const nftAddr = await nft.getAddress();
  console.log("SovereignIPNFT deployed  ->", nftAddr);

  console.log("\n--- Wire these into backend/PROTOCOL_CONSTANTS.json ---");
  console.log(`"amanat_splitter_address": "${splitterAddr}"`);
  console.log(`"sovereign_ipnft_address": "${nftAddr}"`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
