import React, { memo, ReactElement, useCallback, useMemo } from 'react';
import {
	View,
	TouchableOpacity,
	StyleProp,
	StyleSheet,
	ViewStyle,
	GestureResponderEvent,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { Subtitle, Title } from '../styles/text';
import { BackIcon, PlusIcon, XIcon } from '../styles/icons';
import { Keyboard } from '../hooks/keyboard';

const ActionButton = memo(
	({
		children,
		onPress,
		testID,
	}: {
		children: JSX.Element;
		onPress?: (event: GestureResponderEvent) => void;
		testID?: string;
	}): ReactElement => {
		return (
			<TouchableOpacity
				style={styles.action}
				activeOpacity={onPress ? 0.6 : 1}
				onPress={onPress}
				testID={testID}>
				{children}
			</TouchableOpacity>
		);
	},
);

export type NavigationHeaderProps = {
	title?: string;
	displayBackButton?: boolean;
	navigateBack?: boolean;
	actionIcon?: ReactElement;
	size?: 'lg' | 'sm';
	style?: StyleProp<ViewStyle>;
	onBackPress?: () => void;
	onClosePress?: () => void;
	onAddPress?: () => void;
	onActionPress?: () => void;
};

const NavigationHeader = ({
	title = ' ',
	displayBackButton = true,
	navigateBack = true,
	size = 'lg',
	actionIcon,
	style,
	onBackPress,
	onClosePress,
	onAddPress,
	onActionPress,
}: NavigationHeaderProps): ReactElement => {
	const navigation = useNavigation<any>();

	const handleBackPress = useCallback(async () => {
		onBackPress?.();
		if (navigateBack) {
			// make sure Keyboard is closed before navigating back to prevent layout bugs
			await Keyboard.dismiss();
			navigation.goBack();
		}
	}, [navigation, navigateBack, onBackPress]);

	const Text = useMemo(() => (size === 'lg' ? Title : Subtitle), [size]);
	const container = useMemo(
		() => [
			styles.container,
			size === 'lg'
				? { marginTop: 17, paddingBottom: 35 }
				: { marginTop: 2, paddingBottom: 10 },
		],
		[size],
	);

	// provide a bigger hitbox for action buttons
	const buttonOffset = useMemo(
		() => [size === 'lg' ? { top: -8 } : { top: -10 }],
		[size],
	);

	return (
		<View style={[container, style]}>
			<View style={[styles.leftColumn, buttonOffset]}>
				{displayBackButton && (
					<ActionButton onPress={handleBackPress} testID="NavigationBack">
						<BackIcon width={20} height={20} />
					</ActionButton>
				)}
			</View>
			<View style={styles.middleColumn} testID="NavigationTitle">
				<Text style={styles.title} numberOfLines={1} ellipsizeMode="middle">
					{title}
				</Text>
			</View>
			<View style={[styles.rightColumn, buttonOffset]}>
				{actionIcon && (
					<ActionButton onPress={onActionPress}>{actionIcon}</ActionButton>
				)}
				{onClosePress && (
					<ActionButton onPress={onClosePress} testID="NavigationClose">
						<XIcon width={24} height={24} />
					</ActionButton>
				)}
				{onAddPress && (
					<ActionButton onPress={onAddPress}>
						<PlusIcon width={24} height={24} />
					</ActionButton>
				)}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
	},
	leftColumn: {
		position: 'absolute',
		left: 0,
		height: 42,
		width: 50,
		justifyContent: 'center',
		zIndex: 1,
	},
	middleColumn: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	rightColumn: {
		position: 'absolute',
		right: 0,
		height: 42,
		width: 50,
		justifyContent: 'center',
		alignItems: 'flex-end',
		zIndex: 1,
	},
	title: {
		textAlign: 'center',
		marginHorizontal: 42,
	},
	action: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
	},
});

export default memo(NavigationHeader);
