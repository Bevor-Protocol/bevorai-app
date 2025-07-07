import { Message, TerminalStep } from "./enums";

export const initialState = {
  [TerminalStep.INITIAL]: [
    {
      type: Message.SYSTEM,
      //       content:
      //         "How would like you get started? Choose an option (Type just \
      // the number such as '1'):\n\n1. Input contract address\n2. \
      // Upload file\n3. Paste code\n4. Input agent powered by Cookie DAO 🍪",
      content:
        "How would like you get started? Choose an option (Type just \
the number such as '1'):\n\n1. Input contract address\n2. \
Upload file\n3. Upload folder\n4. Paste code",
    },
  ],
  [TerminalStep.INPUT_ADDRESS]: [
    {
      type: Message.SYSTEM,
      content: "Input a contract address to get started. Make sure the source code is validated.",
    },
  ],
  [TerminalStep.INPUT_PASTE]: [
    {
      type: Message.SYSTEM,
      content: "Type or paste your smart contract",
    },
  ],
  [TerminalStep.INPUT_UPLOAD]: [
    {
      type: Message.SYSTEM,
      content: "Drag + Drop, or press below, to upload a .sol or .rs file",
    },
  ],
  [TerminalStep.INPUT_FOLDER]: [
    {
      type: Message.SYSTEM,
      content: "Upload folder of .sol files",
    },
  ],
  [TerminalStep.INPUT_AGENT]: [
    {
      type: Message.SYSTEM,
      content: "Input an agent twitter handle to get started",
    },
  ],
  [TerminalStep.SCOPE_DEFINITION]: [
    {
      type: Message.SYSTEM,
      content:
        "Select your scope, if you'd like to adjust it.\
\nThese only represent valid entry point functions, on deployable contracts.",
    },
  ],
  [TerminalStep.AUDIT_TYPE]: [
    {
      type: Message.SYSTEM,
      content:
        "Before we start, which type of audit do you want?\
\n\n1. Security Audit\n2. Gas Optimization Audit",
    },
  ],
  [TerminalStep.RESULTS]: [],
};
