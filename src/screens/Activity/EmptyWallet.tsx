import React, { memo, ReactElement, useMemo, useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
	StyleSheet,
	TouchableOpacity,
	View,
	useWindowDimensions,
} from 'react-native';
import { Trans, useTranslation } from 'react-i18next';

import { Headline } from '../../styles/text';
import { XIcon } from '../../styles/icons';
import { updateSettings } from '../../store/actions/settings';
import Arrow from '../../assets/dotted-arrow.svg';

const EmptyWallet = (): ReactElement => {
	const { height } = useWindowDimensions();
	const insets = useSafeAreaInsets();
	const [showClose, setShowClose] = useState(false);
	const { t } = useTranslation('onboarding');

	useEffect(() => {
		// delay showning close button. this is handy for e2e testing
		setTimeout(() => setShowClose(true), 2000);
	}, []);

	const [root, arrowContainer, arrow] = useMemo(() => {
		return [
			[styles.root, { marginBottom: 110 + insets.bottom }],
			[styles.arrowContainer, { marginTop: height * 0.04 }],
			{ maxHeight: height * 0.28 },
		];
	}, [height, insets.bottom]);

	const handleHide = (): void => {
		updateSettings({ hideOnboardingMessage: true });
	};

	return (
		<View style={root} testID="ToGetStarted">
			{showClose && (
				<TouchableOpacity
					style={styles.closeButton}
					onPress={handleHide}
					testID="ToGetStartedClose">
					<XIcon color="gray1" width={16} height={16} />
				</TouchableOpacity>
			)}

			<Headline>
				<Trans
					t={t}
					i18nKey="empty_wallet"
					components={{ brand: <Headline color="brand" /> }}
				/>
			</Headline>

			<View style={arrowContainer}>
				<View style={styles.spaceLeft} />
				<Arrow style={arrow} />
				<View style={styles.spaceRight} />
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		paddingHorizontal: 16,
		position: 'relative',
		marginTop: 'auto',
	},
	closeButton: {
		height: 30,
		width: 30,
		alignItems: 'center',
		justifyContent: 'center',
		position: 'absolute',
		top: -10,
		right: 10,
		zIndex: 1,
	},
	arrowContainer: {
		flexDirection: 'row',
	},
	spaceLeft: {
		flex: 7,
	},
	spaceRight: {
		flex: 3,
	},
});

export default memo(EmptyWallet);
