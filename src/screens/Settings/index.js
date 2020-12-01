/* @flow */
import React, { useCallback, useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { View, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/dist/Feather";
import Config from "react-native-config";
import { ScreenName } from "../../const";
import { accountsSelector } from "../../reducers/accounts";
import SettingsCard from "../../components/SettingsCard";
import PoweredByLedger from "./PoweredByLedger";
import Accounts from "../../icons/Accounts";
import LiveLogoIcon from "../../icons/LiveLogoIcon";
import Atom from "../../icons/Atom";
import Help from "../../icons/Help";
import Display from "../../icons/Display";
import colors from "../../colors";
import TrackScreen from "../../analytics/TrackScreen";
import NavigationScrollView from "../../components/NavigationScrollView";

type Props = {
  navigation: any,
};

export default function Settings({ navigation }: Props) {
  const { t } = useTranslation();
  const accounts = useSelector(accountsSelector);

  const [debugVisible, setDebugVisible] = useState(
    Config.FORCE_DEBUG_VISIBLE || false,
  );

  const onSetDebugVisible = useCallback(() => {
    setDebugVisible(true);
  }, []);

  return (
    <NavigationScrollView>
      <TrackScreen category="Settings" />
      <View style={styles.root}>
        <SettingsCard
          title={t("settings.display.title")}
          desc={t("settings.display.desc")}
          icon={<Display size={16} color={colors.live} />}
          onClick={() => navigation.navigate(ScreenName.GeneralSettings)}
        />
        {accounts.length > 0 && (
          <SettingsCard
            title={t("settings.accounts.title")}
            desc={t("settings.accounts.desc")}
            icon={<Accounts size={16} color={colors.live} />}
            onClick={() => navigation.navigate(ScreenName.AccountsSettings)}
          />
        )}
        <SettingsCard
          title={t("settings.about.title")}
          desc={t("settings.about.desc")}
          icon={<LiveLogoIcon size={16} color={colors.live} />}
          onClick={() => navigation.navigate(ScreenName.AboutSettings)}
        />
        <SettingsCard
          title={t("settings.help.title")}
          desc={t("settings.help.desc")}
          icon={<Help size={16} color={colors.live} />}
          onClick={() => navigation.navigate(ScreenName.HelpSettings)}
        />
        <SettingsCard
          title={t("settings.experimental.title")}
          desc={t("settings.experimental.desc")}
          icon={<Atom size={16} color={colors.live} />}
          onClick={() => navigation.navigate(ScreenName.ExperimentalSettings)}
        />
        {debugVisible ? (
          <SettingsCard
            title="Debug"
            desc="Use at your own risk – Developer tools"
            icon={<Icon name="wind" size={16} color={colors.live} />}
            onClick={() => navigation.navigate(ScreenName.DebugSettings)}
          />
        ) : null}
        <PoweredByLedger onTriggerDebug={onSetDebugVisible} />
      </View>
    </NavigationScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 64,
  },
});
