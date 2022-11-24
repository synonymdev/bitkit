import React, { memo, ReactElement, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import Store from './../../../store/types';
import { IListData } from '../../../components/List';
import SettingsView from './../SettingsView';
import { updateSettings } from '../../../store/actions/settings';
import { resetTodos } from '../../../store/actions/todos';
import Dialog from '../../../components/Dialog';

const SuggestionsSettings = (): ReactElement => {
	const [showDialog, setShowDialog] = useState(false);

	const showSuggestions = useSelector(
		(state: Store) => state.settings.showSuggestions,
	);

	const SettingsListData: IListData[] = useMemo(
		() => [
			{
				data: [
					{
						title: 'Display suggestions',
						enabled: showSuggestions,
						type: 'switch',
						onPress: (): void => {
							updateSettings({ showSuggestions: !showSuggestions });
						},
					},
					{
						title: 'Reset suggestions',
						type: 'button',
						onPress: (): void => {
							setShowDialog(true);
						},
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
				listData={SettingsListData}
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
