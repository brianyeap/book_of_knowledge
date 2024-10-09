import { Prompt } from "@/types/prompt";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import LoadingAnimation from "../LoadingAnimation";
import { motion, useAnimation } from "framer-motion";
import Card from "../Card";
import * as Progress from "@radix-ui/react-progress";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/hooks";
import { calculateKnowledgeTokenDistribution } from "@/utils/calculateKnowledgeTokenDistribution";
import toast from "react-hot-toast";

const AnimatedNumber = ({ num }: { num: number }) => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Trigger the animation whenever the number changes
    setAnimate(true);
    const timer = setTimeout(() => setAnimate(false), 300); // Reset after the animation
    return () => clearTimeout(timer);
  }, [num]);

  return (
    <motion.div
      animate={{
        scale: animate ? 1.5 : 1, // Scale up briefly
        color: animate ? "#00ff00" : "#000000", // Turn green briefly
      }}
      transition={{ duration: 0.3 }}
      style={{ fontSize: "2rem" }} // Customize font size
    >
      {num}
    </motion.div>
  );
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const Questions = ({
  setIsEnd,
  coinsEarned,
  setCoinsEarned,
  setOuterCurrentGameIndex,
}: {
  setIsEnd: () => void;
  coinsEarned: number;
  setCoinsEarned: Dispatch<SetStateAction<number>>;
  setOuterCurrentGameIndex: Dispatch<SetStateAction<number | undefined>>;
}) => {
  const controls = useAnimation();
  const [promptObj, setPromptObj] = useState<Prompt | undefined>(undefined);
  const [nextPromptObj, setNextPromptObj] = useState<Prompt | undefined>(
    undefined
  );
  const [questionNum, setQuestionNum] = useState(1);
  const [selectedAns, setSelectedAns] = useState("");
  const [result, setResult] = useState<boolean | null>(null);
  const [currentGameIndex, setCurrentGameIndex] = useState<number>();
  const [startTime, setStartTime] = useState(0);
  const [historyQuestions, setHistoryQuestions] = useState<string[]>([]);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(0);
  const txHash = useSearchParams().get("hash");
  const subject = useSearchParams().get("subject");
  const questionDuration: number = 30;

  useEffect(() => {
    if (!subject) return;

    const initGame = async () => {
      if (!subject) return;
      console.log(`Init ${subject} game`);
      // while (!playGameRes) {
      // playGameRes = await getPlayGameResult(txHash, clientss[subject]);
      // console.log("playGameRes", playGameRes);

      // await delay(2500);
      // }
      setCurrentGameIndex(0);
      setOuterCurrentGameIndex(0);
      toast.loading("Generating questions...", { duration: 4000 });
      // const promptInfo = await questionGenerate(
      //   viemWalletClient!,
      //   viemPublicClient!,
      //   playGameRes.gameIndex,
      //   subject,
      //   []
      // );
      // const promptInfo = (await questionGenerateGPT(subject)) as any;
      const res = await (
        await fetch(`/api/generateQuestion?subject=${subject}`, {
          method: "GET",
        })
      ).json();
      console.log("received generated question", res);
      setHistoryQuestions([res as any]);
      setPromptObj(res as any);
    };

    initGame();
  }, [txHash, subject]);

  /****************** warn user from closing/refreshing tab *******************/

  useEffect(() => {
    const handleBeforeUnload = (event: any) => {
      const message =
        "Are you sure you want to leave? You will lose your progress!";
      event.returnValue = message;
      return message;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    console.log("result updated", result);
    if (result === true) {
      const currentTime = Date.now();
      const elapsedTime = (currentTime - startTime) / 1000;
      const remainingTime = questionDuration - elapsedTime;
      console.log("Current Time", currentTime);
      console.log("Elapsed Time", elapsedTime);
      console.log("Remaining Time", remainingTime);
      setQuestionTimeLeft(remainingTime + questionTimeLeft);
      setCoinsEarned(
        calculateKnowledgeTokenDistribution(
          questionDuration * 3,
          remainingTime + questionTimeLeft,
          50
        )
      );
      console.log("Question time left", questionTimeLeft);
    }
  }, [result]);

  /****************** handle question timer and answer logic ******************/

  // get start time and start timer animation
  const startAnimation = () => {
    setStartTime(Date.now());
    controls.start({ width: "0%" });
  };

  // stop animation and get remaining time
  const stopAnimation = () => {
    controls.stop();
    const currentTime = Date.now();
    const elapsedTime = (currentTime - startTime) / 1000;
    const remainingTime = questionDuration - elapsedTime;
    return parseFloat((remainingTime / questionDuration).toFixed(3));
  };

  // start the timer
  useEffect(() => {
    if (!subject) return;
    if (promptObj === undefined) return;
    startAnimation();
    if (questionNum >= 3) return;
    const initNextPrompt = async () => {
      // const promptInfo = (await questionGenerateGPT(subject)) as any;
      // console.log(promptInfo);
      const res = await (
        await fetch(`/api/generateQuestion?subject=${subject}`, {
          method: "GET",
        })
      ).json();
      setHistoryQuestions((prev) => [...prev, res.question]);
      setNextPromptObj(res);
    };
    initNextPrompt();
  }, [promptObj]);

  // handle choice click
  const handleClick = (click: string) => {
    if (result !== null) return;
    const remainingTimePct = stopAnimation();
    console.log("timer", remainingTimePct);
    setSelectedAns(click);
    console.log(
      `${click} === ${promptObj?.answer_key.toLowerCase()}`,
      click.toLowerCase() === promptObj?.answer_key.toLowerCase()
    );
    if (click.toLowerCase() === promptObj?.answer_key.toLowerCase()) {
      console.log("setting to true");
      setResult(true);
    } else {
      setResult(false);
    }
  };

  /**************************** post answer logic *****************************/

  // show result and clear question object
  useEffect(() => {
    if (result !== null) {
      setTimeout(() => {
        setPromptObj(undefined);
        setQuestionNum((prev) => prev + 1);
        setSelectedAns("");
        setResult(null);
        console.log("Reseting states");
      }, 6000);
    }
  }, [result]);

  // wait to show the next question
  useEffect(() => {
    if (questionNum > 3) {
      console.log("Game Finished!");
      setIsEnd();
    } else if (
      questionNum > 1 &&
      promptObj === undefined &&
      nextPromptObj !== undefined
    ) {
      const temp = nextPromptObj;
      setPromptObj(temp);
      setNextPromptObj(undefined);
    }
  }, [questionNum, nextPromptObj]);

  return (
    <>
      {promptObj ? (
        <motion.div
          key="question"
          className="w-screen h-screen flex flex-col space-y-7 items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="w-[660px] max-w-[90%] h-fit flex flex-col rounded-full p-[2px]">
            <div className="w-full bg-background rounded-full p-1">
              <Progress.Root className="relative w-full h-2 rounded-full bg-[#3f414e] overflow-hidden">
                <motion.div
                  initial={{ width: "100%" }}
                  animate={controls}
                  transition={{ duration: questionDuration, ease: "linear" }}
                  className="h-full rounded-full bg-gradient-to-r from-[#DB504A] to-[#E3B505] overflow-hidden"
                  onAnimationComplete={() => {
                    if (result === null) setResult(false);
                  }}
                />
              </Progress.Root>
            </div>
          </div>
          <p className="font-chewy text-base sm:text-lg md:text-xl text-black text-center">
            <AnimatedNumber
              //   num={calculateKnowledgeTokenDistribution(
              //     questionDuration * 3,
              //     questionTimeLeft,
              //     50
              //   )}
              num={coinsEarned}
            />
            {"tokens"}
          </p>
          {result !== null ? (
            result ? (
              <Card className="w-[660px] max-w-[90%] py-4 px-4 sm:px-7 md:px-10 bg-mnGreen flex flex-col space-y-3">
                <p className="font-chewy text-base sm:text-lg md:text-xl text-black text-center">
                  Question {questionNum}
                </p>
                <p className="font-chewy text-lg sm:text-xl md:text-2xl text-black text-center">
                  Correct!
                </p>
              </Card>
            ) : (
              <Card className="w-[660px] max-w-[90%] py-4 px-4 sm:px-7 md:px-10 bg-jasper flex flex-col space-y-3">
                <p className="font-chewy text-base sm:text-lg md:text-xl text-black text-center">
                  Question {questionNum}
                </p>
                <p className="font-chewy text-lg sm:text-xl md:text-2xl text-black text-center">
                  Answer: {promptObj.choices[promptObj.answer_key]}
                </p>
              </Card>
            )
          ) : (
            <Card className="w-[660px] max-w-[90%] py-4 px-4 sm:px-7 md:px-10 bg-saffron flex flex-col space-y-3">
              <p className="font-chewy text-base sm:text-lg md:text-xl text-black text-center">
                Question {questionNum}
              </p>
              <p className="font-chewy text-lg sm:text-xl md:text-2xl text-black text-center">
                {promptObj.question}
              </p>
            </Card>
          )}
          <div className="relative w-[660px] max-w-[90%] flex space-x-3">
            <Card
              className={`flex-1 py-2 ${
                selectedAns === "a" ? "bg-saffron" : "bg-white"
              }`}
              onClick={() => handleClick("a")}
            >
              <p
                className={`font-chewy text-lg sm:text-xl md:text-2xl ${
                  selectedAns === "a" ? "bg-saffron text-black" : "text-mnGreen"
                } text-center`}
              >
                {promptObj.choices.a}
              </p>
            </Card>
            <Card
              className={`flex-1 py-2 ${
                selectedAns === "b" ? "bg-saffron" : "bg-white"
              }`}
              onClick={() => handleClick("b")}
            >
              <p
                className={`font-chewy text-lg sm:text-xl md:text-2xl ${
                  selectedAns === "b" ? "bg-saffron text-black" : "text-mnGreen"
                } text-center`}
              >
                {promptObj.choices.b}
              </p>
            </Card>
          </div>
          <div className="relative w-[660px] max-w-[90%] flex space-x-3">
            <Card
              className={`flex-1 py-2 ${
                selectedAns === "c" ? "bg-saffron" : "bg-white"
              }`}
              onClick={() => handleClick("c")}
            >
              <p
                className={`font-chewy text-lg sm:text-xl md:text-2xl ${
                  selectedAns === "c" ? "bg-saffron text-black" : "text-mnGreen"
                } text-center`}
              >
                {promptObj.choices.c}
              </p>
            </Card>
            <Card
              className={`flex-1 py-2 ${
                selectedAns === "d" ? "bg-saffron" : "bg-white"
              }`}
              onClick={() => handleClick("d")}
            >
              <p
                className={`font-chewy text-lg sm:text-xl md:text-2xl ${
                  selectedAns === "d" ? "text-black" : "text-mnGreen"
                } text-center`}
              >
                {promptObj.choices.d}
              </p>
            </Card>
          </div>
        </motion.div>
      ) : (
        <>
          <p className="font-chewy text-base sm:text-lg md:text-xl text-black text-center">
            <AnimatedNumber
              num={calculateKnowledgeTokenDistribution(
                questionDuration * 3,
                questionTimeLeft,
                50
              )}
            />
            {"tokens"}
          </p>
          <motion.div
            key="loading"
            className="w-screen h-screen flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LoadingAnimation size="lg" />
          </motion.div>
        </>
      )}
    </>
  );
};

export default Questions;
