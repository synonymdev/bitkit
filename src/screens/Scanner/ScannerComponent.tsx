import React, { ReactElement, ReactNode, useMemo, useState } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { FadeIn, FadeOut } from 'react-native-reanimated';
import { launchImageLibrary } from 'react-native-image-picker';
import RNQRGenerator from 'rn-qr-generator';
import { useTranslation } from 'react-i18next';

import { AnimatedView, TextInput } from '../../styles/components';
import { BodySSB } from '../../styles/text';
import {
	ClipboardTextIcon,
	PictureIcon,
	FlashlightIcon,
} from '../../styles/icons';
import Camera from '../../components/Camera';
import GradientView from '../../components/CameraGradientView';
import BlurView from '../../components/BlurView';
import Button from '../../components/buttons/Button';
import { __E2E__ } from '../../constants/env';
import Dialog from '../../components/Dialog';

type ScannerComponentProps = {
	children: ReactNode;
	bottomSheet?: boolean;
	onRead: (data: string) => void;
};

const ScannerComponent = ({
	children,
	bottomSheet = false,
	onRead,
}: ScannerComponentProps): ReactElement => {
	const { t } = useTranslation('other');
	const dimensions = useWindowDimensions();
	const [torchMode, setTorchMode] = useState(false);
	const [isChooingFile, setIsChoosingFile] = useState(false);
	const [error, setError] = useState('');
	const [showDebug, setShowDebug] = useState(false);
	const [textDebug, setTextDebug] = useState('');

	const backgroundStyles = useMemo(() => {
		if (!bottomSheet) {
			return {
				...styles.background,
				backgroundColor: 'rgba(0, 0, 0, 0.64)',
				zIndex: 1,
			};
		}

		return {
			...styles.background,
			backgroundColor: 'black',
			zIndex: 1,
		};
	}, [bottomSheet]);

	const showError = (text: string): void => {
		setError(text);
		setTimeout(() => setError(''), 5000);
	};

	const onBarCodeRead = (data: string): void => {
		onRead(data);
	};

	const onPickFile = async (): Promise<void> => {
		setIsChoosingFile(true);
		try {
			const result = await launchImageLibrary({
				// Use 'mixed' so the user can search folders other than "Photos"
				mediaType: 'mixed',
				includeBase64: true,
				quality: 0.1,
			});

			if (result.assets?.[0]) {
				const { uri } = result.assets[0];

				try {
					// Read QR from image
					const { values } = await RNQRGenerator.detect({ uri });

					if (values.length === 0) {
						showError(
							'Sorry. Bitkit wasn’t able to detect a QR code in this image.',
						);
						return;
					}

					onRead(values[0]);
				} catch {
					showError(
						'Sorry. Bitkit wasn’t able to detect a QR code in this image.',
					);
				}
			}
		} catch (err) {
			console.error('Failed to open image file: ', err);
			showError(
				'Sorry. An error occurred when trying to open this image file.',
			);
		} finally {
			setIsChoosingFile(false);
		}
	};

	const onReadDebug = (): void => {
		setShowDebug(true);
	};

	const TopBackground = bottomSheet ? GradientView : BlurView;
	const Background = bottomSheet ? View : BlurView;
	const size = dimensions.width - 16 * 2;

	return (
		<Camera
			bottomSheet={bottomSheet}
			torchMode={torchMode}
			onBarCodeRead={onBarCodeRead}>
			<>
				{children}

				<View style={StyleSheet.absoluteFill}>
					<TopBackground style={backgroundStyles} />
					<View style={styles.maskCenter}>
						<Background style={backgroundStyles} />
						<View style={{ height: size, width: size }}>
							{bottomSheet && <View style={styles.maskRing} />}
							<View style={styles.actionsRow}>
								<Button
									style={styles.actionButton}
									color="white10"
									icon={<PictureIcon width={24} height={24} />}
									disabled={isChooingFile}
									onPress={onPickFile}
								/>
								<Button
									style={styles.actionButton}
									color="white10"
									icon={<FlashlightIcon width={24} height={24} />}
									onPress={(): void => setTorchMode((prevState) => !prevState)}
								/>
							</View>
						</View>
						<Background style={backgroundStyles} />
					</View>
					<Background style={[backgroundStyles, styles.bottom]}>
						<Button
							style={styles.pasteButton}
							icon={<ClipboardTextIcon width={16} height={16} />}
							text={t('qr_paste')}
							size="large"
							onPress={async (): Promise<void> => {
								const url = await Clipboard.getString();
								onRead(url);
							}}
						/>

						{__E2E__ && (
							<Button
								style={styles.pasteButton}
								text="Enter QRCode string"
								size="large"
								testID="ScanPrompt"
								onPress={onReadDebug}
							/>
						)}

						{!!error && (
							<AnimatedView
								color="transparent"
								entering={FadeIn}
								exiting={FadeOut}>
								<BodySSB style={styles.error} color="brand">
									{error}
								</BodySSB>
							</AnimatedView>
						)}
					</Background>
				</View>
				<Dialog
					visible={showDebug}
					visibleTestID="QRDialog"
					title="Debug"
					description="Enter QRCode string"
					onConfirm={(): void => onRead(textDebug)}
					onCancel={(): void => setShowDebug(false)}>
					<TextInput
						value={textDebug}
						testID="QRInput"
						onChangeText={setTextDebug}
					/>
				</Dialog>
			</>
		</Camera>
	);
};

const styles = StyleSheet.create({
	background: {
		flex: 1,
		alignItems: 'center',
		zIndex: -1,
	},
	maskCenter: {
		flexDirection: 'row',
	},
	maskRing: {
		position: 'absolute',
		top: -16,
		bottom: -16,
		left: -16,
		right: -16,
		borderRadius: 30,
		borderWidth: 16,
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
		paddingVertical: 13,
		paddingHorizontal: 13,
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
