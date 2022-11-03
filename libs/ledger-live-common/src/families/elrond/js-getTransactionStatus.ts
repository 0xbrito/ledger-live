import {
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddress,
  FeeNotLoaded,
  InvalidAddressBecauseDestinationIsAlsoSource,
  FeeTooHigh,
  AmountRequired,
} from "@ledgerhq/errors";
import { DECIMALS_LIMIT } from "./constants";
import type { ElrondAccount, Transaction, TransactionStatus } from "./types";
import {
  isValidAddress,
  isSelfTransaction,
  computeTransactionValue,
} from "./logic";
import { DecimalsLimitReached } from "./errors";

const getTransactionStatus = async (
  a: ElrondAccount,
  t: Transaction
): Promise<TransactionStatus> => {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  if (!t.recipient) {
    errors.recipient = new RecipientRequired();
  } else if (isSelfTransaction(a, t)) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  } else if (!isValidAddress(t.recipient)) {
    errors.recipient = new InvalidAddress("", {
      currencyName: a.currency.name,
    });
  }

  if (!t.fees) {
    errors.fees = new FeeNotLoaded();
  }

  const tokenAccount =
    (t.subAccountId &&
      a.subAccounts &&
      a.subAccounts.find((ta) => ta.id === t.subAccountId)) ||
    null;

  if (!errors.amount && t.amount.eq(0) && !t.useAllAmount) {
    errors.amount = new AmountRequired();
  }

  const { amount, totalSpent, estimatedFees } = await computeTransactionValue(
    t,
    a,
    tokenAccount
  );

  if (estimatedFees.gt(a.balance)) {
    errors.amount = new NotEnoughBalance();
  }

  if (tokenAccount) {
    if (totalSpent.gt(tokenAccount.balance)) {
      errors.amount = new NotEnoughBalance();
    }
    if (!totalSpent.decimalPlaces(DECIMALS_LIMIT).isEqualTo(totalSpent)) {
      errors.amount = new DecimalsLimitReached();
    }
  } else {
    if (totalSpent.gt(a.balance)) {
      errors.amount = new NotEnoughBalance();
    }

    const isZeroAmountOperation = t.mode !== "send" && t.mode !== "delegate";
    if (!isZeroAmountOperation && amount.div(10).lt(estimatedFees)) {
      warnings.feeTooHigh = new FeeTooHigh();
    }
  }

  return Promise.resolve({
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  });
};

export default getTransactionStatus;
