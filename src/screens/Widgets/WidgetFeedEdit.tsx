import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { useSelector } from 'react-redux';

import {
	ScrollView,
	View as ThemedView,
	Text02S,
	Title,
	Caption13Up,
} from '../../styles/components';
import NavigationHeader from '../../components/NavigationHeader';
import Button from '../../components/Button';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import Store from '../../store/types';
import type { RootStackScreenProps } from '../../navigation/types';
import { IWidget, SlashFeedJSON } from '../../store/types/widgets';
import { useSlashtagsSDK } from '../../components/SlashtagsProvider';
import { SlashURL } from '@synonymdev/slashtags-sdk';
import { decodeJSON, readAsDataURL } from '../../utils/slashtags';
import { showErrorNotification } from '../../utils/notifications';
import ProfileImage from '../../components/ProfileImage';
import { TouchableOpacity } from 'react-native-gesture-handler';
import useColors from '../../hooks/colors';
import { deleteFeedWidget, setFeedWidget } from '../../store/actions/widgets';
import { decodeWidgetFieldValue } from '../../utils/widgets';
import Glow from '../../components/Glow';

const imageSrc = require('../../assets/illustrations/hourglass.png');

export const WidgetFeedEdit = ({
	navigation,
	route,
}: RootStackScreenProps<'WidgetFeedEdit'>): JSX.Element => {
	const { white, brand } = useColors();

	const url = route.params?.url;

	const savedWidget: IWidget | undefined = useSelector((state: Store) => {
		return state.widgets.widgets[url];
	});

	const savedSelectedField = useMemo(() => {
		return savedWidget?.feed?.field?.name;
	}, [savedWidget]);

	const [selectedField, setSelectedField] =
		useState<string>(savedSelectedField);

	const shouldSave = useMemo(() => {
		return selectedField && selectedField !== savedSelectedField;
	}, [selectedField, savedSelectedField]);

	const [config, setConfig] = useState<
		Partial<SlashFeedJSON> & { icon?: string }
	>(savedWidget?.feed);
	const [fields, setFields] = useState<{ [label: string]: string }>({});

	const resolving = useMemo(() => {
		return !config && !savedWidget;
	}, [config, savedWidget]);

	const sdk = useSlashtagsSDK();

	useEffect(() => {
		let unmounted = false;

		const parsed = SlashURL.parse(url);
		const key = parsed.key;
		const encryptionKey =
			typeof parsed.privateQuery.encryptionKey === 'string'
				? SlashURL.decode(parsed.privateQuery.encryptionKey)
				: undefined;

		const drive = sdk.drive(key, { encryptionKey });

		// TODO(slashtags): should not be needed after Hyperdrive actually support encryptionKey
		// Manually awaiting peers
		const done = drive.findingPeers();
		sdk.swarm.flush().then(done, done);

		drive
			.ready()
			.then(read)
			.catch((e: Error) => {
				showErrorNotification({
					title: 'Failed to open feed drive',
					message: e.message,
				});
			});

		function read(): void {
			drive
				.get('/slashfeed.json')
				.then(decodeJSON)
				.then((_config: SlashFeedJSON) => {
					saveConfig(_config).catch(noop);

					// Save fields without values as soon as possible
					!unmounted &&
						setFields(
							Object.fromEntries(_config.fields.map((f) => [f.name, ''])),
						);

					_config.fields.map((field) => {
						drive
							.get(field.main)
							.then((buf: Uint8Array) =>
								decodeWidgetFieldValue(_config.type, field, buf),
							)
							.then((val: any) =>
								setFields((f) => ({ ...f, [field.name]: val })),
							)
							.catch(noop);
					});
				})
				.catch((e: Error) => {
					showErrorNotification({
						title: 'Could not resolve feed configuration file slashfeed.json',
						message: e.message,
					});
				});
		}

		async function saveConfig(_config: SlashFeedJSON): Promise<void> {
			let icon = _config.icons['32'] || Object.values(_config.icons)[0];

			if (icon.startsWith('/')) {
				icon = await readAsDataURL(drive, icon);
			}

			!unmounted &&
				setConfig({
					..._config,
					icon,
				});
		}

		function noop(): void {}

		return function cleanup() {
			unmounted = true;
		};
	}, [sdk, url]);

	const save = (): void => {
		config &&
			setFeedWidget(url, {
				name: config?.name,
				type: config?.type,
				description: config?.description,
				icon: config?.icon,
				field: config.fields?.filter((f) => f.name === selectedField)[0],
			} as IWidget['feed']);
		navigation.navigate('Tabs');
	};

	const deleteWidget = (): void => {
		deleteFeedWidget(url);
		navigation.navigate('Tabs');
	};

	return (
		<ThemedView style={styles.container}>
			<SafeAreaInsets type="top" />
			<NavigationHeader
				title={'Widget Feed'}
				onClosePress={(): void => {
					navigation.navigate('Tabs');
				}}
			/>
			{resolving ? (
				<View style={styles.imageContainer} pointerEvents="none">
					<Glow color="brand" size={600} style={styles.glow} />
					<Image source={imageSrc} style={styles.image} />
				</View>
			) : (
				<View style={styles.content}>
					<View style={styles.header}>
						<Title>{config?.name}</Title>
						<ProfileImage
							style={styles.headerImage}
							url={url}
							image={config?.icon}
							size={32}
						/>
					</View>
					<Text02S style={styles.explanation}>
						{config?.description || ''}
					</Text02S>
					<Text02S color="gray1" style={styles.explanation}>
						Select the feed you want the widget to display in your wallet
						overview.
					</Text02S>
					<ScrollView>
						{Object.values(fields).length === 0 ? (
							<Text02S color="gray1">No feeds to feature...</Text02S>
						) : (
							Object.entries(fields)
								.sort((a, b) => (a[0] < b[0] ? -1 : 1))
								.map(([label, value]) => {
									return (
										<TouchableOpacity
											key={label}
											activeOpacity={0.6}
											onPress={(): void => setSelectedField(label)}>
											<View style={styles.fieldContainer}>
												<View>
													<Caption13Up color="gray1" style={styles.fileLabel}>
														{label}
													</Caption13Up>
													<Text02S style={styles.fileValue}>{value}</Text02S>
												</View>
												<View
													style={[
														styles.selectField,
														selectedField === label
															? { backgroundColor: brand, borderColor: white }
															: {},
													]}
												/>
											</View>
											<View style={styles.divider} />
										</TouchableOpacity>
									);
								})
						)}
					</ScrollView>
					<View style={styles.buttonsContainer}>
						{savedSelectedField && (
							<Button
								style={styles.deleteButton}
								text="Delete"
								size="large"
								variant="secondary"
								onPress={deleteWidget}
							/>
						)}
						<Button
							style={styles.saveButton}
							text="Save"
							size="large"
							disabled={!shouldSave}
							onPress={save}
						/>
					</View>
				</View>
			)}
			<SafeAreaInsets type="bottom" />
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
		paddingBottom: 16,
	},
	header: {
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 16,
	},
	headerImage: {
		borderRadius: 8,
	},
	explanation: {
		marginBottom: 32,
	},
	divider: {
		height: 1,
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		marginTop: 16,
		marginBottom: 16,
	},
	saveButton: {
		flex: 1,
	},
	deleteButton: {
		flex: 1,
		marginRight: 16,
	},

	fieldContainer: {
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	fileLabel: {
		marginBottom: 8,
	},
	fileValue: {
		lineHeight: 15,
	},
	selectField: {
		width: 32,
		height: 32,
		borderRadius: 20,
		borderColor: '#3A3A3C',
		borderWidth: 4,
	},
	buttonsContainer: {
		paddingTop: 16,
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	imageContainer: {
		flex: 1,
		position: 'relative',
		justifyContent: 'center',
		alignItems: 'center',
	},
	glow: {
		position: 'absolute',
	},
	image: {
		width: 230,
		height: 230,
	},
});

export default WidgetFeedEdit;
