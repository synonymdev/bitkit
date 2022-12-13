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

import { View, Subtitle } from '../styles/components';
import SuggestionCard from './SuggestionCard';
import { allTodos } from '../store/shapes/todos';
import { TTodoType } from '../store/types/todos';
import { removeTodo } from '../store/actions/todos';
import { toggleView } from '../store/actions/ui';
import { useAppSelector } from '../hooks/redux';
import { useBalance } from '../hooks/wallet';
import Dialog from './Dialog';
import type { RootNavigationProp } from '../navigation/types';

const Suggestions = (): ReactElement => {
	const navigation = useNavigation<RootNavigationProp>();
	const { width } = useWindowDimensions();
	const [index, setIndex] = useState(0);
	const [showDialog, setShowDialog] = useState(false);
	const { satoshis: balance } = useBalance({ onchain: true, lightning: true });
	const todos = useAppSelector((state) => state.todos);
	const pinTodoDone = useAppSelector((state) => state.settings.pin);
	const showSuggestions = useAppSelector(
		(state) => state.settings.showSuggestions,
	);

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
				toggleView({
					view: 'backupPrompt',
					data: { isOpen: true },
				});
			}

			if (id === 'lightning') {
				if (balance > 0) {
					navigation.navigate('LightningRoot', { screen: 'Introduction' });
				} else {
					setShowDialog(true);
				}
			}

			if (id === 'lightningSettingUp') {
				navigation.navigate('BlocktankOrders');
			}

			if (id === 'transfer') {
				navigation.navigate('Transfer', { screen: 'Setup' });
			}

			if (id === 'pin') {
				if (!pinTodoDone) {
					toggleView({
						view: 'PINPrompt',
						data: { isOpen: true, showLaterButton: true },
					});
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

	const handleOnClose = useCallback(
		(id: TTodoType): void => {
			const todoIndex = todos.findIndex((todo) => todo === id);
			// avoid crash when deleting last item
			if (todoIndex === todos.length - 1) {
				setIndex(todos.length - 2);
			}
			removeTodo(id);
		},
		[todos],
	);

	if (!todos.length || !showSuggestions) {
		return <></>;
	}

	const todoItems = todos.map((id) => allTodos.find((todo) => todo.id === id)!);

	return (
		<>
			<Subtitle style={styles.title}>Suggestions</Subtitle>
			<View style={styles.container}>
				<Carousel
					style={carouselStyle}
					data={todoItems}
					defaultIndex={index}
					loop={false}
					height={170}
					width={170}
					panGestureHandlerProps={panGestureHandlerProps}
					onSnapToItem={setIndex}
					renderItem={({ item }): ReactElement => (
						<SuggestionCard
							id={item.id}
							key={item.id}
							title={item.title}
							description={item.description}
							color={item.color}
							image={item.image}
							dismissable={item.dismissable}
							onPress={handleOnPress}
							onClose={handleOnClose}
						/>
					)}
				/>
			</View>
			<Dialog
				visible={showDialog}
				title="No Funds Yet"
				description="Before you can set up your instant spending balance, you need to send some on-chain Bitcoin to your wallet."
				confirmText="Ok"
				onConfirm={(): void => {
					setShowDialog(false);
				}}
			/>
		</>
	);
};

const styles = StyleSheet.create({
	title: {
		marginTop: 32,
		marginBottom: 1,
		marginLeft: 16,
	},
	container: {
		marginLeft: 16,
		flexDirection: 'row',
		justifyContent: 'center',
	},
});

export default memo(Suggestions);
