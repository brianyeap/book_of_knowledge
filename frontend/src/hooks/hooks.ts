import { Web3AuthContext } from "@/providers/AuthProvider";
import { Web3AuthContextType } from "@/types/user";
import { useContext } from "react";

export const useAuth = () => {
  const {
    isLoading,
    user,
    login,
    logout,
    authenticateUser,
    solanaWallet,
    solanaConnection,
  } = useContext(Web3AuthContext) as Web3AuthContextType;

  return {
    isLoading,
    user,
    login,
    logout,
    authenticateUser,
    solanaWallet,
    solanaConnection,
  };
};
