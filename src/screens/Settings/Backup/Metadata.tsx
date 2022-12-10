import React, { memo, ReactElement, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text01S } from '../../../styles/components';
import GradientView from '../../../components/GradientView';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GlowImage from '../../../components/GlowImage';
import Button from '../../../components/Button';
import { toggleView } from '../../../store/actions/ui';

const imageSrc = require('../../../assets/illustrations/tag.png');

const Metadata = (): ReactElement => {
	const insets = useSafeAreaInsets();
	const buttonContainerStyles = useMemo(
		() => ({
			...styles.buttonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

	const handleButtonPress = useCallback((): void => {
		toggleView({
			view: 'backupNavigation',
			data: { isOpen: false },
		});
	}, []);

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader title="Wallet Data" />

			<Text01S color="gray1" style={styles.text}>
				Transactions, accounts, contacts and tags will be backed up
				automagically. You can export data from the settings.
			</Text01S>

			<GlowImage image={imageSrc} imageSize={200} />

			<View style={buttonContainerStyles}>
				<Button size="large" text="OK" onPress={handleButtonPress} />
			</View>
		</GradientView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	text: {
		paddingHorizontal: 32,
	},
	buttonContainer: {
		marginTop: 'auto',
		paddingHorizontal: 32,
		width: '100%',
	},
});

export default memo(Metadata);
