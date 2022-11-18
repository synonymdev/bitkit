import React, {
	memo,
	ReactElement,
	useMemo,
	useState,
	useCallback,
} from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { useSelector } from 'react-redux';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Carousel from 'react-native-reanimated-carousel';

import { View, Subtitle } from '../styles/components';
import CarouselCard from './CarouselCard';
import { TTodoType } from '../store/types/todos';
import { toggleView } from '../store/actions/user';
import Store from '../store/types';
import { useBalance } from '../hooks/wallet';
import Dialog from './Dialog';
import type { RootNavigationProp } from '../navigation/types';

const TodoCarousel = (): ReactElement => {
	const navigation = useNavigation<RootNavigationProp>();
	const { width } = useWindowDimensions();
	const [index, setIndex] = useState(0);
	const [showDialog, setShowDialog] = useState(false);
	const todos = useSelector((state: Store) => state.todos);
	const showSuggestions = useSelector(
		(state: Store) => state.settings.showSuggestions,
	);
	const { satoshis: balance } = useBalance({
		onchain: true,
		lightning: true,
	});

	const pinTodoDone = useSelector((state: Store) => state.settings.pin);

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
				// TODO: navigate to Rebalance screen
				navigation.navigate('LightningRoot', {
					screen: 'QuickSetup',
					params: {
						headerTitle: 'Transfer Funds',
					},
				});
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

	if (!todos.length || !showSuggestions) {
		return <></>;
	}

	return (
		<>
			<Subtitle style={styles.title}>Suggestions</Subtitle>
			<View style={styles.container}>
				<Carousel
					style={carouselStyle}
					data={todos}
					defaultIndex={index}
					loop={false}
					height={170}
					width={170}
					panGestureHandlerProps={panGestureHandlerProps}
					onSnapToItem={setIndex}
					renderItem={({ item }): ReactElement => (
						<CarouselCard
							id={item.id}
							key={item.id}
							title={item.title}
							description={item.description}
							color={item.color}
							image={item.image}
							onPress={(): void => handleOnPress(item.id)}
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

export default memo(TodoCarousel);
