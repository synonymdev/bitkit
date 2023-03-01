import React, { memo, ReactElement, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { EItemType, IListData } from '../../../components/List';
import SettingsView from './../SettingsView';
import { updateSettings } from '../../../store/actions/settings';
import { resetTodos } from '../../../store/actions/todos';
import Dialog from '../../../components/Dialog';
import { showSuggestionsSelector } from '../../../store/reselect/settings';

const SuggestionsSettings = (): ReactElement => {
	const { t } = useTranslation('settings');
	const showSuggestions = useSelector(showSuggestionsSelector);
	const [showDialog, setShowDialog] = useState(false);

	const settingsListData: IListData[] = useMemo(
		() => [
			{
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
					{
						title: t('general.suggestions_reset'),
						type: EItemType.button,
						onPress: (): void => {
							setShowDialog(true);
						},
						testID: 'ResetSuggestions',
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
			/>
			<Dialog
				visible={showDialog}
				title={t('general.reset_title')}
				description={t('general.reset_desc')}
				onCancel={(): void => {
					setShowDialog(false);
				}}
				onConfirm={(): void => {
					resetTodos();
					setShowDialog(false);
				}}
			/>
		</>
	);
};

export default memo(SuggestionsSettings);
