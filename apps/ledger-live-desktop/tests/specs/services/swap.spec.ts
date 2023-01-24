import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { SwapPage } from "../../models/SwapPage";
import { DeviceAction } from "../../models/DeviceAction";
import { Drawer } from "tests/models/Drawer";
import { AccountsPage } from "tests/models/AccountsPage";
import { AccountPage } from "tests/models/AccountPage";
import { Layout } from "tests/models/Layout";

test.use({ userdata: "1AccountBTC1AccountETH", env: { DEV_TOOLS: true } });

process.env.PWDEBUG = "1";

// Tests to cover in Playwright test suite
// Switch From/To currency
// Enter specific amount
// Change network fees
// Add new account from ‘From’ menu
// Add new account when ‘To’ account doesn’t exist
// Filter quotes (centralised, decentralised, etc)
// Correct fiat currency used
// Navigate to
// Errors:
// ‘Insufficient funds’
// Amount too low for providers ‘Amount must be at least …’

test.describe.parallel("Swap", () => {
  test("Add accounts via Swap page", async ({ page }) => {
    const layout = new Layout(page);
    const accountsPage = new AccountsPage(page);
    const accountPage = new AccountPage(page);
    const swapPage = new SwapPage(page);

    await test.step("Navigate to swap via account page", async () => {
      await layout.goToAccounts();
      await accountsPage.navigateToAccountByName("Ethereum 2");
      await accountPage.navigateToSwap();
      await expect.soft(page).toHaveScreenshot("open-swap-page-with-eth-account-selected.png");
    });

    await test.step("Start account add flow from Source (From) currency", async () => {
      // await page.pause();
      await swapPage.openFromAccountDropdown();
      await expect.soft(page).toHaveScreenshot("from-account-dropdown.png");
    });

    await test.step("Start account add flow from Destination (To) currency", async () => {
      // await page.pause();
      // await layout.goToAccounts();
      // await accountsPage.navigateToAccountByName("Ethereum 2");
      // await accountPage.navigateToSwap();
      // await expect.soft(page).toHaveScreenshot("open-swap-page-with-eth-account-selected.png");
    });
  });

  test("Full Swap with Centralised Exchange", async ({ page }) => {
    const swapPage = new SwapPage(page);
    const deviceAction = new DeviceAction(page);
    const drawer = new Drawer(page);

    let swapId: string;
    let detailsSwapId: string;

    await test.step("Open Swap Page", async () => {
      await swapPage.navigate();
      await expect.soft(page).toHaveScreenshot("open-swap-page.png");
    });

    await test.step("Select Max Spendable", async () => {
      await swapPage.sendMax();
      await swapPage.waitForExchangeToBeAvailable();
      await expect.soft(page).toHaveScreenshot("max-spendable-swap.png");
    });

    await test.step("Select Different Target Account", async () => {
      await swapPage.openTargetAccountDrawer();
      await expect.soft(page).toHaveScreenshot("target-account-drawer.png");
      await swapPage.selectTargetAccount("Ethereum 2");
    });

    await test.step("Confirm Exchange", async () => {
      await swapPage.selectExchangeQuote("changelly", "float");
      await swapPage.confirmExchange();
      await deviceAction.initiateSwap();
      await expect.soft(page).toHaveScreenshot("initiate-swap.png", { timeout: 20000 });
    });

    await test.step("Confirm swap with Nano App", async () => {
      await deviceAction.confirmSwap();
      await deviceAction.silentSign();
      const originalSwapId = await swapPage.verifySuccessfulExchange();
      swapId = originalSwapId.replace("#", "");
      await expect.soft(page).toHaveScreenshot("confirmed-swap.png");
    });

    await test.step("Verify Swap details are present in the exchange drawer", async () => {
      await swapPage.navigateToExchangeDetails();
      detailsSwapId = await swapPage.verifyExchangeDetails();
      await expect(detailsSwapId).toEqual(swapId);
      await expect.soft(page).toHaveScreenshot("verify-swap-details.png");
    });

    await test.step("Verify Swap details are present in the swap history", async () => {
      await drawer.close();
      await swapPage.verifyHistoricalSwapsHaveLoadedFully();
      await expect.soft(page).toHaveScreenshot("verify-swap-history.png", { timeout: 20000 });
    });
  });
});
