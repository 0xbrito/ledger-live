// @flow
import invariant from "invariant";
import { useState, useEffect, useMemo, useRef } from "react";
import { getTronSuperRepresentatives } from "../../api/Tron";

import { BigNumber } from "bignumber.js";
import type { SuperRepresentative, Vote } from "./types";
import type { Account } from "../../types";
import { useBridgeSync } from "../../bridge/react";
import { getCryptoCurrencyById } from "../../currencies";

export type Action = {
  type: "updateVote" | "resetVotes" | "clearVotes",
  address: string,
  value: string
};

export type State = {
  votes: { [address: string]: number }, // formatted Map of votes
  votesAvailable: number, // total of available TP
  votesUsed: number, // total of TP used
  votesSelected: number, // number of SR votes selected
  max: number, // votes remaining
  initialVotes: { [address: string]: number } // initial Map of votes
};

const oneTrx = BigNumber(10).pow(
  getCryptoCurrencyById("tron").units[0].magnitude
);
export const MIN_TRANSACTION_AMOUNT = oneTrx;

export const SR_THRESHOLD = 27;
export const SR_MAX_VOTES = 5;

let __lastSeenSR: SuperRepresentative[] = [];

/** Fetch the list of super representatives */
export const useTronSuperRepresentatives = (): Array<SuperRepresentative> => {
  const [sr, setSr] = useState(__lastSeenSR);

  useEffect(() => {
    let unsub = false;
    getTronSuperRepresentatives().then((sr: SuperRepresentative[]) => {
      __lastSeenSR = sr;
      if (unsub) return;
      setSr(sr);
    });
    return () => {
      unsub = true;
    };
  }, []);

  return sr;
};

/** Get last time voted */
export const getLastVotedDate = (account: Account): ?Date => {
  return account.tronResources && account.tronResources.lastVotedDate
    ? account.tronResources.lastVotedDate
    : null;
};

/** Get next available date to claim rewards */
export const getNextRewardDate = (account: Account): ?number => {
  const lastWithdrawnRewardDate =
    account.tronResources && account.tronResources.lastWithdrawnRewardDate
      ? account.tronResources.lastWithdrawnRewardDate
      : null;

  if (lastWithdrawnRewardDate) {
    // add 24hours
    const nextDate = lastWithdrawnRewardDate.getTime() + 24 * 60 * 60 * 1000;
    if (nextDate > Date.now()) return nextDate;
  }

  return null;
};

/** format votes with superrepresentatives data */
export const formatVotes = (
  votes: ?Array<Vote>,
  superRepresentatives: ?Array<SuperRepresentative>
): Array<{|
  ...Vote,
  validator: ?SuperRepresentative,
  isSR: boolean,
  rank: number
|}> => {
  return votes && superRepresentatives
    ? votes.map(({ address, voteCount }) => {
        const srIndex = superRepresentatives.findIndex(
          sp => sp.address === address
        );

        return {
          validator: superRepresentatives[srIndex],
          rank: srIndex + 1,
          isSR: srIndex < SR_THRESHOLD,
          address,
          voteCount
        };
      })
    : [];
};

// wait an effect of a tron freeze until it effectively change
export function useTronPowerLoading(account: Account) {
  const tronPower =
    (account.tronResources && account.tronResources.tronPower) || 0;
  const initialTronPower = useRef(tronPower);
  const initialAccount = useRef(account);

  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    if (initialTronPower.current !== tronPower) {
      setLoading(false);
    }
  }, [tronPower]);

  const sync = useBridgeSync();

  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      sync({
        type: "SYNC_ONE_ACCOUNT",
        priority: 10,
        accountId: initialAccount.current.id
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [initialAccount, sync, isLoading]);

  return isLoading;
}

/** Search filters for SR list */
const searchFilter = (query?: string) => ({
  name,
  address
}: {
  name: ?string,
  address: string
}) => {
  if (!query) return true;
  const terms = `${name || ""} ${address}`;
  return terms.toLowerCase().includes(query.toLowerCase().trim());
};

/** Hook to search and sort SR list according to initial votes and query */
export function useSortedSr(
  search: string,
  superRepresentatives: SuperRepresentative[],
  votes: Vote[]
): {
  sr: SuperRepresentative,
  name: ?string,
  address: string,
  rank: number,
  isSR: boolean
}[] {
  const { current: initialVotes } = useRef(votes.map(({ address }) => address));

  const SR = useMemo(
    () =>
      superRepresentatives.map((sr, rank) => ({
        sr,
        name: sr.name,
        address: sr.address,
        rank: rank + 1,
        isSR: rank < SR_THRESHOLD
      })),
    [superRepresentatives]
  );

  const sortedVotes = useMemo(
    () =>
      SR.filter(({ address }) => initialVotes.includes(address)).concat(
        SR.filter(({ address }) => !initialVotes.includes(address))
      ),
    [SR, initialVotes]
  );

  const sr = useMemo(
    () => (search ? SR.filter(searchFilter(search)) : sortedVotes),
    [search, SR, sortedVotes]
  );

  return sr;
}

/** format account to retrieve unfreeze data */
export const getUnfreezeData = (
  account: Account
): {
  unfreezeBandwidth: BigNumber,
  unfreezeEnergy: BigNumber,
  canUnfreezeBandwidth: boolean,
  canUnfreezeEnergy: boolean,
  bandwidthExpiredAt: ?Date,
  energyExpiredAt: ?Date
} => {
  const { tronResources } = account;
  invariant(tronResources, "getUnfreezeData: tron account is expected");
  const {
    frozen: { bandwidth, energy }
  } = tronResources;

  /** ! expiredAt should always be set with the amount if not this will disable the field by default ! */
  const bandwidthExpiredAt = bandwidth ? bandwidth.expiredAt : null;
  // eslint-disable-next-line no-underscore-dangle
  const _bandwidthExpiredAt = +new Date(+bandwidthExpiredAt);

  const energyExpiredAt = energy ? energy.expiredAt : null;
  // eslint-disable-next-line no-underscore-dangle
  const _energyExpiredAt = +new Date(+energyExpiredAt);

  const unfreezeBandwidth = BigNumber(bandwidth ? bandwidth.amount : 0);
  const canUnfreezeBandwidth =
    unfreezeBandwidth.gt(0) && Date.now() > _bandwidthExpiredAt;

  const unfreezeEnergy = BigNumber(energy ? energy.amount : 0);
  const canUnfreezeEnergy =
    unfreezeEnergy.gt(0) && Date.now() > _energyExpiredAt;

  return {
    unfreezeBandwidth,
    unfreezeEnergy,
    canUnfreezeBandwidth,
    canUnfreezeEnergy,
    bandwidthExpiredAt,
    energyExpiredAt
  };
};
