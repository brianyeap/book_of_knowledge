export type Prompt = {
  question: string;
  choices: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  answer_key: "a" | "b" | "c" | "d";
};
