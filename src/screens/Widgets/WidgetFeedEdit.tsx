import React, { useState, useMemo, useEffect, ReactElement } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useSelector } from 'react-redux';
import { SlashURL } from '@synonymdev/slashtags-sdk';

import {
	ScrollView,
	View as ThemedView,
	Text02S,
	Caption13Up,
	CubeIcon,
	NewspaperIcon,
	ChartLineIcon,
	Headline,
	Text01S,
	Text02M,
} from '../../styles/components';
import NavigationHeader from '../../components/NavigationHeader';
import Button from '../../components/Button';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import Store from '../../store/types';
import type { RootStackScreenProps } from '../../navigation/types';
import { IWidget, SlashFeedJSON } from '../../store/types/widgets';
import { useSlashtagsSDK } from '../../components/SlashtagsProvider';
import { decodeJSON, readAsDataURL } from '../../utils/slashtags';
import { showErrorNotification } from '../../utils/notifications';
import ProfileImage from '../../components/ProfileImage';
import useColors from '../../hooks/colors';
import { deleteWidget, setFeedWidget } from '../../store/actions/widgets';
import {
	decodeWidgetFieldValue,
	SUPPORTED_FEED_TYPES,
} from '../../utils/widgets';
import Divider from '../../components/Divider';
import HourglassSpinner from '../../components/HourglassSpinner';

export const WidgetFeedEdit = ({
	navigation,
	route,
}: RootStackScreenProps<'WidgetFeedEdit'>): ReactElement => {
	const { url } = route.params;
	const { white, brand } = useColors();
	const sdk = useSlashtagsSDK();

	const savedWidget: IWidget | undefined = useSelector((state: Store) => {
		return state.widgets.widgets[url];
	});

	const savedSelectedField = useMemo(() => {
		return savedWidget?.feed?.field?.name;
	}, [savedWidget]);

	const [fields, setFields] = useState<{ [label: string]: string }>({});
	const [isLoading, setIsLoading] = useState(false);
	const [config, setConfig] = useState<
		Partial<SlashFeedJSON> & { icon?: string }
	>(savedWidget?.feed);

	const [selectedField, setSelectedField] =
		useState<string>(savedSelectedField);

	const resolving = useMemo(() => {
		return !config && !savedWidget;
	}, [config, savedWidget]);

	const enableSave = useMemo(() => {
		return selectedField && selectedField !== savedSelectedField;
	}, [selectedField, savedSelectedField]);

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
			setIsLoading(true);

			drive
				.get('/slashfeed.json')
				.then(decodeJSON)
				.then((_config: SlashFeedJSON) => {
					saveConfig(_config).catch(noop);

					// Save fields without values as soon as possible
					if (!unmounted) {
						setFields(
							Object.fromEntries(_config.fields.map((f) => [f.name, ''])),
						);
					}

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

					// pre-select first option
					setSelectedField(_config.fields[0].name);
					setIsLoading(false);
				})
				.catch((e: Error) => {
					setIsLoading(false);
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

			if (!unmounted) {
				setConfig({ ..._config, icon });
			}
		}

		function noop(): void {}

		return function cleanup() {
			unmounted = true;
		};
	}, [sdk, url]);

	const save = (): void => {
		if (config) {
			setFeedWidget(url, {
				name: config?.name,
				type: config?.type,
				description: config?.description,
				icon: config?.icon,
				field: config.fields?.filter((f) => f.name === selectedField)[0],
			} as IWidget['feed']);
		}

		navigation.navigate('Tabs');
	};

	const onDelete = (): void => {
		deleteWidget(url);
		navigation.navigate('Tabs');
	};

	const buttonText = savedSelectedField ? 'Save' : 'Add Widget';

	return (
		<ThemedView style={styles.container}>
			<SafeAreaInsets type="top" />
			<NavigationHeader
				title="Widget Feed"
				onClosePress={(): void => {
					navigation.navigate('Tabs');
				}}
			/>

			{resolving ? (
				<HourglassSpinner />
			) : (
				<View style={styles.content}>
					<View style={styles.header}>
						<Headline>{config?.name}</Headline>
						<View style={styles.headerImage}>
							{((): ReactElement => {
								switch (config.type) {
									case SUPPORTED_FEED_TYPES.PRICE_FEED:
										return <ChartLineIcon width={32} height={32} />;
									case SUPPORTED_FEED_TYPES.HEADLINES_FEED:
										return <NewspaperIcon width={32} height={32} />;
									case SUPPORTED_FEED_TYPES.BLOCKS_FEED:
										return <CubeIcon width={32} height={32} />;
									default:
										return (
											<ProfileImage url={url} image={config?.icon} size={32} />
										);
								}
							})()}
						</View>
					</View>

					{config?.description && (
						<>
							<Text01S style={styles.description}>{config.description}</Text01S>
							<Divider />
						</>
					)}

					{isLoading && (
						<Text01S color="gray1">Loading widget options...</Text01S>
					)}

					{!isLoading && Object.entries(fields).length > 1 && (
						<>
							<Text01S color="gray1" style={styles.explanation}>
								Select the feed you want this widget to display in your wallet
								overview.
							</Text01S>
							<ScrollView>
								{Object.values(fields).length === 0 ? (
									<Text02S color="gray1">No feeds to feature...</Text02S>
								) : (
									Object.entries(fields).map(([label, value]) => {
										return (
											<Pressable
												key={label}
												onPress={(): void => setSelectedField(label)}>
												<View style={styles.fieldContainer}>
													<View style={styles.fieldLeftContainer}>
														{typeof value === 'string' ? (
															<>
																<Caption13Up
																	color="gray1"
																	style={styles.fieldLabel}>
																	{label}
																</Caption13Up>
																<Text02M style={styles.fieldValue}>
																	{value}
																</Text02M>
															</>
														) : (
															<Text01S style={styles.fieldValue}>
																{label}
															</Text01S>
														)}
													</View>
													<View
														style={[
															styles.selectField,
															selectedField === label && {
																backgroundColor: brand,
																borderColor: white,
															},
														]}
													/>
												</View>
												<Divider />
											</Pressable>
										);
									})
								)}
							</ScrollView>
						</>
					)}

					<View style={styles.buttonsContainer}>
						{savedSelectedField && (
							<Button
								style={styles.deleteButton}
								text="Delete"
								size="large"
								variant="secondary"
								onPress={onDelete}
							/>
						)}
						<Button
							style={styles.saveButton}
							text={buttonText}
							size="large"
							disabled={!enableSave}
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
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 16,
	},
	headerImage: {
		borderRadius: 8,
		overflow: 'hidden',
	},
	description: {},
	explanation: {
		marginBottom: 32,
	},
	saveButton: {
		flex: 1,
	},
	deleteButton: {
		flex: 1,
		marginRight: 16,
	},
	fieldContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	fieldLeftContainer: {
		justifyContent: 'center',
		flex: 1,
	},
	fieldLabel: {
		marginBottom: 8,
	},
	fieldValue: {
		flex: 1,
		paddingRight: 16,
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
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 'auto',
	},
});

export default WidgetFeedEdit;
