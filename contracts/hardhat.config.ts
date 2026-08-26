import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";

dotenv.config();

const PK = process.env.PRIVATE_KEY;
const accounts = PK && PK.length > 0 ? [PK] : [];

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    localhost: { url: "http://127.0.0.1:8545", accounts },
    sepolia: { url: process.env.RPC_URL || "", accounts, chainId: 11155111 },
    polygon: { url: process.env.RPC_URL || "", accounts, chainId: 137 },
    base: { url: process.env.RPC_URL || "", accounts, chainId: 8453 },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "placeholder",
  },
  verify: {
    etherscan: { apiKey: process.env.ETHERSCAN_API_KEY || "placeholder" },
  },
};

export default config;
