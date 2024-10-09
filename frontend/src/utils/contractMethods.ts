import {
  formatUnits,
  getContract,
  GetContractReturnType,
  PublicClient,
  WalletClient,
} from "viem";
import { BOKWGeoABI } from "@/abis/BOKWGeoABI";
import { FUNCTION_NAME } from "./constant";
import { mantaSepoliaTestnet } from "viem/chains";
import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { SolanaUser } from "@/types/user";
import {
  burn,
  createTransferInstruction,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createSignerFromKeypair } from "@metaplex-foundation/umi";

export const executePlayGame = async (user: SolanaUser) => {
  let connection = new Connection(process.env.NEXT_PUBLIC_HELIUS_RPC!);
  console.log(connection);

  const FROM_KEYPAIR = Keypair.fromSecretKey(
    Uint8Array.from(Buffer.from(user?.privateKey || "", "hex"))
  );

  console.log(FROM_KEYPAIR);

  const userTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    FROM_KEYPAIR,
    new PublicKey(process.env.NEXT_PUBLIC_BOKW_MINT_ADDRESS!),
    FROM_KEYPAIR.publicKey
  );

  const signature = await burn(
    connection,
    FROM_KEYPAIR,
    userTokenAccount.address,
    new PublicKey(process.env.NEXT_PUBLIC_BOKW_MINT_ADDRESS!),
    FROM_KEYPAIR,
    50 * Math.pow(10, 8)
  );
  console.log("Transaction signature:", signature);

  await connection.confirmTransaction(signature);
  console.log("Play game initialization finished");
};

export const generateQuestion = async (
  ca: `0x${string}`,
  walletClient: WalletClient,
  publicClient: PublicClient,
  gameIdx: number,
  prompt: string
) => {
  const address = (await walletClient.getAddresses())[0];
  const fee = await estimateFee(ca, walletClient, publicClient);
  console.log("Estimated Fee", fee);

  const hash = await walletClient.writeContract({
    chain: mantaSepoliaTestnet,
    account: address,
    address: ca as `0x${string}`,
    abi: BOKWGeoABI,
    functionName: "generateQuestion",
    args: [BigInt(gameIdx), prompt],
    value: BigInt(fee),
  });
  console.log("GenerateQuestion hash", hash);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log("GenerateQuestion receipt", receipt);

  return hash;
};

const estimateFee = async (
  ca: `0x${string}`,
  walletClient: WalletClient,
  publicClient: PublicClient
) => {
  const address = (await walletClient.getAddresses())[0];
  const fee = await publicClient.readContract({
    address: ca,
    abi: BOKWGeoABI,
    functionName: "estimateFee",
    args: [BigInt(11)],
  });
  return String(fee);
};

export const getBalanceOf = async (
  ca: `0x${string}`,
  walletClient: WalletClient,
  publicClient: PublicClient
) => {
  const address = (await walletClient.getAddresses())[0];
  const balance = await publicClient.readContract({
    address: ca,
    abi: BOKWGeoABI,
    functionName: "balanceOf",
    args: [address],
  });
  return Number(formatUnits(balance, 18));
};

export const initialMint = async (
  ca: `0x${string}`,
  walletClient: WalletClient,
  publicClient: PublicClient
) => {
  const address = (await walletClient.getAddresses())[0];
  const hash = await walletClient.writeContract({
    chain: mantaSepoliaTestnet,
    account: address,
    address: ca as `0x${string}`,
    abi: BOKWGeoABI,
    functionName: "initialMint",
  });
  console.log("initialMint hash", hash);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log("initialMint Receipt", receipt);

  return hash;
};
