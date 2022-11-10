import React, { ReactElement, useState } from 'react';
import {
	View,
	TouchableOpacity,
	StyleSheet,
	useWindowDimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import Clipboard from '@react-native-clipboard/clipboard';
import { FadeIn, FadeOut } from 'react-native-reanimated';
import { launchImageLibrary } from 'react-native-image-picker';
import RNQRGenerator from 'rn-qr-generator';
import { Result } from '@synonymdev/result';

import {
	ClipboardTextIcon,
	PictureIcon,
	FlashlightIcon,
	AnimatedView,
	Text02M,
} from '../../styles/components';
import useColors from '../../hooks/colors';
import Camera from '../../components/Camera';
import BlurView from '../../components/BlurView';
import { decodeQRData, QRData } from '../../utils/scanner';
import Store from '../../store/types';
import Button from '../../components/Button';

type ScannerComponentProps = {
	onRead: (data: string | Result<QRData[]>) => void;
	children: JSX.Element | JSX.Element[];
	shouldDecode?: boolean;
};

const ScannerComponent = ({
	onRead,
	shouldDecode = true,
	children,
}: ScannerComponentProps): ReactElement => {
	const { white08, white5 } = useColors();
	const dimensions = useWindowDimensions();
	const [torchMode, setTorchMode] = useState(false);
	const [error, setError] = useState('');

	const selectedNetwork = useSelector(
		(state: Store) => state.wallet.selectedNetwork,
	);

	const showError = (text: string): void => {
		setError(text);
		setTimeout(() => setError(''), 5000);
	};

	const onBarCodeRead = (data): void => {
		onRead(data);
	};

	const onPickFile = async (): Promise<void> => {
		try {
			const result = await launchImageLibrary({
				// Use 'mixed' so the user can search folders other than "Photos"
				mediaType: 'mixed',
				includeBase64: true,
				quality: 0.1,
			});

			if (result.assets?.[0]) {
				const { uri } = result.assets?.[0];

				try {
					// Read QR from image
					const { values } = await RNQRGenerator.detect({ uri });

					if (values.length === 0) {
						showError(
							'Sorry. Bitkit wasn’t able to detect a QR code in this image.',
						);
						return;
					}

					if (shouldDecode) {
						const res = await decodeQRData(values[0], selectedNetwork);
						onRead(res);
					} else {
						// Leave handling data up to the component
						onRead(values[0]);
					}
				} catch {
					showError(
						'Sorry. Bitkit wasn’t able to detect a QR code in this image.',
					);
				}
			}
		} catch (err) {
			console.error('Failed to open image file: ', err);
			showError('Sorry. An error occured when trying to open this image file.');
		}
	};

	return (
		<Camera onBarCodeRead={onBarCodeRead} torchMode={torchMode}>
			<>
				{children}

				<View style={StyleSheet.absoluteFill}>
					<BlurView style={styles.mask} />
					<View style={styles.maskCenter}>
						<BlurView style={styles.mask} />
						<View
							style={{
								height: dimensions.height / 2.4,
								width: dimensions.width - 16 * 2,
							}}>
							<View style={styles.actionsRow}>
								<TouchableOpacity
									style={[styles.actionButton, { backgroundColor: white08 }]}
									activeOpacity={1}
									onPress={onPickFile}>
									<PictureIcon width={24} height={24} />
								</TouchableOpacity>
								<TouchableOpacity
									style={[
										styles.actionButton,
										{ backgroundColor: torchMode ? white5 : white08 },
									]}
									activeOpacity={1}
									onPress={(): void => setTorchMode((prevState) => !prevState)}>
									<FlashlightIcon width={24} height={24} />
								</TouchableOpacity>
							</View>
						</View>
						<BlurView style={styles.mask} />
					</View>
					<BlurView style={[styles.mask, styles.bottom]}>
						<Button
							style={styles.pasteButton}
							icon={<ClipboardTextIcon width={16} height={16} />}
							text="Paste QR Code"
							size="large"
							onPress={async (): Promise<void> => {
								let url = await Clipboard.getString();
								onRead(url);
							}}
						/>

						{!!error && (
							<AnimatedView
								color="transparent"
								entering={FadeIn}
								exiting={FadeOut}>
								<Text02M style={styles.error} color="brand">
									{error}
								</Text02M>
							</AnimatedView>
						)}
					</BlurView>
				</View>
			</>
		</Camera>
	);
};

const styles = StyleSheet.create({
	mask: {
		backgroundColor: 'rgba(0, 0, 0, 0.64)',
		flex: 1,
		alignItems: 'center',
	},
	maskCenter: {
		flexDirection: 'row',
	},
	actionsRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		padding: 16,
	},
	actionButton: {
		alignItems: 'center',
		justifyContent: 'center',
		minHeight: 32,
		minWidth: 32,
		borderRadius: 50,
		padding: 13,
	},
	bottom: {
		paddingHorizontal: 16,
	},
	pasteButton: {
		marginHorizontal: 16,
		marginTop: 16,
		width: '100%',
	},
	error: {
		marginHorizontal: 16,
		marginTop: 32,
		textAlign: 'center',
	},
});

export default ScannerComponent;
