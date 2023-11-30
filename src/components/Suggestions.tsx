import React, {
	ReactElement,
	useMemo,
	useState,
	useCallback,
	useEffect,
} from 'react';
import { useTranslation } from 'react-i18next';
import Carousel from 'react-native-reanimated-carousel';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { Caption13Up } from '../styles/text';
import { View as ThemedView } from '../styles/components';
import { showToast } from '../utils/notifications';
import { TTodoType } from '../store/types/todos';
import { channelsNotificationsShown, hideTodo } from '../store/actions/todos';
import { showBottomSheet } from '../store/actions/ui';
import {
	newChannelsNotificationsSelector,
	todosFullSelector,
} from '../store/reselect/todos';
import { lightningSettingUpStepSelector } from '../store/reselect/user';
import {
	pinSelector,
	showSuggestionsSelector,
} from '../store/reselect/settings';
import type { RootNavigationProp } from '../navigation/types';
import { useBalance } from '../hooks/wallet';
import { useAppSelector } from '../hooks/redux';
import Dialog from './Dialog';
import SuggestionCard from './SuggestionCard';

const Suggestions = (): ReactElement => {
	const { t } = useTranslation('cards');
	const navigation = useNavigation<RootNavigationProp>();
	const { width } = useWindowDimensions();
	const { onchainBalance } = useBalance();
	const pinTodoDone = useAppSelector(pinSelector);
	const suggestions = useAppSelector(todosFullSelector);
	const showSuggestions = useAppSelector(showSuggestionsSelector);
	const lightningSettingUpStep = useAppSelector(lightningSettingUpStepSelector);
	const newChannels = useAppSelector(newChannelsNotificationsSelector);
	const [index, setIndex] = useState(0);
	const [showDialog, setShowDialog] = useState(false);

	// show toast when new channels are opened and hide the notification
	useEffect(() => {
		if (newChannels.length === 0) {
			return;
		}

		showToast({
			type: 'success',
			title: t('lightning:channel_opened_title'),
			description: t('lightning:channel_opened_msg'),
		});

		const timer = setTimeout(() => {
			channelsNotificationsShown(newChannels);
		}, 4000);

		return () => clearTimeout(timer);
	}, [t, newChannels]);

	const panGestureHandlerProps = useMemo(
		() => ({ activeOffsetX: [-10, 10] }),
		[],
	);

	// reset index on focus
	useFocusEffect(useCallback(() => setIndex(0), []));

	const handleOnPress = useCallback(
		(id: TTodoType): void => {
			if (id === 'backupSeedPhrase') {
				showBottomSheet('backupPrompt');
			}

			if (id === 'lightning') {
				if (onchainBalance > 0) {
					navigation.navigate('LightningRoot', { screen: 'Introduction' });
				} else {
					setShowDialog(true);
				}
			}

			if (id === 'lightningSettingUp') {
				navigation.navigate('LightningRoot', { screen: 'SettingUp' });
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

			if (id === 'btFailed') {
				navigation.navigate('Settings', {
					screen: 'Channels',
					params: { showClosed: true },
				});
			}
		},
		[onchainBalance, navigation, pinTodoDone],
	);

	const handleRenderItem = useCallback(
		({ item }): ReactElement => {
			const title = t(`${item.id}.title`);
			let description = t(`${item.id}.description`);

			if (item.id === 'lightningSettingUp') {
				description = t(`${item.id}.description${lightningSettingUpStep}`);
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
					onClose={hideTodo}
				/>
			);
		},
		[t, handleOnPress, lightningSettingUpStep],
	);

	if (!suggestions.length || !showSuggestions) {
		return <></>;
	}

	// avoid crash when deleting last item
	const defaultIndex = Math.min(index, suggestions.length - 1);

	return (
		<>
			<Caption13Up style={styles.title} color="gray1">
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
		marginTop: 25,
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
