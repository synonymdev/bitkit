import React, { memo, ReactElement, useCallback, useMemo } from 'react';
import {
	View,
	StyleProp,
	StyleSheet,
	ViewStyle,
	GestureResponderEvent,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { Subtitle, Title } from '../styles/text';
import { BackIcon, XIcon } from '../styles/icons';
import { Keyboard } from '../hooks/keyboard';
import { Pressable } from '../styles/components';

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
				onPress={onPress}>
				{children}
			</Pressable>
		);
	},
);

const ACTION_WIDTH = 45;

export type NavigationHeaderProps = {
	title?: string;
	icon?: ReactElement;
	displayBackButton?: boolean;
	navigateBack?: boolean;
	actionIcon?: ReactElement;
	size?: 'lg' | 'sm';
	style?: StyleProp<ViewStyle>;
	onBackPress?: () => void;
	onClosePress?: () => void;
	onActionPress?: () => void;
};

const NavigationHeader = ({
	title = ' ',
	icon,
	displayBackButton = true,
	navigateBack = true,
	size = 'lg',
	actionIcon,
	style,
	onBackPress,
	onClosePress,
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
			size === 'lg' ? styles.containerLg : styles.containerSm,
			style,
		],
		[size, style],
	);

	// TODO: this doesn't have the right navigator
	const showBack = Boolean(displayBackButton && navigation.canGoBack());

	const numberOfActions = useMemo(() => {
		if (actionIcon && onClosePress) {
			return 2;
		} else if (showBack || actionIcon || onClosePress) {
			return 1;
		} else {
			return 0;
		}
	}, [actionIcon, onClosePress, showBack]);

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
				{onClosePress && (
					<ActionButton
						style={styles.actionRight}
						testID="NavigationClose"
						onPress={onClosePress}>
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
