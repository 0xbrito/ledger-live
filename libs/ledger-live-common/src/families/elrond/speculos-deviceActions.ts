import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { formatCurrencyUnit } from "../../currencies";
import { deviceActionFlow } from "../../bot/specs";
import { decodeTokenAccountId } from "../../account";
import BigNumber from "bignumber.js";

export const acceptMoveBalanceTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Receiver",
        button: "Rr",
        expectedValue: ({ transaction }) => transaction.recipient,
      },
      {
        title: "Amount",
        button: "Rr",
        expectedValue: ({ account, status }) => {
          return formatCurrencyUnit(account.unit, status.amount, {
            showCode: true,
            disableRounding: true,
            joinFragmentsSeparator: " ",
          }).replace(/\s+/g, " ");
        },
      },
      {
        title: "Fee",
        button: "Rr",
        expectedValue: ({ account, transaction }) =>
          formatCurrencyUnit(
            account.unit,
            transaction.fees || new BigNumber(50000),
            {
              showCode: true,
              disableRounding: true,
              joinFragmentsSeparator: " ",
            }
          ).replace(/\s+/g, " "),
      },
      {
        title: "Data",
        button: "Rr",
      },
      {
        title: "Sign",
        button: "LRlr",
        final: true,
      },
      {
        title: "Network",
        button: "Rr",
        expectedValue: () => "Mainnet",
      },
    ],
  });

export const acceptDelegateTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Receiver",
        button: "Rr",
        expectedValue: ({ transaction }) => transaction.recipient,
      },
      {
        title: "Amount",
        button: "Rr",
        expectedValue: ({ account, transaction }) =>
          formatCurrencyUnit(account.unit, transaction.amount, {
            showCode: true,
            disableRounding: true,
            joinFragmentsSeparator: " ",
          }).replace(/\s+/g, " "),
      },
      {
        title: "Fee",
        button: "Rr",
        expectedValue: ({ account, transaction }) =>
          formatCurrencyUnit(
            account.unit,
            transaction.fees || new BigNumber(50000),
            {
              showCode: true,
              disableRounding: true,
              joinFragmentsSeparator: " ",
            }
          ).replace(/\s+/g, " "),
      },
      {
        title: "Data",
        button: "Rr",
      },
      {
        title: "Sign",
        button: "LRlr",
        final: true,
      },
      {
        title: "Network",
        button: "Rr",
        expectedValue: () => "Mainnet",
      },
    ],
  });

export const acceptEsdtTransferTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Token",
        button: "Rr",
        expectedValue: ({ transaction }) =>
          (transaction.subAccountId &&
            decodeTokenAccountId(transaction.subAccountId).token?.ticker) ||
          "",
      },
      {
        title: "Value",
        button: "Rr",
        expectedValue: ({ account, transaction }) =>
          formatCurrencyUnit(account.unit, transaction.amount, {
            showCode: true,
            disableRounding: true,
            joinFragmentsSeparator: " ",
          }).replace(/\s+/g, " "),
      },
      {
        title: "Receiver",
        button: "Rr",
        expectedValue: ({ transaction }) => transaction.recipient,
      },
      {
        title: "Fee",
        button: "Rr",
        expectedValue: ({ account, transaction }) =>
          formatCurrencyUnit(
            account.unit,
            transaction.fees || new BigNumber(50000),
            {
              showCode: true,
              disableRounding: true,
              joinFragmentsSeparator: " ",
            }
          ).replace(/\s+/g, " "),
      },
      {
        title: "Sign",
        button: "LRlr",
        final: true,
      },
      {
        title: "Network",
        button: "Rr",
        expectedValue: () => "Mainnet",
      },
    ],
  });
export default {
  acceptMoveBalanceTransaction,
  acceptEsdtTransferTransaction,
  acceptDelegateTransaction,
};
