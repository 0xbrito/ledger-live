// @flow
import React, { useCallback, useEffect, useMemo } from "react";
import { useLocation, useHistory } from "react-router-dom";
import SwapFormSummary from "./FormSummary";
import SwapFormSelectors from "./FormSelectors";
import Box from "~/renderer/components/Box";
import styled from "styled-components";
import ButtonBase from "~/renderer/components/Button";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";
import { context } from "~/renderer/drawers/Provider";
import { Trans, useTranslation } from "react-i18next";
import {
  useSwapProviders,
  usePollKYCStatus,
  useSwapTransaction,
} from "@ledgerhq/live-common/lib/exchange/swap/hooks";
import { KYC_STATUS } from "@ledgerhq/live-common/lib/exchange/swap/utils";
import { useDispatch, useSelector } from "react-redux";
import {
  updateProvidersAction,
  resetSwapAction,
  providersSelector,
  updateTransactionAction,
  updateRateAction,
  rateSelector,
} from "~/renderer/actions/swap";
import FormLoading from "./FormLoading";
import FormNotAvailable from "./FormNotAvailable";
import FormKYCBanner from "./FormKYCBanner";
import { swapKYCSelector } from "~/renderer/reducers/settings";
import { setSwapKYCStatus } from "~/renderer/actions/settings";
import ExchangeDrawer from "./ExchangeDrawer/index";
import TrackPage from "~/renderer/analytics/TrackPage";
import { track } from "~/renderer/analytics/segment";
import { SWAP_VERSION, trackSwapError } from "../utils/index";
import { shallowAccountsSelector } from "~/renderer/reducers/accounts";
import { getMainAccount } from "@ledgerhq/live-common/lib/account";
import Alert from "~/renderer/components/Alert";
import Text from "~/renderer/components/Text";
import FakeLink from "~/renderer/components/FakeLink";

const Wrapper: ThemedComponent<{}> = styled(Box).attrs({
  p: 20,
  mt: 35,
})`
  row-gap: 1.75rem;
  max-width: 27.5rem;
`;

const Button = styled(ButtonBase)`
  justify-content: center;
`;

const trackNoRates = ({ toState }) => {
  track("Page Swap Form - Error No Rate", {
    sourceCurrency: toState.currency?.name,
  });
};

export const useProviders = () => {
  const dispatch = useDispatch();
  const { providers, error: providersError } = useSwapProviders();
  const storedProviders = useSelector(providersSelector);

  useEffect(() => {
    if (providers) dispatch(updateProvidersAction(providers));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providers]);

  useEffect(() => {
    if (providersError) dispatch(resetSwapAction());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providersError]);

  return {
    storedProviders,
    providers,
    providersError,
  };
};

// This component render an Alert with links that lead to dex swap live apps.
function DecentralizedSwapAvailableAlert() {
  const history = useHistory();

  const navigateTo = useCallback(
    (appId: string) => () => {
      history.push({
        pathname: `/platform/${appId}`,
      });
    },
    [history],
  );

  return (
    <Alert mt="16px" type="secondary">
      <Text ff="Inter|Medium" fontSize={4}>
        <Trans i18nKey="swap.decentralizedSwapAvailable">
          <FakeLink onClick={navigateTo("paraswap")} />
          <FakeLink onClick={navigateTo("1inch-lld")} />
        </Trans>
      </Text>
    </Alert>
  );
}

const SwapForm = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { state: locationState } = useLocation();
  const accounts = useSelector(shallowAccountsSelector);
  const { storedProviders, providers, providersError } = useProviders();
  const exchangeRate = useSelector(rateSelector);
  const setExchangeRate = useCallback(
    rate => {
      dispatch(updateRateAction(rate));
    },
    [dispatch],
  );
  const swapTransaction = useSwapTransaction({
    accounts,
    exchangeRate,
    setExchangeRate,
    onNoRates: trackNoRates,
    ...locationState,
  });
  const exchangeRatesState = swapTransaction.swap?.rates;
  const swapKYC = useSelector(swapKYCSelector);
  const provider = exchangeRate?.provider;
  const providerKYC = swapKYC?.[provider];
  const kycStatus = providerKYC?.status;
  const showWyreKYCBanner = provider === "wyre" && kycStatus !== KYC_STATUS.approved;
  const { setDrawer } = React.useContext(context);

  useEffect(() => {
    dispatch(updateTransactionAction(swapTransaction.transaction));
    // eslint-disable-next-line
  }, [swapTransaction.transaction]);

  useEffect(() => {
    // Whenever an account is added, reselect the currency to pick a default target account.
    // (possibly the one that got created)
    if (swapTransaction.swap.to.currency && !swapTransaction.swap.to.account) {
      swapTransaction.setToCurrency(swapTransaction.swap.to.currency);
    }
    // eslint-disable-next-line
  }, [accounts]);

  usePollKYCStatus(
    {
      provider,
      kyc: providerKYC,
      onChange: res => {
        dispatch(
          setSwapKYCStatus({
            provider: provider,
            id: res?.id,
            status: res?.status,
          }),
        );
      },
    },
    [dispatch],
  );
  const swapError = swapTransaction.fromAmountError || exchangeRatesState?.error;

  // Track errors
  useEffect(
    () => {
      swapError &&
        trackSwapError(swapError, {
          sourcecurrency: swapTransaction.swap.from.currency?.name,
          provider,
          swapVersion: SWAP_VERSION,
        });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [swapError],
  );

  const isSwapReady =
    !swapTransaction.bridgePending &&
    exchangeRatesState.status !== "loading" &&
    swapTransaction.transaction &&
    !providersError &&
    !swapError &&
    !showWyreKYCBanner &&
    exchangeRate &&
    swapTransaction.swap.to.account;

  const onSubmit = () => {
    track("Page Swap Form - Request", {
      sourceCurrency: sourceCurrency?.name,
      targetCurrency: targetCurrency?.name,
      provider,
      swapVersion: SWAP_VERSION,
    });
    setDrawer(ExchangeDrawer, { swapTransaction, exchangeRate }, { preventBackdropClick: true });
  };

  const sourceAccount = swapTransaction.swap.from.account;
  const sourceParentAccount = swapTransaction.swap.from.parentAccount;
  const targetAccount = swapTransaction.swap.to.account;
  const targetParentAccount = swapTransaction.swap.to.parentAccount;
  const sourceCurrency = swapTransaction.swap.from.currency;
  const targetCurrency = swapTransaction.swap.to.currency;

  // We check if a decentralized swap is available to conditionnaly render an Alert below.
  // All Ethereum related currencies are considered available
  const decentralizedSwapAvailable = useMemo(() => {
    if (sourceAccount && targetAccount) {
      const sourceMainAccount = getMainAccount(sourceAccount, sourceParentAccount);
      const targetMainAccount = getMainAccount(targetAccount, targetParentAccount);

      if (
        targetMainAccount.currency.family === "ethereum" &&
        sourceMainAccount.currency.id === targetMainAccount.currency.id
      ) {
        return true;
      }
    }
    return false;
  }, [sourceAccount, sourceParentAccount, targetAccount, targetParentAccount]);

  if (providers?.length)
    return (
      <Wrapper>
        <TrackPage category="Swap" name="Form" provider={provider} swapVersion={SWAP_VERSION} />
        <SwapFormSelectors
          fromAccount={sourceAccount}
          toAccount={swapTransaction.swap.to.account}
          fromAmount={swapTransaction.swap.from.amount}
          toCurrency={targetCurrency}
          toAmount={exchangeRate?.toAmount || null}
          setFromAccount={swapTransaction.setFromAccount}
          setFromAmount={swapTransaction.setFromAmount}
          setToAccount={swapTransaction.setToAccount}
          setToCurrency={swapTransaction.setToCurrency}
          isMaxEnabled={swapTransaction.swap.isMaxEnabled}
          toggleMax={swapTransaction.toggleMax}
          fromAmountError={swapError}
          isSwapReversable={swapTransaction.swap.isSwapReversable}
          reverseSwap={swapTransaction.reverseSwap}
          provider={provider}
          loadingRates={swapTransaction.swap.rates.status === "loading"}
        />
        <SwapFormSummary
          swapTransaction={swapTransaction}
          kycStatus={kycStatus}
          provider={provider}
        />
        {showWyreKYCBanner ? <FormKYCBanner provider={provider} status={kycStatus} /> : null}
        <Box>
          <Button primary disabled={!isSwapReady} onClick={onSubmit} data-test-id="exchange-button">
            {t("common.exchange")}
          </Button>
          {decentralizedSwapAvailable ? <DecentralizedSwapAvailableAlert /> : null}
        </Box>
      </Wrapper>
    );

  // TODO: ensure that the error is catch by Sentry in this case
  if (storedProviders?.length === 0 || providersError)
    return (
      <>
        <FormNotAvailable />
        <Box px="18px" maxWidth="500px">
          <DecentralizedSwapAvailableAlert />
        </Box>
      </>
    );

  return <FormLoading />;
};

export default SwapForm;
