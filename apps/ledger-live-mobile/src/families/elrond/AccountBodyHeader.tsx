// @flow

import type { Account } from "@ledgerhq/types-live";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { BigNumber } from "bignumber.js";

import Delegations from "./components/Delegations";
import Unbondings from "./components/Unbondings";
import Rewards from "./components/Rewards";
import Drawer from "./components/Drawer";

import { denominate, randomizeProviders } from "./helpers";

const styles = StyleSheet.create({
  root: {
    margin: 16,
  },
  illustration: {
    alignSelf: "center",
    marginBottom: 16,
  },
  rewardsWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignContent: "center",
    padding: 16,
    marginBottom: 16,

    borderRadius: 4,
  },
  label: {
    fontSize: 20,
    flex: 1,
  },
  subLabel: {
    fontSize: 14,

    flex: 1,
  },
  column: {
    flexDirection: "column",
  },
  wrapper: {
    marginBottom: 16,
  },
  delegationsWrapper: {
    borderRadius: 4,
  },
  valueText: {
    fontSize: 14,
  },
});

interface Props {
  account: Account;
}

const withStaking = Component => (props: Props) =>
  props.account.elrondResources ? <Component {...props} /> : null;

const Staking = (props: Props) => {
  const { account } = props;

  const [drawer, setDrawer] = useState();
  const [delegationResources, setDelegationResources] = useState(
    account.elrondResources.delegations,
  );

  const validators = useMemo(
    () => randomizeProviders(account.elrondResources.providers),
    [account.elrondResources.providers],
  );

  const onDrawer = useCallback(setDrawer, [setDrawer]);
  const findValidator = useCallback(
    (contract: string) =>
      validators.find(validator => validator.contract === contract),
    [validators],
  );

  const fetchDelegations = useCallback(() => {
    setDelegationResources(account.elrondResources.delegations || []);

    return () =>
      setDelegationResources(account.elrondResources.delegations || []);
  }, [JSON.stringify(account.elrondResources.delegations)]);

  const delegations = useMemo(() => {
    const transform = input =>
      BigNumber(denominate({ input, showLastNonZeroDecimal: true }));

    const assignValidator = delegation => ({
      ...delegation,
      validator: findValidator(delegation.contract),
    });

    const sortDelegations = (alpha, beta) =>
      transform(alpha.userActiveStake).isGreaterThan(
        transform(beta.userActiveStake),
      )
        ? -1
        : 1;

    return delegationResources
      ? delegationResources.map(assignValidator).sort(sortDelegations)
      : null;
  }, [findValidator, delegationResources]);

  const unbondings = useMemo(
    () =>
      delegationResources
        ? delegationResources
            .reduce(
              (total, item) =>
                total.concat(
                  item.userUndelegatedList.map(unbonding => ({
                    ...unbonding,
                    contract: item.contract,
                    validator: findValidator(item.contract),
                  })),
                ),
              [],
            )
            .sort((alpha, beta) => alpha.seconds - beta.seconds)
        : null,
    [delegationResources, findValidator],
  );

  const rewards = useMemo(
    () =>
      delegations
        ? delegations.reduce(
            (total, delegation) => total.plus(delegation.claimableRewards || 0),
            BigNumber(0),
          )
        : null,
    [delegations],
  );

  useEffect(fetchDelegations, [fetchDelegations]);

  return (
    <View style={styles.root}>
      {drawer && (
        <Drawer
          drawer={drawer}
          account={account}
          onCloseDrawer={() => setDrawer()}
        />
      )}

      {rewards && rewards.gt(0) && (
        <Rewards value={rewards} account={account} delegations={delegations} />
      )}

      {delegations && (
        <Delegations
          onDrawer={onDrawer}
          value={rewards}
          account={account}
          validators={validators}
        />
      )}

      {unbondings && unbondings.length > 0 && (
        <Unbondings
          onDrawer={onDrawer}
          delegations={delegations}
          account={account}
          unbondings={unbondings}
        />
      )}
    </View>
  );
};

export default withStaking(Staking);
