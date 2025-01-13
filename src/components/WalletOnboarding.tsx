import React, { memo, ReactElement, useMemo, useState, useEffect } from 'react';
import {
	LayoutChangeEvent,
	StyleProp,
	StyleSheet,
	TouchableOpacity,
	View,
	ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Arrow from '../assets/dotted-arrow.svg';
import { __E2E__ } from '../constants/env';
import { XIcon } from '../styles/icons';
import { Display } from '../styles/text';

const WalletOnboarding = ({
	text,
	style,
	onHide,
}: {
	text: string | ReactElement;
	style?: StyleProp<ViewStyle>;
	onHide?: () => void;
}): ReactElement => {
	const insets = useSafeAreaInsets();
	const [showClose, setShowClose] = useState(!__E2E__);
	const [rootWidth, setRootWidth] = useState(0);
	const [textWidth, setTextWidth] = useState(0);

	useEffect(() => {
		if (__E2E__) {
			// delay showing close button. this is handy for e2e testing
			setTimeout(() => setShowClose(true), 2000);
		}
	}, []);

	const rootStyles = useMemo(() => {
		return [styles.root, { marginBottom: 105 + insets.bottom }];
	}, [insets.bottom]);

	const handleTextLayout = (e: LayoutChangeEvent): void => {
		if (!textWidth) {
			setTextWidth(e.nativeEvent.layout.width);
		}
	};

	const handleRootLayout = (e: LayoutChangeEvent): void => {
		if (!rootWidth) {
			setRootWidth(e.nativeEvent.layout.width);
		}
	};

	// if the text is too long, move the arrow below the text
	const arrowAbsolute = rootWidth && textWidth && rootWidth - textWidth < 80;

	return (
		<View
			onLayout={handleRootLayout}
			style={[rootStyles, style]}
			testID="WalletOnboarding">
			{showClose && onHide && (
				<TouchableOpacity
					style={styles.closeButton}
					activeOpacity={0.7}
					testID="WalletOnboardingClose"
					onPress={onHide}>
					<XIcon color="secondary" width={16} height={16} />
				</TouchableOpacity>
			)}
			<Display style={styles.text} onLayout={handleTextLayout}>
				{text}
			</Display>
			<Arrow style={arrowAbsolute ? styles.arrowAbsolute : styles.arrow} />
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		marginTop: 'auto',
	},
	closeButton: {
		height: 40,
		width: 40,
		alignItems: 'center',
		justifyContent: 'center',
		position: 'absolute',
		top: -15,
		right: 5,
		zIndex: 1,
	},
	text: {
		zIndex: 101, // above arrow
	},
	arrow: {
		marginBottom: 10,
		marginLeft: -10,
	},
	arrowAbsolute: {
		position: 'absolute',
		bottom: 10,
		right: 80,
		zIndex: 100, // below text
	},
});

export default memo(WalletOnboarding);
