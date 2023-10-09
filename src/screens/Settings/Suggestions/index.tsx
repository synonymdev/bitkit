import React, { memo, ReactElement, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import SettingsView from './../SettingsView';
import Dialog from '../../../components/Dialog';
import Button from '../../../components/Button';
import { EItemType, IListData } from '../../../components/List';
import { resetHiddenTodos } from '../../../store/actions/todos';
import { updateSettings } from '../../../store/actions/settings';
import { showSuggestionsSelector } from '../../../store/reselect/settings';
import { SettingsScreenProps } from '../../../navigation/types';

const SuggestionsSettings = ({
	navigation,
}: SettingsScreenProps<'SuggestionsSettings'>): ReactElement => {
	const { t } = useTranslation('settings');
	const showSuggestions = useSelector(showSuggestionsSelector);
	const [showDialog, setShowDialog] = useState(false);

	const settingsListData: IListData[] = useMemo(
		() => [
			{
				title: t('general.suggestions'),
				data: [
					{
						title: t('general.suggestions_display'),
						enabled: showSuggestions,
						type: EItemType.switch,
						onPress: (): void => {
							updateSettings({ showSuggestions: !showSuggestions });
						},
						testID: 'DisplaySuggestions',
					},
				],
			},
		],
		[showSuggestions, t],
	);

	return (
		<>
			<SettingsView
				title={t('general.suggestions')}
				listData={settingsListData}
				showBackNavigation={true}
				childrenPosition="bottom">
				<View style={styles.buttonContainer}>
					<Button
						style={styles.button}
						text={t('general.suggestions_reset')}
						size="large"
						testID="ResetSuggestions"
						onPress={(): void => setShowDialog(true)}
					/>
				</View>
			</SettingsView>

			<Dialog
				visible={showDialog}
				title={t('general.reset_title')}
				description={t('general.reset_desc')}
				confirmText={t('general.reset_confirm')}
				onCancel={(): void => {
					setShowDialog(false);
				}}
				onConfirm={(): void => {
					resetHiddenTodos();
					setShowDialog(false);
					navigation.navigate('Wallet');
				}}
			/>
		</>
	);
};

const styles = StyleSheet.create({
	buttonContainer: {
		paddingHorizontal: 16,
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 'auto',
	},
	button: {
		flex: 1,
	},
});

export default memo(SuggestionsSettings);
