import React, { memo, ReactElement, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
	Platform,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import Modal from 'react-native-modal';

import colors from '../styles/colors';
import { IThemeColors } from '../styles/themes';

type DialogProps = {
	visible: boolean;
	title: string;
	description: string;
	children?: ReactElement;
	buttonColor?: keyof IThemeColors;
	cancelText?: string;
	confirmText?: string;
	visibleTestID?: string;
	onCancel?: () => void;
	onConfirm?: () => void;
	onHide?: () => void;
};

const Dialog = ({
	visible,
	title,
	description,
	children,
	buttonColor,
	cancelText,
	confirmText,
	visibleTestID,
	onCancel,
	onConfirm,
	onHide,
}: DialogProps): ReactElement => {
	const { t } = useTranslation('common');

	if (cancelText === undefined) {
		cancelText = t('dialog_cancel');
	}
	if (confirmText === undefined) {
		confirmText = t('ok');
	}

	const buttonStyles = useMemo(() => {
		const color = buttonColor ? colors[buttonColor] : colors.brand;
		return StyleSheet.compose(styles.buttonText, { color });
	}, [buttonColor]);

	return (
		<Modal
			isVisible={visible}
			animationIn="fadeIn"
			animationOut="fadeOut"
			useNativeDriverForBackdrop={true}
			onModalHide={onHide}>
			<View style={styles.content}>
				<View style={styles.text}>
					<Text style={styles.title}>{title}</Text>
					<Text style={styles.description}>{description}</Text>
				</View>

				{children && <View style={styles.children}>{children}</View>}

				<View
					style={styles.buttons}
					testID={visible ? visibleTestID : undefined}>
					{onCancel && (
						<TouchableOpacity
							style={[styles.button, styles.buttonLeft]}
							activeOpacity={0.7}
							testID="DialogCancel"
							onPress={onCancel}>
							<Text style={buttonStyles}>{cancelText}</Text>
						</TouchableOpacity>
					)}
					{onConfirm && (
						<TouchableOpacity
							style={styles.button}
							activeOpacity={0.7}
							testID="DialogConfirm"
							onPress={onConfirm}>
							<Text style={[buttonStyles, {}]}>{confirmText}</Text>
						</TouchableOpacity>
					)}
				</View>
			</View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	content: {
		backgroundColor: 'rgba(49, 49, 49, 1)',
		alignSelf: 'center',
		alignItems: 'center',
		color: colors.white,
		shadowColor: colors.black,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 5,
		...Platform.select({
			ios: {
				borderRadius: 14,
				width: 270,
			},
			android: {
				width: '85%',
			},
		}),
	},
	text: {
		padding: 16,
		width: '100%',
	},
	title: {
		fontWeight: '600',
		fontSize: 17,
		lineHeight: 22,
		letterSpacing: -0.41,
		color: colors.white,
		marginBottom: 5,
		...Platform.select({
			ios: {
				textAlign: 'center',
			},
		}),
	},
	description: {
		fontWeight: '500',
		fontSize: 13,
		lineHeight: 18,
		letterSpacing: -0.08,
		color: colors.white,
		...Platform.select({
			ios: {
				textAlign: 'center',
			},
		}),
	},
	buttons: {
		...Platform.select({
			ios: {
				borderTopWidth: 1,
				borderColor: colors.gray3,
				flexDirection: 'row',
			},
			android: {
				width: '100%',
				flexDirection: 'row',
				justifyContent: 'flex-end',
				paddingHorizontal: 16,
			},
		}),
	},
	button: {
		...Platform.select({
			ios: {
				padding: 16,
				flex: 1,
			},
			android: {
				padding: 16,
			},
		}),
	},
	buttonLeft: {
		...Platform.select({
			ios: {
				borderRightWidth: 1,
				borderColor: colors.gray3,
			},
		}),
	},
	buttonText: {
		fontWeight: '400',
		fontSize: 17,
		lineHeight: 22,
		textAlign: 'center',
		letterSpacing: -0.41,
		color: colors.brand,
	},
	children: {
		padding: 16,
		marginBottom: 8,
		width: '100%',
	},
});

export default memo(Dialog);
