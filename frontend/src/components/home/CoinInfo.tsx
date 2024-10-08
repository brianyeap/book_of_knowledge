import { useAuth } from "@/hooks/hooks";
import Card from "../Card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCity,
  faMap,
  faNotesMedical,
} from "@fortawesome/free-solid-svg-icons";
import { useBalances } from "@/hooks/useBalances";
import { initialMint } from "@/utils/contractMethods";
import toast from "react-hot-toast";
import { use, useState } from "react";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";

import { Connection, PublicKey } from "@solana/web3.js";

import {
  percentAmount,
  generateSigner,
  signerIdentity,
  createSignerFromKeypair,
} from "@metaplex-foundation/umi";
import {
  TokenStandard,
  createAndMint,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import bs58 from "bs58";

import { TOKEN_PROGRAM_ID, AccountLayout } from "@solana/spl-token";

const CoinInfo = () => {
  const { user } = useAuth();

  const { ethBalance, bokwEthBalance, fetchEthBalance, reFetchBalance } =
    useBalances();

  const handleClaimTokens = async () => {
    let connection = new Connection(process.env.NEXT_PUBLIC_HELIUS_RPC!);

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

        createAndMint(umi, {
          mint,
          authority: umi.identity,
          name: metadata.name,
          symbol: metadata.symbol,
          uri: metadata.uri,
          sellerFeeBasisPoints: percentAmount(0),
          decimals: 8,
          amount: 100_00000000,
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

  const handleClaimGas = async () => {
    const toastId = toast.loading("Claiming...");

    const connection = new Connection(process.env.NEXT_PUBLIC_HELIUS_RPC || "");

    if (user?.address) {
      const signature = await connection.requestAirdrop(
        new PublicKey(user.address),
        1 * 1e9
      );
      toast.success("Request sent!", { duration: 4000 });
      await connection.confirmTransaction(signature);
      toast.dismiss(toastId);
      toast.success("Tx confirmed onChain!", { duration: 4000 });
      await fetchEthBalance(user);
      return;
    }
    toast.success("Claimed sol", { duration: 4000 });
    toast.error("Failed to claimed Ssl", { duration: 4000 });
    await fetchEthBalance(user);
  };

  return (
    <div className="absolute z-20 top-0 left-0 w-screen p-2 sm:p-4 md:p-5 flex flex-col justify-end items-end gap-4">
      <Card className="py-2 px-2 sm:px-4 md:px-6 flex w-fit space-x-3 sm:space-x-4 md:space-x-5 border-saffron bg-white">
        <div className="flex items-center justify-center space-x-2 text-mnGreen">
          <FontAwesomeIcon icon={faEthereum} />
          <p className="font-poppins">{bokwEthBalance}</p>
        </div>
        {user && (
          <>
            <div className="w-[1px] h-full bg-mnGreen" />
            <div
              onClick={() => {
                navigator.clipboard.writeText(user.address as string);
              }}
              className="hover:cursor-pointer"
            >
              <p className="text-mnGreen">
                {user.address?.slice(0, 5)}...{user.address?.slice(-3) || ""}
              </p>
            </div>
          </>
        )}
      </Card>
      <div className="flex gap-2">
        <button className="py-1 px-2 rounded-full border border-black text-xs text-black">
          {ethBalance.toFixed(3)} SOL
        </button>
        <button
          className="py-1 px-2 rounded-full border border-black text-xs text-black"
          onClick={() => handleClaimTokens()}
        >
          Claim tokens
        </button>
        <button
          className="py-1 px-2 rounded-full border border-black text-xs text-black"
          onClick={() => handleClaimGas()}
        >
          Claim sol
        </button>
      </div>
    </div>
  );
};

export default CoinInfo;
