import { useNavigation } from '@react-navigation/native';
import React, { memo, ReactElement, useCallback, useMemo } from 'react';
import {
	GestureResponderEvent,
	StyleProp,
	StyleSheet,
	View,
	ViewStyle,
} from 'react-native';

import { Keyboard } from '../hooks/keyboard';
import { RootNavigationProp } from '../navigation/types';
import { Pressable } from '../styles/components';
import { BackIcon, XIcon } from '../styles/icons';
import { Subtitle, Title } from '../styles/text';

export const HEADER_HEIGHT = 46;

const ActionButton = memo(
	({
		children,
		style,
		testID,
		onPress,
	}: {
		children?: JSX.Element;
		style?: StyleProp<ViewStyle>;
		testID?: string;
		onPress?: (event: GestureResponderEvent) => void;
	}): ReactElement => {
		return (
			<Pressable
				style={({ pressed }): StyleProp<ViewStyle> => [
					styles.action,
					style,
					pressed ? styles.pressed : styles.notPressed,
				]}
				color="transparent"
				hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
				testID={testID}
				onPressIn={onPress}>
				{children}
			</Pressable>
		);
	},
);

const ACTION_WIDTH = 45;

export type NavigationHeaderProps = {
	title?: string;
	icon?: ReactElement;
	showBackButton?: boolean;
	showCloseButton?: boolean;
	actionIcon?: ReactElement;
	size?: 'lg' | 'sm';
	style?: StyleProp<ViewStyle>;
	onBackPress?: () => void;
	onActionPress?: () => void;
};

const NavigationHeader = ({
	title = ' ',
	icon,
	showBackButton = true,
	showCloseButton = true,
	size = 'lg',
	actionIcon,
	style,
	onBackPress,
	onActionPress,
}: NavigationHeaderProps): ReactElement => {
	const navigation = useNavigation<RootNavigationProp>();

	const handleBackPress = useCallback(async () => {
		// make sure Keyboard is closed before navigating back to prevent layout bugs
		await Keyboard.dismiss();

		if (onBackPress) {
			onBackPress();
		} else {
			navigation.goBack();
		}
	}, [navigation, onBackPress]);

	const handleClosePress = useCallback(async () => {
		const parent = navigation.getParent?.();
		const state = navigation.getState?.();
		const routeNames = state?.routes.map((route) => route.name);
		const hasWalletRoute = routeNames?.includes('Wallet');

		// make sure Keyboard is closed before navigating back to prevent layout bugs
		await Keyboard.dismiss();

		if (hasWalletRoute || parent) {
			// for nested navigators, pop to top of parent navigator
			navigation.popTo('Wallet', { screen: 'Wallets' });
		} else {
			navigation.popToTop();
		}
	}, [navigation]);

	const Text = useMemo(() => (size === 'lg' ? Title : Subtitle), [size]);
	const container = useMemo(
		() => [
			styles.container,
			size === 'lg' ? styles.containerLg : styles.containerSm,
			style,
		],
		[size, style],
	);

	const state = navigation.getState?.();
	const parent = navigation.getParent?.();
	const canGoBack = state?.routes.length > 1 || parent;
	const showBack = showBackButton && canGoBack;

	const numberOfActions = useMemo(() => {
		if (actionIcon && showCloseButton) {
			return 2;
		}
		if (showBack || actionIcon || showCloseButton) {
			return 1;
		}
		return 0;
	}, [actionIcon, showBack, showCloseButton]);

	const actionColumn = useMemo(
		() => [
			styles.actionColumn,
			{ marginVertical: size === 'lg' ? -8 : -10 }, // provide a bigger hitbox for action buttons
			{ width: numberOfActions * ACTION_WIDTH },
		],
		[size, numberOfActions],
	);

	return (
		<View style={container}>
			<View style={actionColumn}>
				{showBack && (
					<ActionButton
						style={styles.backButton}
						testID="NavigationBack"
						onPress={handleBackPress}>
						<BackIcon width={20} height={20} />
					</ActionButton>
				)}
			</View>
			<View style={styles.middleColumn} pointerEvents="none">
				<View style={styles.title}>
					{icon && <View style={styles.titleIcon}>{icon}</View>}
					<Text
						style={[styles.titleText, !icon && styles.titleText100]}
						numberOfLines={1}
						ellipsizeMode="middle">
						{title}
					</Text>
				</View>
			</View>
			<View style={actionColumn}>
				{actionIcon && (
					<ActionButton
						style={styles.actionRight}
						testID="NavigationAction"
						onPress={onActionPress}>
						{actionIcon}
					</ActionButton>
				)}
				{showCloseButton && (
					<ActionButton
						style={styles.actionRight}
						testID="NavigationClose"
						onPress={handleClosePress}>
						<XIcon width={24} height={24} />
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
	containerLg: {
		height: HEADER_HEIGHT,
		marginBottom: 16,
	},
	containerSm: {
		marginTop: 2,
		paddingBottom: 10,
	},
	actionColumn: {
		flexDirection: 'row',
	},
	middleColumn: {
		flexGrow: 1,
		flexShrink: 1,
		justifyContent: 'center',
		alignItems: 'center',
		pointerEvents: 'none',
	},
	title: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
	},
	titleIcon: {
		height: 32,
		width: 32,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 16,
	},
	titleText: {
		textAlign: 'center',
	},
	titleText100: {
		// on android title sometimes get shrinked. So if there is no icon, make sure it takes the full width
		// https://github.com/synonymdev/bitkit/issues/1758
		width: '100%',
	},
	action: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		maxWidth: ACTION_WIDTH,
	},
	backButton: {
		paddingLeft: 11,
	},
	actionRight: {
		paddingRight: 11,
	},
	pressed: {
		opacity: 0.6,
	},
	notPressed: {
		opacity: 1,
	},
});

export default memo(NavigationHeader);
