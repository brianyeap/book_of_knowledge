import { useAuth } from "@/hooks/hooks";
import { AnimatePresence, motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Card from "../Card";
import {
  faCity,
  faMap,
  faNotesMedical,
  faRightFromBracket,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { executePlayGame } from "@/utils/contractMethods";
import { getPlayGameResult } from "@/graphql/getPrompt";
import LoadingAnimation from "../LoadingAnimation";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";
import toast from "react-hot-toast";

const containerVariant = {
  hidden: {},
  visible: (custom: boolean) => ({
    transition: {
      staggerChildren: 0.2,
      delayChildren: custom ? 0 : 0.7,
    },
  }),
};

const childVariant = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
};

const Contents = () => {
  const { isLoading, user, login, logout, viemPublicClient, viemWalletClient } =
    useAuth();
  const router = useRouter();
  const [showSubject, setShowSubject] = useState(false);
  const [selectedModal, setSelectedModal] = useState("");
  const [letsGoLoading, setLetsGoLoading] = useState(false);

  const handleLogout = () => {
    setShowSubject(false);
    logout();
  };

  const handleLetsGo = async () => {
    setLetsGoLoading(true);
    // const contractAddresses: { [key: string]: string } = {
    //   ethereum: process.env.NEXT_PUBLIC_BOKWETH_CA as string,
    //   city_planning: process.env.NEXT_PUBLIC_BOKWCP_CA as string,
    //   epidemiology: process.env.NEXT_PUBLIC_BOKWEPI_CA as string,
    // };
    // toast.loading("Initializing game...", { duration: 4000 });
    // const hash = await executePlayGame(
    //   contractAddresses[selectedModal] as `0x${string}`,
    //   viemWalletClient!,
    //   viemPublicClient!
    // );
    router.push(`/game?subject=${selectedModal}`);
  };

  return (
    <div className="w-full flex flex-col">
      <AnimatePresence mode="wait">
        {!isLoading &&
          (user ? (
            <motion.div
              className="w-full flex space-x-3"
              key="play"
              initial="hidden"
              animate="visible"
              variants={containerVariant}
              custom={false}
            >
              <motion.div className="flex flex-1" variants={childVariant}>
                <Card
                  className="w-full py-2 sm:py-3 md:py-4 bg-mnGreen flex items-center justify-center cursor-pointer"
                  onClick={() => setShowSubject(true)}
                >
                  <p className="font-chewy text-2xl sm:text-3xl md:text-4xl text-white text-center">
                    play
                  </p>
                </Card>
              </motion.div>
              <motion.div
                className="h-[60px] sm:h-[72px] md:h-[84px] w-[60px] sm:w-[72px] md:w-[84px]"
                variants={childVariant}
              >
                <Card className="w-full h-full flex items-center justify-center text-mnGreen">
                  <FontAwesomeIcon icon={faUser} size="2x" />
                </Card>
              </motion.div>
              <motion.div
                className="h-[60px] sm:h-[72px] md:h-[84px] w-[60px] sm:w-[72px] md:w-[84px]"
                variants={childVariant}
              >
                <Card
                  className="w-full h-full flex items-center justify-center bg-jasper cursor-pointer"
                  onClick={handleLogout}
                >
                  <FontAwesomeIcon icon={faRightFromBracket} size="2x" />
                </Card>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              className="w-full"
              key="not-logged-in"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 10, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <Card
                className="w-full py-2 bg-mnGreen flex items-center justify-center cursor-pointer"
                onClick={login}
              >
                <p className="font-chewy text-[24px] sm:text-[32px] md:text-[40px] text-white text-center">
                  login
                </p>
              </Card>
            </motion.div>
          ))}
      </AnimatePresence>

      {showSubject && (
        <motion.div
          className="w-full flex flex-col items-center space-y-3 mt-8"
          initial="hidden"
          animate="visible"
          variants={containerVariant}
          custom={true}
        >
          <motion.div
            className="font-medium text-lg sm:text-xl md:text-[22px] text-black"
            variants={childVariant}
          >
            Pick a subject to play!
          </motion.div>
          <div className="w-full flex space-x-3">
            <motion.div
              className="flex flex-1 hover:cursor-pointer"
              variants={childVariant}
            >
              <Card
                className="bg-saffron w-full py-2"
                // onClick={() => setSelectedModal("geography")}
              >
                <p className="font-chewy text-2xl sm:text-3xl md:text-4xl text-black text-center">
                  Geography
                </p>
              </Card>
            </motion.div>
            <motion.div
              className="flex flex-1 hover:cursor-pointer"
              variants={childVariant}
            >
              <Card
                className="bg-saffron w-full py-2"
                onClick={() => setSelectedModal("epidemiology")}
              >
                <p className="font-chewy text-2xl sm:text-3xl md:text-4xl text-black text-center">
                  Epidemiology
                </p>
              </Card>
            </motion.div>
          </div>
          <div className="w-full flex space-x-3">
            <motion.div
              className="flex flex-1 hover:cursor-pointer"
              variants={childVariant}
            >
              <Card
                className="bg-saffron w-full py-2"
                onClick={() => setSelectedModal("ethereum")}
              >
                <p className="font-chewy text-2xl sm:text-3xl md:text-4xl text-black text-center">
                  Ethereum
                </p>
              </Card>
            </motion.div>
            <motion.div
              className="flex flex-1 hover:cursor-pointer"
              variants={childVariant}
            >
              <Card
                className="bg-saffron w-full py-2"
                onClick={() => setSelectedModal("city-planning")}
              >
                <p className="font-chewy text-2xl sm:text-3xl md:text-4xl text-black text-center">
                  City Planning
                </p>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      )}

      {selectedModal && (
        <motion.div
          className="absolute top-0 left-0 z-30 w-screen min:h-screen h-full flex items-center justify-center bg-black/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Card className="relative w-[400px] max-w-[90%] pt-5 pb-7 px-2 sm:px-3 md:px-4 flex flex-col items-center justify-center bg-saffron text-black">
            <p className="font-chewy text-2xl sm:text-3xl md:text-4xl text-center mb-5">
              {selectedModal}
            </p>
            <p className="font-bold text-lg">Cost</p>
            <div className="flex items-center jusitfy-center space-x-3">
              <p className="font-bold text-2xl text-center pt-1">50</p>
              {selectedModal === "geography" && (
                <FontAwesomeIcon icon={faMap} size="2x" />
              )}
              {selectedModal === "epidemiology" && (
                <FontAwesomeIcon icon={faNotesMedical} size="2x" />
              )}
              {selectedModal === "ethereum" && (
                <FontAwesomeIcon icon={faEthereum} size="2x" />
              )}
              {selectedModal === "city-planning" && (
                <FontAwesomeIcon icon={faCity} size="2x" />
              )}
            </div>
            <Card
              className="mt-5 h-[56px] sm:h-[60px] md:h-[64px] flex items-center px-4 cursor-pointer bg-mnGreen"
              onClick={() => {
                if (!letsGoLoading) handleLetsGo();
              }}
            >
              {letsGoLoading ? (
                <LoadingAnimation size="md" />
              ) : (
                <p className="font-chewy text-2xl sm:text-3xl md:text-4xl text-white text-center">
                  Let&apos;s Go!
                </p>
              )}
            </Card>
            <button
              className="absolute top-2 right-2 py-1 px-2 rounded-full border border-black text-xs"
              onClick={() => setSelectedModal("")}
            >
              close
            </button>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default Contents;
