// @flow

import React, { useMemo, Fragment, useCallback, ReactNode } from "react";
import { BigNumber } from "bignumber.js";
import { Trans } from "react-i18next";
import { useDispatch } from "react-redux";

import Box from "~/renderer/components/Box/Box";
import CheckCircle from "~/renderer/icons/CheckCircle";
import ToolTip from "~/renderer/components/Tooltip";
import FirstLetterIcon from "~/renderer/components/FirstLetterIcon";
import ChevronRight from "~/renderer/icons/ChevronRight";
import LedgerLiveLogo from "~/renderer/components/LedgerLiveLogo";
import Logo from "~/renderer/icons/Logo";
import Text from "~/renderer/components/Text";
import DropDown, { DropDownItem } from "~/renderer/components/DropDownSelector";
import { Ellipsis, Column, Wrapper, Divider } from "~/renderer/families/elrond/blocks/Delegation";
import { openURL } from "~/renderer/linking";
import { openModal } from "~/renderer/actions/modals";
import { denominate } from "~/renderer/families/elrond/helpers";
import { constants } from "~/renderer/families/elrond/constants";

import type {
  DelegationType,
  ValidatorType,
  UnbondingType,
} from "~/renderer/families/elrond/types";
import type { Account as AccountType } from "@ledgerhq/types-live";

interface RenderDropdownItemType {
  isActive: boolean;
  item: {
    key: string,
    label: string,
    disabled: boolean,
    tooltip: ReactNode,
    show: boolean,
  };
}

interface DropDownItemType {
  key: string;
  label: string;
  show: boolean;
  parameters: {
    account: AccountType,
    contract: string,
    validators: Array<ValidatorType>,
    delegations: Array<DelegationType>,
    amount?: string,
  };
}

type Props = DelegationType &
  AccountType &
  Array<DelegationType> &
  Array<ValidatorType> &
  Array<UnbondingType>;

const RenderDropdownItem = ({ item, isActive }: RenderDropdownItemType) => (
  <Fragment>
    {item.key === constants.modals.claim && <Divider />}

    <ToolTip content={item.tooltip} containerStyle={{ width: "100%" }}>
      <DropDownItem disabled={item.disabled} isActive={isActive}>
        <Box horizontal={true} alignItems="center" justifyContent="center">
          <Text ff="Inter|SemiBold">
            <Trans i18nKey={item.label} />
          </Text>
        </Box>
      </DropDownItem>
    </ToolTip>
  </Fragment>
);

const Delegation = (props: Props) => {
  const {
    contract,
    claimableRewards,
    userActiveStake,
    validator,
    account,
    delegations,
    validators,
  } = props;

  const dispatch = useDispatch();
  const onSelect = useCallback(
    (action: DropDownItemType) => {
      dispatch(openModal(action.key, action.parameters));
    },
    [dispatch],
  );

  const dropDownItems = useMemo(
    (): Array<DropDownItemType> =>
      [
        {
          key: constants.modals.unstake,
          label: "elrond.delegation.undelegate",
          show: true,
          parameters: {
            account,
            contract,
            validators,
            delegations,
            amount: userActiveStake,
          },
        },
        {
          key: constants.modals.claim,
          label: "elrond.delegation.reward",
          show: BigNumber(claimableRewards).gt(0),
          parameters: {
            account,
            contract,
            delegations,
            validators,
          },
        },
      ].filter(item => item.show),
    [claimableRewards, account, userActiveStake, contract, delegations, validators],
  );

  const name = validator ? validator.identity.name || contract : contract;
  const amount = useMemo(
    () =>
      denominate({
        input: userActiveStake,
        decimals: 6,
      }),
    [userActiveStake],
  );

  const rewards = useMemo(
    () =>
      denominate({
        input: claimableRewards,
        decimals: 6,
      }),
    [claimableRewards],
  );

  return (
    <Wrapper>
      <Column
        strong={true}
        clickable={true}
        onClick={() => openURL(`${constants.explorer}/providers/${contract}`)}
      >
        <Box mr={2}>
          {contract === constants.figment ? (
            <LedgerLiveLogo width={24} height={24} icon={<Logo size={15} />} />
          ) : (
            <FirstLetterIcon label={name} />
          )}
        </Box>

        <Ellipsis>{name}</Ellipsis>
      </Column>

      <Column>
        <Box color="positiveGreen" pl={2}>
          <ToolTip content={<Trans i18nKey="elrond.delegation.activeTooltip" />}>
            <CheckCircle size={14} />
          </ToolTip>
        </Box>
      </Column>

      <Column>
        {amount} {constants.egldLabel}
      </Column>

      <Column>
        {rewards} {constants.egldLabel}
      </Column>

      <Column>
        <DropDown items={dropDownItems} renderItem={RenderDropdownItem} onChange={onSelect}>
          {() => (
            <Box flex={true} horizontal={true} alignItems="center">
              <Trans i18nKey="common.manage" />

              <div style={{ transform: "rotate(90deg)" }}>
                <ChevronRight size={16} />
              </div>
            </Box>
          )}
        </DropDown>
      </Column>
    </Wrapper>
  );
};

export default Delegation;
