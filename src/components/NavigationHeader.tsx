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

import {
	BackIcon,
	PlusIcon,
	Subtitle,
	Title,
	XIcon,
} from '../styles/components';

const ActionButton = memo(
	({
		children,
		onPress,
	}: {
		children: JSX.Element;
		onPress: (event: GestureResponderEvent) => void;
	}): ReactElement => {
		return (
			<TouchableOpacity style={styles.action} onPress={onPress}>
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

	const handleBackPress = useCallback(() => {
		onBackPress && onBackPress();
		if (navigateBack) {
			navigation.goBack();
		}
		//eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

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
					<ActionButton onPress={handleBackPress}>
						<BackIcon width={20} height={20} />
					</ActionButton>
				)}
			</View>
			<View style={styles.middleColumn}>
				<Text style={styles.title}>{title}</Text>
			</View>
			<View style={[styles.rightColumn, buttonOffset]}>
				{actionIcon && onActionPress && (
					<ActionButton onPress={onActionPress}>{actionIcon}</ActionButton>
				)}
				{onClosePress && (
					<ActionButton onPress={onClosePress}>
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
	},
	action: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
	},
});

export default memo(NavigationHeader);
