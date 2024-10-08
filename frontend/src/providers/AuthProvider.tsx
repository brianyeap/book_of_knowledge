import { Web3AuthContextType } from "@/types/user";
import { AuthAdapter, AuthUserInfo as BaseAuthUserInfo } from "@web3auth/auth-adapter";

interface AuthUserInfo extends BaseAuthUserInfo {
  privateKey?: string;
}
import {
  CHAIN_NAMESPACES,
  CustomChainConfig,
  IProvider,
  UX_MODE,
  WALLET_ADAPTERS,
  WEB3AUTH_NETWORK,
} from "@web3auth/base";
import { SolanaPrivateKeyProvider } from "@web3auth/solana-provider";
import { Web3AuthNoModal } from "@web3auth/no-modal";
import { createContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import RPC from "@/utils/solanaRPC";
import { Connection } from "@solana/web3.js";
import { SolanaWallet } from "@web3auth/solana-provider";

export const Web3AuthContext = createContext<Web3AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [web3Auth, setWeb3Auth] = useState<Web3AuthNoModal | null>(null);
  const [web3AuthProvider, setWeb3AuthProvider] = useState<IProvider | null>(
    null
  );
  const [solanaWallet, setSolanaWallet] = useState<SolanaWallet | null>(null);
  const [solanaConnection, setSolanaConnection] = useState<Connection | undefined>(undefined);
  const [user, setUser] = useState<Partial<AuthUserInfo & { address: `0x${string}`; privateKey?: string }>>();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const chainConfig = {
          chainId: "0x3",
          displayName: "Solana Devnet",
          chainNamespace: CHAIN_NAMESPACES.SOLANA,
          tickerName: "Solana Token",
          ticker: "SOL",
          rpcTarget:
            "https://devnet.helius-rpc.com/?api-key=01ddcff5-a5eb-4dc8-8b6a-dc3046079a92",
          blockExplorerUrl: "https://explorer.solana.com",
          logo: "https://images.toruswallet.io/sol.svg",
        };

        const privateKeyProvider = new SolanaPrivateKeyProvider({
          config: { chainConfig },
        });

        const web3AuthInstance = new Web3AuthNoModal({
          clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || "",
          web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
          privateKeyProvider,
        });

        const web3AuthAdapter = new AuthAdapter({
          adapterSettings: {
            uxMode: UX_MODE.REDIRECT,
            loginConfig: {
              jwt: {
                verifier: "boke-solana-auth0",
                typeOfLogin: "jwt",
                clientId: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID,
              },
            },
          },
        });
        web3AuthInstance.configureAdapter(web3AuthAdapter);
        setWeb3Auth(web3AuthInstance);

        await web3AuthInstance.init();
        setWeb3AuthProvider(web3AuthInstance.provider);
      } catch (error) {
        console.error("web3auth init failed", error);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (web3Auth && web3AuthProvider) {
      if (web3Auth.connected && !isLoggedIn) postLoginFlow(web3AuthProvider);
      setTimeout(() => {
        // small timeout to wait for set state to finish before setIsLoading to false
        setIsLoading(false);
      }, 300);
    }
  }, [web3Auth, web3AuthProvider, isLoggedIn]);

  const login = async () => {
    if (web3Auth) {
      const web3AuthProvider = await web3Auth.connectTo(WALLET_ADAPTERS.AUTH, {
        loginProvider: "jwt",
        extraLoginOptions: {
          domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN,
          verifierIdField: "sub",
          connection: "worldcoin",
        },
      });
      setWeb3AuthProvider(web3AuthProvider);
      postLoginFlow(web3AuthProvider);
    } else {
      toast.error("Web3Auth not initialized yet!");
      throw new Error("Web3Auth not initialized yet!");
    }
  };

  const authenticateUser = async () => {
    if (web3Auth) {
      const idToken = await web3Auth.authenticateUser();
      console.debug("User successfully verified!", idToken);
      return idToken;
    } else {
      toast.error("Web3Auth not initialized yet!");
      return;
    }
  };

  const getUserInfo = async () => {
    if (web3Auth) {
      const user = await web3Auth.getUserInfo();
      console.debug("Get user successful!", user);
      return user;
    } else {
      console.debug("Web3Auth not initialized yet!");
      return;
    }
  };

  const postLoginFlow = async (provider: IProvider | null) => {
    if (!web3Auth?.connected || !provider) {
      toast.error("Login failed!");
      return;
    }
    const user = await getUserInfo();
    const address = await RPC.getAccounts(provider);
    const privateKey = await RPC.getPrivateKey(provider);
    setUser({ ...user, address, privateKey });
    const solanaWalletInstance = new SolanaWallet(provider);
    setSolanaWallet(solanaWalletInstance);
    const connectionConfig = await solanaWalletInstance.request<
      string[],
      CustomChainConfig
    >({
      method: "solana_provider_config",
      params: [],
    });

    const connection = new Connection(connectionConfig.rpcTarget);
    setSolanaConnection(connection);
  };

  const logout = async () => {
    if (web3Auth) {
      await web3Auth.logout();
      setIsLoggedIn(false);
      setWeb3AuthProvider(null);
      setUser(undefined);
    } else {
      toast.error("Web3Auth not initialized yet!");
      return;
    }
  };

  return (
    <Web3AuthContext.Provider
      value={{
        isLoading,
        user,
        login,
        logout,
        authenticateUser,
        solanaWallet,
        solanaConnection,
      }}
    >
      {children}
    </Web3AuthContext.Provider>
  );
};
