import React, {
	ReactElement,
	useMemo,
	useState,
	useCallback,
	useEffect,
} from 'react';
import { useTranslation } from 'react-i18next';
import Carousel from 'react-native-reanimated-carousel';
import { StyleSheet, useWindowDimensions, Share } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { Caption13Up } from '../styles/text';
import { View as ThemedView } from '../styles/components';
import SuggestionCard from './SuggestionCard';
import { ITodo, TTodoType } from '../store/types/todos';
import { channelsNotificationsShown, hideTodo } from '../store/slices/todos';
import { showBottomSheet } from '../store/utils/ui';
import { pinSelector } from '../store/reselect/settings';
import {
	quickpayIntroSeenSelector,
	transferIntroSeenSelector,
} from '../store/reselect/user';
import {
	newChannelsNotificationsSelector,
	todosFullSelector,
} from '../store/reselect/todos';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import type { RootNavigationProp } from '../navigation/types';
import { appName, appStoreUrl, playStoreUrl } from '../constants/app';
import { getDurationForBlocks } from '../utils/helpers';

const Suggestions = (): ReactElement => {
	const { t } = useTranslation('cards');
	const navigation = useNavigation<RootNavigationProp>();
	const { width } = useWindowDimensions();
	const dispatch = useAppDispatch();
	const pinTodoDone = useAppSelector(pinSelector);
	const quickpayIntroSeen = useAppSelector(quickpayIntroSeenSelector);
	const suggestions = useAppSelector(todosFullSelector);
	const newChannels = useAppSelector(newChannelsNotificationsSelector);
	const transferIntroSeen = useAppSelector(transferIntroSeenSelector);
	const [index, setIndex] = useState(0);

	// this code is needed in order to avoid flashing wrong balance on channel open
	// TODO: try to move/remove this
	useEffect(() => {
		if (newChannels.length === 0) {
			return;
		}

		const timer = setTimeout(() => {
			const ids = newChannels.map((c) => c.channel_id);
			dispatch(channelsNotificationsShown(ids));
		}, 4000);

		return (): void => clearTimeout(timer);
	}, [newChannels, dispatch]);

	const panGestureHandlerProps = useMemo(
		() => ({ activeOffsetX: [-10, 10] }),
		[],
	);

	// reset index on focus
	useFocusEffect(useCallback(() => setIndex(0), []));

	const onShare = useCallback(async (): Promise<void> => {
		await Share.share({
			title: appName,
			message: t('settings:about.shareText', { playStoreUrl, appStoreUrl }),
		});
	}, [t]);

	const handleOnPress = useCallback(
		(id: TTodoType): void => {
			if (id === 'backupSeedPhrase') {
				showBottomSheet('backupPrompt');
			}

			if (id === 'lightning') {
				if (transferIntroSeen) {
					navigation.navigate('TransferRoot', { screen: 'Funding' });
				} else {
					navigation.navigate('TransferRoot', { screen: 'TransferIntro' });
				}
			}

			if (id === 'lightningSettingUp') {
				navigation.navigate('TransferRoot', { screen: 'SettingUp' });
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

			if (id === 'invite') {
				onShare();
			}

			if (id === 'quickpay') {
				if (quickpayIntroSeen) {
					navigation.navigate('Settings', { screen: 'QuickpaySettings' });
				} else {
					navigation.navigate('Settings', { screen: 'QuickpayIntro' });
				}
			}

			if (id === 'support') {
				navigation.navigate('Settings', { screen: 'SupportSettings' });
			}

			if (id === 'btFailed') {
				navigation.navigate('Settings', {
					screen: 'Channels',
					params: { showClosed: true },
				});
			}
		},
		[navigation, transferIntroSeen, quickpayIntroSeen, pinTodoDone, onShare],
	);

	const handleRenderItem = useCallback(
		// eslint-disable-next-line react/no-unused-prop-types
		({ item }: { item: ITodo }): ReactElement => {
			const title = t(`${item.id}.title`);
			let description = t(`${item.id}.description`);

			if (item.confirmsIn) {
				const duration = getDurationForBlocks(item.confirmsIn);
				description = t(`${item.id}.description`, { duration });
			}

			if (item.id === 'lightningSettingUp') {
				description = t(`${item.id}.description`);
			}

			return (
				<SuggestionCard
					id={item.id}
					key={item.id}
					color={item.color}
					image={item.image}
					title={title}
					description={description}
					dismissable={item.dismissable}
					onPress={handleOnPress}
					onClose={(id): void => {
						dispatch(hideTodo(id));
					}}
				/>
			);
		},
		[t, handleOnPress, dispatch],
	);

	if (!suggestions.length) {
		return <></>;
	}

	// avoid crash when deleting last item
	const defaultIndex = Math.min(index, suggestions.length - 1);

	return (
		<>
			<Caption13Up
				style={styles.title}
				color="secondary"
				testID="SuggestionsLabel">
				{t('suggestions')}
			</Caption13Up>
			<ThemedView style={styles.container} testID="Suggestions">
				<Carousel
					style={[styles.carousel, { width }]}
					data={suggestions}
					defaultIndex={defaultIndex}
					loop={false}
					height={170}
					width={167}
					panGestureHandlerProps={panGestureHandlerProps}
					onSnapToItem={setIndex}
					renderItem={handleRenderItem}
				/>
			</ThemedView>
		</>
	);
};

const styles = StyleSheet.create({
	title: {
		marginTop: 32,
		marginBottom: 6,
		marginLeft: 16,
	},
	container: {
		marginLeft: 16,
		flexDirection: 'row',
		justifyContent: 'center',
	},
	carousel: {
		overflow: 'visible',
	},
});

export default Suggestions;
