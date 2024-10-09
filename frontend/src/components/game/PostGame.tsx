import { motion } from "framer-motion";
import Card from "../Card";
import { useRouter, useSearchParams } from "next/navigation";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";
import {
  faMap,
  faNotesMedical,
  faCity,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import LeaderboardAnimation from "./LeaderboardAnimation";
import Image from "next/image";
import pepe from "@/../public/assets/pepe.png";
import { useState, useEffect, useContext } from "react";
import toast from "react-hot-toast";
import { Web3AuthContext } from "@/providers/AuthProvider";
import { Web3AuthContextType } from "@/types/user";
import { handleClaimReward, handleClaimTokens } from "@/utils/contractMethods";
import { useBalances } from "@/hooks/useBalances";

const AnimatedNumber = ({ num }: { num: number }) => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
    const timer = setTimeout(() => setAnimate(false), 300);
    return () => clearTimeout(timer);
  }, [num]);

  return (
    <motion.div
      initial={{ scale: 1, color: "#000000" }}
      animate={
        num >= 50
          ? {
              scale: [1, 1.2, 1.2, 1],
              color: ["#000000", "#00ff00", "#00ff00", "#000000"],
            }
          : {
              scale: [1, 1.2, 1.2, 1],
              color: ["#000000", "#DC2626", "#DC2626", "#000000"],
            }
      }
      transition={
        num >= 50
          ? {
              duration: 0.5,
              times: [0, 0.33, 0.66, 1],
              delay: 3,
            }
          : {
              duration: 0.5,
              times: [0, 0.33, 0.66, 1],
              delay: 2,
            }
      }
    >
      <p className="font-chewy text-3xl">{num}</p>
    </motion.div>
  );
};

const contractAddresses: { [key: string]: string } = {
  ethereum: process.env.NEXT_PUBLIC_BOKWETH_CA as string,
  city_planning: process.env.NEXT_PUBLIC_BOKWCP_CA as string,
  epidemiology: process.env.NEXT_PUBLIC_BOKWEPI_CA as string,
};

const PostGame = ({
  coinsEarned,
  outerCurrentGameIndex,
}: {
  coinsEarned: number;
  outerCurrentGameIndex: number | undefined;
}) => {
  const subject = useSearchParams().get("subject");
  const router = useRouter();
  const { user } = useContext(Web3AuthContext) as Web3AuthContextType;
  const { reFetchBalance } = useBalances();

  useEffect(() => {
    const claimReward = async () => {
      const toastId = toast.loading("Claiming reward...");
      try {
        await handleClaimReward(user, reFetchBalance, coinsEarned);
        toast.dismiss(toastId);
        toast.success("Reward claimed", { duration: 4000 });
      } catch (e) {
        toast.error("Failed to claimed reward", { duration: 4000 });
      }
    };
    if (!user) return;
    claimReward();
  }, [user]);

  return (
    <motion.div
      key="post-game"
      className="w-full h-full flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Image
        className="relative z-10"
        style={{ width: `${240}px`, height: `${240}px` }}
        src={pepe}
        alt="pepe-with-book"
      />
      <Card className="w-[560px] max-w-[90%] py-4 px-4 sm:px-8 md:px-12 bg-saffron flex flex-col items-center space-y-5 -mt-[15px]">
        <p className="font-chewy text-black text-2xl sm:text-3xl md:text-4xl">
          Book of Knowledge
        </p>
        <div className="flex items-center justify-center space-x-2 text-black">
          <p className="text-black pt-1 text-xl">You got </p>
          <AnimatedNumber num={coinsEarned} />
          {subject === "geography" && (
            <FontAwesomeIcon icon={faMap} size="2x" />
          )}
          {subject === "epidemiology" && (
            <FontAwesomeIcon icon={faNotesMedical} size="2x" />
          )}
          {subject === "ethereum" && (
            <FontAwesomeIcon icon={faEthereum} size="2x" />
          )}
          {subject === "city-planning" && (
            <FontAwesomeIcon icon={faCity} size="2x" />
          )}
        </div>
        <LeaderboardAnimation win={coinsEarned >= 50} />
        <Card
          className="w-fit mt-5 py-2 px-4 cursor-pointer bg-mnGreen"
          onClick={() => router.replace("/")}
        >
          <p className="font-chewy text-2xl sm:text-3xl md:text-4xl text-white text-center">
            Back to Home
          </p>
        </Card>
      </Card>
    </motion.div>
  );
};

export default PostGame;
