import React, { memo, ReactElement, useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import b4a from 'b4a';

import { __SLASHTAGS_SEEDER_BASE_URL__ } from '../../../constants/env';
import { EItemType, IListData } from '../../../components/List';
import SettingsView from '../SettingsView';
import { useSelectedSlashtag } from '../../../hooks/slashtags';
import { useSlashtagsSDK } from '../../../components/SlashtagsProvider';
import { lastSentSelector } from '../../../store/reselect/slashtags';

const SlashtagsSettings = (): ReactElement => {
	const { slashtag } = useSelectedSlashtag();
	const sdk = useSlashtagsSDK();

	const [discoveryKey, setDiscoveryKey] = useState(
		b4a.from('a'.repeat(64), 'hex'),
	);

	const [driveVersion, setDriveVersion] = useState(1);
	const [profileError, setProfileError] = useState();

	const lastSeed = useSelector(lastSentSelector);

	const [seederStatus, setSeederStatus] = useState({
		seeded: false,
		diff: 0,
	});

	useEffect(() => {
		let unmounted = false;

		(async (): Promise<void> => {
			const drive = slashtag.drivestore.get();

			try {
				await drive.update();
				setDriveVersion(drive.version);
				setDiscoveryKey(drive.discoveryKey);
				await drive.get('/profile.json');

				try {
					const key = b4a.toString(drive.key, 'hex');
					const firstResponse = await fetch(
						__SLASHTAGS_SEEDER_BASE_URL__ + '/seeding/hypercore/' + key,
						{ method: 'GET' },
					);
					const status = await firstResponse.json();

					if (!unmounted) {
						setSeederStatus({
							seeded: status.statusCode !== 404,
							diff: status.length - drive.core.length,
						});
					}
				} catch (error) {}
			} catch (error) {
				if (!unmounted) {
					setProfileError(error.message);
				}
			} finally {
				drive.close();
			}
		})();

		return function cleanup() {
			unmounted = true;
		};
	}, [slashtag.drivestore]);

	const settingsListData: IListData[] = useMemo(
		() => [
			{
				title: 'PublicDrive',
				data: [
					{
						title: 'version',
						value: driveVersion,
						type: EItemType.button,
					},
					{
						title: 'last seeded',
						value: lastSeed && new Date(lastSeed).toLocaleString(),
						type: EItemType.button,
					},
					{
						title: 'seeder status',
						value: seederStatus.seeded
							? 'behind by ' + seederStatus.diff + ' blocks'
							: 'Not Found',
						type: EItemType.button,
					},
					{
						title: 'corrupt',
						value: profileError || 'false',
						type: EItemType.button,
					},
				],
			},
			{
				title: 'sdk corestore',
				data: [
					{
						title: 'open',
						value: !sdk.closed || 'false',
						type: EItemType.button,
					},
				],
			},
			{
				title: 'relay',
				data: [
					{
						title: 'open',
						value: sdk.swarm.dht._protocol._stream._socket.readyState === 1,
						type: EItemType.button,
					},
					{
						title: 'url',
						value: sdk.swarm.dht._protocol._stream._socket.url,
						type: EItemType.button,
					},
					{
						title: 'close relay socket',
						type: EItemType.button,
						onPress: () => sdk._relaySocket.close(),
					},
				],
			},
			{
				title: 'swarm topics',
				data: [
					{
						title: 'swarm NOT destroyed',
						value: !sdk.swarm.destroyed || 'false',
						type: EItemType.button,
					},
					{
						title: 'announced on publicDrive',
						value: discoveryKey ? sdk.swarm.status(discoveryKey)?.isServer : '',
						type: EItemType.button,
					},
				],
			},
		],
		[profileError, driveVersion, sdk, discoveryKey, lastSeed, seederStatus],
	);

	return (
		<SettingsView
			title="Slashtags Settings"
			listData={settingsListData}
			showBackNavigation={true}
		/>
	);
};

export default memo(SlashtagsSettings);
