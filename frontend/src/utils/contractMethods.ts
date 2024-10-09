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
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createSignerFromKeypair,
  generateSigner,
  percentAmount,
  signerIdentity,
} from "@metaplex-foundation/umi";
import toast from "react-hot-toast";
import {
  createAndMint,
  mplTokenMetadata,
  TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";

export const executePlayGame = async (user: SolanaUser) => {
  const connection = new Connection(process.env.NEXT_PUBLIC_HELIUS_RPC!);
  console.log(connection);

  const FROM_KEYPAIR = Keypair.fromSecretKey(
    Uint8Array.from(Buffer.from(user?.privateKey || "", "hex"))
  );

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

export const handleClaimTokens = async (
  user: SolanaUser,
  reFetchBalance: (user: SolanaUser) => Promise<void>,
  amount: number = 100
) => {
  const connection = new Connection(process.env.NEXT_PUBLIC_HELIUS_RPC!);

  const tokenAccounts = await connection.getTokenAccountsByOwner(
    new PublicKey(user?.address || ""),
    {
      programId: TOKEN_PROGRAM_ID,
    }
  );

  let allZeroBalance = true;

  for (const tokenAccount of tokenAccounts.value) {
    const accountInfo = await connection.getTokenAccountBalance(
      tokenAccount.pubkey
    );
    const balance = parseFloat(accountInfo.value.amount);
    console.log(balance);
    // If any account has a non-zero balance, stop checking further
    if (balance > 0) {
      allZeroBalance = false;
      break;
    }
  }

  if (allZeroBalance) {
    const toastId = toast.loading("Minting...");
    try {
      const umi = createUmi(process.env.NEXT_PUBLIC_HELIUS_RPC!);

      const userWallet = umi.eddsa.createKeypairFromSecretKey(
        Uint8Array.from(Buffer.from(user?.privateKey || "", "hex"))
      );

      const userWalletSigner = createSignerFromKeypair(umi, userWallet);

      const metadata = {
        name: "BOOK OF KNOWLEDGE",
        symbol: "BOKW",
        uri: "https://chocolate-impressive-horse-144.mypinata.cloud/ipfs/QmYPcWZnKp2kPEBQZ6gqZN1k651GrDa4DCPEwMz4fxe6uQ",
      };

      const mint = generateSigner(umi);
      umi.use(signerIdentity(userWalletSigner));
      umi.use(mplTokenMetadata());

      await createAndMint(umi, {
        mint,
        authority: umi.identity,
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadata.uri,
        sellerFeeBasisPoints: percentAmount(0),
        decimals: 8,
        amount: amount * Math.pow(10, 8),
        tokenOwner: userWallet.publicKey,
        tokenStandard: TokenStandard.Fungible,
      })
        .sendAndConfirm(umi)
        .then(() => {
          console.log(
            "Successfully minted 1 million tokens (",
            mint.publicKey,
            ")"
          );
          toast.dismiss(toastId);
          toast.success("Minted initial tokens", { duration: 4000 });
          reFetchBalance(user);
        })
        .catch((err: any) => {
          console.error("Error minting tokens:", err);
          toast.dismiss(toastId);
          toast.error("Failed to mint initial tokens", { duration: 4000 });
        });
      await reFetchBalance(user);
    } catch (err) {
      console.error("Error during minting process:", err);
      toast.dismiss(toastId);
      toast.error("Failed to mint initial tokens", { duration: 4000 });
    }
  } else {
    toast.error("Already have token!", { duration: 4000 });
    await reFetchBalance(user);
  }
};

export const handleClaimReward = async (
  user: SolanaUser,
  reFetchBalance: (user: SolanaUser) => Promise<void>,
  amount: number = 100
) => {
  const connection = new Connection(process.env.NEXT_PUBLIC_HELIUS_RPC!);

  const tokenAccounts = await connection.getTokenAccountsByOwner(
    new PublicKey(user?.address || ""),
    {
      programId: TOKEN_PROGRAM_ID,
    }
  );
  const toastId = toast.loading("Minting...");
  try {
    const umi = createUmi(process.env.NEXT_PUBLIC_HELIUS_RPC!);

    const userWallet = umi.eddsa.createKeypairFromSecretKey(
      Uint8Array.from(Buffer.from(user?.privateKey || "", "hex"))
    );

    const userWalletSigner = createSignerFromKeypair(umi, userWallet);

    const metadata = {
      name: "BOOK OF KNOWLEDGE",
      symbol: "BOKW",
      uri: "https://chocolate-impressive-horse-144.mypinata.cloud/ipfs/QmYPcWZnKp2kPEBQZ6gqZN1k651GrDa4DCPEwMz4fxe6uQ",
    };

    const mint = generateSigner(umi);
    umi.use(signerIdentity(userWalletSigner));
    umi.use(mplTokenMetadata());

    await createAndMint(umi, {
      mint,
      authority: umi.identity,
      name: metadata.name,
      symbol: metadata.symbol,
      uri: metadata.uri,
      sellerFeeBasisPoints: percentAmount(0),
      decimals: 8,
      amount: amount * Math.pow(10, 8),
      tokenOwner: userWallet.publicKey,
      tokenStandard: TokenStandard.Fungible,
    })
      .sendAndConfirm(umi)
      .then(() => {
        console.log(
          "Successfully minted 1 million tokens (",
          mint.publicKey,
          ")"
        );
        toast.dismiss(toastId);
        toast.success("Minted initial tokens", { duration: 4000 });
        reFetchBalance(user);
      })
      .catch((err: any) => {
        console.error("Error minting tokens:", err);
        toast.dismiss(toastId);
        toast.error("Failed to mint initial tokens", { duration: 4000 });
      });
    await reFetchBalance(user);
  } catch (err) {
    console.error("Error during minting process:", err);
    toast.dismiss(toastId);
    toast.error("Failed to mint initial tokens", { duration: 4000 });
  }
};
