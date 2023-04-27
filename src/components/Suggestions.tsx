import React, {
	memo,
	ReactElement,
	useMemo,
	useState,
	useCallback,
} from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Carousel from 'react-native-reanimated-carousel';
import { useTranslation } from 'react-i18next';

import { View } from '../styles/components';
import { Caption13Up } from '../styles/text';
import SuggestionCard from './SuggestionCard';
import { allTodos } from '../store/shapes/todos';
import { TTodoType } from '../store/types/todos';
import { removeTodo } from '../store/actions/todos';
import { showBottomSheet } from '../store/actions/ui';
import { useAppSelector } from '../hooks/redux';
import { useBalance } from '../hooks/wallet';
import Dialog from './Dialog';
import type { RootNavigationProp } from '../navigation/types';
import { todosSelector } from '../store/reselect/todos';
import {
	pinSelector,
	showSuggestionsSelector,
} from '../store/reselect/settings';

const Suggestions = (): ReactElement => {
	const { t } = useTranslation('cards');
	const navigation = useNavigation<RootNavigationProp>();
	const { width } = useWindowDimensions();
	const [index, setIndex] = useState(0);
	const [showDialog, setShowDialog] = useState(false);
	const { satoshis: balance } = useBalance({ onchain: true, lightning: true });
	const todos = useAppSelector(todosSelector);
	const pinTodoDone = useAppSelector(pinSelector);
	const showSuggestions = useAppSelector(showSuggestionsSelector);

	const carouselStyle = useMemo(() => ({ width }), [width]);
	const panGestureHandlerProps = useMemo(
		() => ({ activeOffsetX: [-10, 10] }),
		[],
	);

	// reset index on mount
	useFocusEffect(useCallback(() => setIndex(0), []));

	const handleOnPress = useCallback(
		(id: TTodoType): void => {
			if (id === 'backupSeedPhrase') {
				showBottomSheet('backupPrompt');
			}

			if (id === 'lightning') {
				if (balance > 0) {
					navigation.navigate('LightningRoot', { screen: 'Introduction' });
				} else {
					setShowDialog(true);
				}
			}

			if (id === 'lightningSettingUp') {
				navigation.navigate('Settings', { screen: 'Channels' });
			}

			if (id === 'transfer') {
				navigation.navigate('Transfer', { screen: 'Setup' });
			}

			if (id === 'pin') {
				if (!pinTodoDone) {
					showBottomSheet('PINNavigation', { showLaterButton: true });
				} else {
					navigation.navigate('Settings', { screen: 'DisablePin' });
				}
			}

			if (id === 'slashtagsProfile') {
				navigation.navigate('Profile');
			}

			if (id === 'buyBitcoin') {
				navigation.navigate('BuyBitcoin');
			}
		},
		[balance, navigation, pinTodoDone],
	);

	if (!todos.length || !showSuggestions) {
		return <></>;
	}

	const todoItems = todos.map((id) => allTodos.find((todo) => todo.id === id)!);
	// avoid crash when deleting last item
	const defaultIndex = Math.min(index, todos.length - 1);

	return (
		<>
			<Caption13Up style={styles.title} color="gray1">
				{t('suggestions')}
			</Caption13Up>
			<View style={styles.container} testID="Suggestions">
				<Carousel
					style={carouselStyle}
					data={todoItems}
					defaultIndex={defaultIndex}
					loop={false}
					height={170}
					width={170}
					panGestureHandlerProps={panGestureHandlerProps}
					onSnapToItem={setIndex}
					renderItem={({ item }): ReactElement => (
						<SuggestionCard
							id={item.id}
							key={item.id}
							color={item.color}
							image={item.image}
							dismissable={item.dismissable}
							onPress={handleOnPress}
							onClose={removeTodo}
						/>
					)}
				/>
			</View>
			<Dialog
				visible={showDialog}
				title={t('lightning_no_funds_title')}
				description={t('lightning_no_funds_desc')}
				confirmText={t('ok')}
				onConfirm={(): void => {
					setShowDialog(false);
				}}
			/>
		</>
	);
};

const styles = StyleSheet.create({
	title: {
		marginTop: 28,
		marginBottom: 5,
		marginLeft: 16,
	},
	container: {
		marginLeft: 16,
		flexDirection: 'row',
		justifyContent: 'center',
	},
});

export default memo(Suggestions);
