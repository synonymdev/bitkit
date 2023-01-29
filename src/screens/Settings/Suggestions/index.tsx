import React, { memo, ReactElement, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { EItemType, IListData } from '../../../components/List';
import SettingsView from './../SettingsView';
import { updateSettings } from '../../../store/actions/settings';
import { resetTodos } from '../../../store/actions/todos';
import Dialog from '../../../components/Dialog';
import { showSuggestionsSelector } from '../../../store/reselect/settings';

const SuggestionsSettings = (): ReactElement => {
	const showSuggestions = useSelector(showSuggestionsSelector);
	const [showDialog, setShowDialog] = useState(false);

	const settingsListData: IListData[] = useMemo(
		() => [
			{
				data: [
					{
						title: 'Display suggestions',
						enabled: showSuggestions,
						type: EItemType.switch,
						onPress: (): void => {
							updateSettings({ showSuggestions: !showSuggestions });
						},
						testID: 'DisplaySuggestions',
					},
					{
						title: 'Reset suggestions',
						type: EItemType.button,
						onPress: (): void => {
							setShowDialog(true);
						},
						testID: 'ResetSuggestions',
					},
				],
			},
		],
		[showSuggestions],
	);

	return (
		<>
			<SettingsView
				title="Suggestions"
				listData={settingsListData}
				showBackNavigation={true}
			/>
			<Dialog
				visible={showDialog}
				title="Reset Suggestions?"
				description="Are you sure you want to reset the suggestions? They will
				reappear in case you have removed them from your Bitkit wallet
				overview."
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
