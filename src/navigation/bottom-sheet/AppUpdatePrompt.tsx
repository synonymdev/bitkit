import React, { memo, ReactElement, useEffect, useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { __E2E__ } from '../../constants/env';
import { BodyM } from '../../styles/text';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import BottomSheetNavigationHeader from '../../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../../components/SafeAreaInset';
import Button from '../../components/Button';
import { openURL } from '../../utils/helpers';
import { objectKeys } from '../../utils/objectKeys';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { ignoreAppUpdate } from '../../store/slices/user';
import { closeSheet } from '../../store/slices/ui';
import { showBottomSheet } from '../../store/utils/ui';
import { ignoreAppUpdateTimestampSelector } from '../../store/reselect/user';
import {
	availableUpdateSelector,
	viewControllersSelector,
} from '../../store/reselect/ui';
import {
	useBottomSheetBackPress,
	useSnapPoints,
} from '../../hooks/bottomSheet';

const imageSrc = require('../../assets/illustrations/wand.png');

const ASK_INTERVAL = 1000 * 60 * 60 * 12; // 12h - how long this prompt will be hidden if user taps Later
const CHECK_DELAY = 2500; // how long user needs to stay on Wallets screen before he will see this prompt

const AppUpdatePrompt = ({ enabled }: { enabled: boolean }): ReactElement => {
	const { t } = useTranslation('other');
	const snapPoints = useSnapPoints('medium');
	const dispatch = useAppDispatch();
	const viewControllers = useAppSelector(viewControllersSelector);
	const updateInfo = useAppSelector(availableUpdateSelector);
	const ignoreTimestamp = useAppSelector(ignoreAppUpdateTimestampSelector);

	useBottomSheetBackPress('appUpdatePrompt');

	const anyBottomSheetIsOpen = useMemo(() => {
		const viewControllerKeys = objectKeys(viewControllers);
		return viewControllerKeys
			.filter((view) => view !== 'appUpdatePrompt')
			.some((view) => viewControllers[view].isOpen);
	}, [viewControllers]);

	// if optional app update available
	// and user has not seen this prompt for ASK_INTERVAL
	// and no other bottom-sheets are shown
	// and user on "Wallets" screen for CHECK_DELAY
	const shouldShowBottomSheet = useMemo(() => {
		const isTimeoutOver = Number(new Date()) - ignoreTimestamp > ASK_INTERVAL;
		return (
			enabled &&
			!__E2E__ &&
			updateInfo !== null &&
			!updateInfo.critical &&
			isTimeoutOver &&
			!anyBottomSheetIsOpen
		);
	}, [enabled, updateInfo, ignoreTimestamp, anyBottomSheetIsOpen]);

	useEffect(() => {
		if (!shouldShowBottomSheet) {
			return;
		}

		const timer = setTimeout(() => {
			showBottomSheet('appUpdatePrompt');
		}, CHECK_DELAY);

		return (): void => {
			clearTimeout(timer);
		};
	}, [shouldShowBottomSheet]);

	const onClose = (): void => {
		dispatch(ignoreAppUpdate());
	};

	const onCancel = (): void => {
		dispatch(ignoreAppUpdate());
		dispatch(closeSheet('appUpdatePrompt'));
	};

	const onUpdate = async (): Promise<void> => {
		dispatch(ignoreAppUpdate());
		await openURL(updateInfo?.url!);
		dispatch(closeSheet('appUpdatePrompt'));
	};

	return (
		<BottomSheetWrapper
			view="appUpdatePrompt"
			snapPoints={snapPoints}
			backdrop={true}
			onClose={onClose}>
			<View style={styles.root}>
				<BottomSheetNavigationHeader
					title={t('update_title')}
					displayBackButton={false}
				/>
				<BodyM color="secondary">{t('update_text')}</BodyM>

				<View style={styles.imageContainer}>
					<Image style={styles.image} source={imageSrc} />
				</View>

				<View style={styles.buttonContainer}>
					<Button
						style={styles.button}
						variant="secondary"
						size="large"
						text={t('cancel')}
						onPress={onCancel}
					/>
					<Button
						style={styles.button}
						size="large"
						text={t('update_button')}
						onPress={onUpdate}
					/>
				</View>
				<SafeAreaInset type="bottom" minPadding={16} />
			</View>
		</BottomSheetWrapper>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
		paddingHorizontal: 16,
	},
	imageContainer: {
		alignItems: 'center',
		marginTop: 'auto',
		aspectRatio: 1,
	},
	image: {
		flex: 1,
		resizeMode: 'contain',
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 'auto',
		gap: 16,
	},
	button: {
		flex: 1,
	},
});

export default memo(AppUpdatePrompt);
