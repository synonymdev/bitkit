import React, { ReactElement, ReactNode, useMemo, useState } from 'react';
import {
	View,
	TouchableOpacity,
	StyleSheet,
	useWindowDimensions,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { FadeIn, FadeOut } from 'react-native-reanimated';
import { launchImageLibrary } from 'react-native-image-picker';
import RNQRGenerator from 'rn-qr-generator';
import { useTranslation } from 'react-i18next';

import { AnimatedView } from '../../styles/components';
import { Text02M } from '../../styles/text';
import {
	ClipboardTextIcon,
	PictureIcon,
	FlashlightIcon,
} from '../../styles/icons';
import useColors from '../../hooks/colors';
import Camera from '../../components/Camera';
import GradientView from '../../components/GradientView';
import BlurView from '../../components/BlurView';
import Button from '../../components/Button';

type ScannerComponentProps = {
	children: ReactNode;
	transparent?: boolean;
	onRead: (data: string) => void;
};

const ScannerComponent = ({
	children,
	transparent = true,
	onRead,
}: ScannerComponentProps): ReactElement => {
	const { t } = useTranslation('other');
	const { white08, white5 } = useColors();
	const dimensions = useWindowDimensions();
	const [torchMode, setTorchMode] = useState(false);
	const [isChooingFile, setIsChoosingFile] = useState(false);
	const [error, setError] = useState('');

	const backgroundStyles = useMemo(() => {
		if (transparent) {
			return {
				...styles.background,
				backgroundColor: 'rgba(0, 0, 0, 0.64)',
			};
		}

		return {
			...styles.background,
			backgroundColor: 'black',
		};
	}, [transparent]);

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

					onRead(values[0]);
				} catch {
					showError(
						'Sorry. Bitkit wasn’t able to detect a QR code in this image.',
					);
				}
			}
		} catch (err) {
			console.error('Failed to open image file: ', err);
			showError('Sorry. An error occured when trying to open this image file.');
		} finally {
			setIsChoosingFile(false);
		}
	};

	const TopBackground = transparent ? BlurView : GradientView;
	const Background = transparent ? BlurView : View;

	return (
		<Camera onBarCodeRead={onBarCodeRead} torchMode={torchMode}>
			<>
				{children}

				<View style={StyleSheet.absoluteFill}>
					<TopBackground style={backgroundStyles} />
					<View style={styles.maskCenter}>
						<Background style={backgroundStyles} />
						<View
							style={{
								height: dimensions.height / 2.4,
								width: dimensions.width - 16 * 2,
							}}>
							<View style={styles.actionsRow}>
								<TouchableOpacity
									style={[styles.actionButton, { backgroundColor: white08 }]}
									activeOpacity={1}
									disabled={isChooingFile}
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
					</Background>
				</View>
			</>
		</Camera>
	);
};

const styles = StyleSheet.create({
	background: {
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
