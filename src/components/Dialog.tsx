import React, { memo, ReactElement } from 'react';
import {
	StyleSheet,
	Text,
	View,
	Platform,
	TouchableOpacity,
} from 'react-native';
import Modal from 'react-native-modal';
import { useTranslation } from 'react-i18next';

import colors from '../styles/colors';

type DialogProps = {
	visible: boolean;
	title: string;
	description: string;
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
				<View
					style={styles.buttons}
					testID={visible ? visibleTestID : undefined}>
					{onCancel && (
						<TouchableOpacity
							style={[styles.button, styles.buttonLeft]}
							onPress={onCancel}
							testID="DialogCancel">
							<Text style={styles.buttonText}>{cancelText}</Text>
						</TouchableOpacity>
					)}
					{onConfirm && (
						<TouchableOpacity
							style={styles.button}
							onPress={onConfirm}
							testID="DialogConfirm">
							<Text style={styles.buttonText}>{confirmText}</Text>
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
});

export default memo(Dialog);
