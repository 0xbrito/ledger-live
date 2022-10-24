// @flow

export interface ValidatorType {
  address: string;
  apr: string;
  aprValue: number;
  automaticActivation: boolean;
  changeableServiceFee: boolean;
  checkCapOnRedelegate: boolean;
  contract: string;
  createdNonce: number;
  explorerURL: string;
  featured: boolean;
  initialOwnerFunds: string;
  maxDelegateAmountAllowed: string;
  maxDelegationCap: string;
  numNodes: number;
  numUsers: number;
  owner: string;
  ownerBelowRequiredBalanceThreshold: boolean;
  serviceFee: string;
  totalActiveStake: string;
  totalUnStaked: string;
  unBondPeriod: number;
  withDelegationCap: boolean;
  disabled?: boolean;
  identity: {
    key: string;
    name: string;
    avatar: string;
    description: string;
    location?: string;
    twitter: string;
    url: string;
  };
}

export interface UnbondingType {
  amount: string;
  seconds: number;
  contract?: string;
  validator?: ValidatorType;
}

export interface DelegationType {
  address: string;
  claimableRewards: string;
  contract: string;
  userActiveStake: string;
  userUnBondable: string;
  userUndelegatedList: Array<UnbondingType>;
  validator?: ValidatorType;
}
