import { formatUnits, parseUnits, PublicClient, WalletClient } from "viem";
import { FUNCTION_NAME } from "@/utils/constant";
import { useContext, useEffect, useState } from "react";
import { getBalanceOf } from "@/utils/contractMethods";
import { Web3AuthContext } from "@/providers/AuthProvider";
import { Web3AuthContextType } from "@/types/user";
import { Connection, PublicKey } from "@solana/web3.js";

import { TOKEN_PROGRAM_ID, AccountLayout } from "@solana/spl-token";

export const useBalances = () => {
  const { user } = useContext(Web3AuthContext) as Web3AuthContextType;

  const [bokwBalance, setBokwBalance] = useState(0);
  const [solBalance, setSolBalance] = useState(0);

  useEffect(() => {
    if (!user) return;
    const loadBalance = async () => {
      const bal = await fetchSolBalance(user);

      setSolBalance(Number(bal));
      reFetchBalance(user);
    };
    loadBalance();
  }, [user]);

  const fetchSolBalance = async (user: any) => {
    let connection = new Connection(process.env.NEXT_PUBLIC_HELIUS_RPC!);

    const publicKey = new PublicKey(user.address);
    const balance = await connection.getBalance(publicKey);
    const solBalance = balance / 1e9;

    setSolBalance(Number(solBalance));
    return solBalance;
  };

  const reFetchBalance = async (user: any) => {
    let connection = new Connection(process.env.NEXT_PUBLIC_HELIUS_RPC!);

    const tokenAccounts = await connection.getTokenAccountsByOwner(
      new PublicKey(user.address),
      {
        programId: TOKEN_PROGRAM_ID,
      }
    );

    if (tokenAccounts.value.length === 0) {
      console.log("No token accounts found for this wallet.");
      return;
    }

    for (const tokenAccount of tokenAccounts.value) {
      const accountInfo = tokenAccount.account.data;
      const accountData = AccountLayout.decode(accountInfo);
      const balance = accountData.amount.toString();

      if (Number(balance) > 0) {
        setBokwBalance(Number(balance) / 1e8);
        break;
      }
    }
  };

  return {
    bokwBalance,
    reFetchBalance,
    fetchSolBalance,
    solBalance,
  };
};
