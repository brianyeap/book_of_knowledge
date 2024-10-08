import { AuthUserInfo } from "@web3auth/auth-adapter";
import { PublicClient, WalletClient } from "viem";
import { BOKWGeoABI } from "@/abis/BOKWGeoABI";
import { Connection } from "@solana/web3.js";

export type Web3AuthContextType = {
  isLoading: boolean;
  user: Partial<AuthUserInfo & { address: `0x${string}`, privateKey: string }> | undefined;
  solanaConnection?: Connection;
  solanaWallet?: SolanaWallet;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  authenticateUser: () => Promise<UserAuthInfo | undefined>; // get token ID
};

// export type User = {};
