import Clipboard from '@react-native-clipboard/clipboard';
import React, { ReactElement, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Platform, StyleSheet, View } from 'react-native';

import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import ContactImage from '../../../components/ContactImage';
import GradientView from '../../../components/GradientView';
import SafeAreaInset from '../../../components/SafeAreaInset';
import useColors from '../../../hooks/colors';
import { useAppSelector } from '../../../hooks/redux';
import { useScreenSize } from '../../../hooks/screen';
import type { SendScreenProps } from '../../../navigation/types';
import { lastPaidSelector } from '../../../store/reselect/slashtags';
import { selectedNetworkSelector } from '../../../store/reselect/wallet';
import colors from '../../../styles/colors';
import { Pressable } from '../../../styles/components';
import {
	ClipboardTextIcon,
	PencilIcon,
	ScanIcon,
	UsersIcon,
} from '../../../styles/icons';
import { BodyMSB, Caption13Up } from '../../../styles/text';
import { showToast } from '../../../utils/notifications';
import { processUri } from '../../../utils/scanner/scanner';

const imageSrc = require('../../../assets/illustrations/coin-stack-logo.png');

const Button = ({
	icon,
	text,
	actions,
	testID,
	onPress,
}: {
	icon: ReactElement;
	text: string;
	actions?: ReactElement;
	testID?: string;
	onPress: () => void;
}): ReactElement => {
	const { white16 } = useColors();

	return (
		<Pressable
			style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
			android_ripple={{ color: white16 }}
			testID={testID}
			onPress={onPress}>
			<View style={styles.buttonIcon}>{icon}</View>
			<BodyMSB color="white">{text}</BodyMSB>
			<View style={styles.buttonActions}>{actions}</View>
		</Pressable>
	);
};

const Recipient = ({
	navigation,
}: SendScreenProps<'Recipient'>): ReactElement => {
	const { t } = useTranslation('wallet');
	const { isSmallScreen } = useScreenSize();
	const selectedNetwork = useAppSelector(selectedNetworkSelector);
	const lastPaidContacts = useAppSelector(lastPaidSelector);

	const onOpenContacts = (): void => {
		navigation.navigate('Contacts');
	};

	const onSendToContact = async (uri: string): Promise<void> => {
		await processUri({
			uri,
			source: 'send',
			selectedNetwork,
		});
	};

	const onPasteInvoice = async (): Promise<void> => {
		const data = await Clipboard.getString();
		const text = data.trim();

		if (!text) {
			showToast({
				type: 'warning',
				title: t('send_clipboard_empty_title'),
				description: t('send_clipboard_empty_text'),
			});
			return;
		}

		// parse data, update transaction and navigate to next screen
		await processUri({
			uri: text,
			source: 'send',
			selectedNetwork,
		});
	};

	const onManual = (): void => {
		navigation.navigate('Address');
	};

	const onOpenScanner = (): void => {
		navigation.navigate('Scanner');
	};

	return (
		<GradientView style={styles.root}>
			<BottomSheetNavigationHeader
				title={t('send_bitcoin')}
				showBackButton={false}
			/>
			<View style={styles.content}>
				<Caption13Up color="secondary" style={styles.label} testID="Caption">
					{t('send_to')}
				</Caption13Up>

				<View>
					<Button
						icon={<UsersIcon color="brand" width={32} height={30} />}
						text={t('recipient_contact')}
						actions={
							<View style={styles.contacts}>
								{lastPaidContacts.map((url) => (
									<Pressable
										key={url}
										color="transparent"
										onPress={(): Promise<void> => onSendToContact(url)}>
										<ContactImage style={styles.contact} url={url} size={32} />
									</Pressable>
								))}
							</View>
						}
						testID="RecipientContact"
						onPress={onOpenContacts}
					/>
					<Button
						icon={<ClipboardTextIcon color="brand" width={32} height={30} />}
						text={t('recipient_invoice')}
						testID="RecipientInvoice"
						onPress={onPasteInvoice}
					/>
					<Button
						icon={<PencilIcon color="brand" width={32} height={22} />}
						text={t('recipient_manual')}
						testID="RecipientManual"
						onPress={onManual}
					/>
					<Button
						icon={<ScanIcon color="brand" width={32} height={22} />}
						text={t('recipient_scan')}
						testID="RecipientScan"
						onPress={onOpenScanner}
					/>
				</View>

				{!isSmallScreen && (
					<View style={styles.bottom}>
						<View style={styles.imageContainer}>
							<Image style={styles.image} source={imageSrc} />
						</View>
					</View>
				)}
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</GradientView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
	},
	label: {
		marginBottom: 8,
	},
	contacts: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	contact: {
		marginLeft: 16,
	},
	bottom: {
		// backgroundColor: 'red',
		position: 'relative',
		marginTop: 'auto',
		flex: 1,
		justifyContent: 'flex-end',
	},
	imageContainer: {
		alignItems: 'center',
		alignSelf: 'center',
		marginTop: 'auto',
		aspectRatio: 1,
		width: 256,
		zIndex: -1,
	},
	image: {
		flex: 1,
		resizeMode: 'contain',
	},
	button: {
		backgroundColor: colors.white06,
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: 8,
		padding: 24,
		marginBottom: 8,
		height: 80,
	},
	buttonPressed: {
		...Platform.select({
			ios: {
				backgroundColor: colors.white16,
			},
		}),
	},
	buttonIcon: {
		marginRight: 16,
	},
	buttonActions: {
		marginLeft: 'auto',
	},
});

export default memo(Recipient);
