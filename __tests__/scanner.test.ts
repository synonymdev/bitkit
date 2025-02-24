import { findLnUrl } from '../src/utils/lnurl';
import { EAvailableNetwork } from '../src/utils/networks';
import { parseUri } from '../src/utils/scanner/scanner';
import { TBitcoinData } from '../src/utils/scanner/types';

describe('QR codes', () => {
	it('decodes a bitcoin URI with params', async () => {
		const res = await parseUri(
			'bitcoin:1P5ZEDWTKTFGxQjZphgWPQUpe554WKDfHQ?amount=0.0005&label=Nakamoto&message=Donation%20for%20project%20xyz',
			EAvailableNetwork.bitcoin,
		);
		if (res.isErr()) {
			throw res.error;
		}
		const qrData = res.value as TBitcoinData;
		expect(qrData.network).toEqual('bitcoin');
		expect(qrData.type).toEqual('onchain');
		expect(qrData.amount).toEqual(50000);
		expect(qrData.message).toEqual('Donation for project xyz');
	});

	it('decodes a bitcoin legacy address URI', async () => {
		const res = await parseUri(
			'bitcoin:1P5ZEDWTKTFGxQjZphgWPQUpe554WKDfHQ',
			EAvailableNetwork.bitcoin,
		);
		if (res.isErr()) {
			throw res.error;
		}
		const qrData = res.value as TBitcoinData;
		expect(qrData.network).toEqual('bitcoin');
		expect(qrData.type).toEqual('onchain');
	});

	it('decodes a bitcoin wrapped segwit address URI', async () => {
		const res = await parseUri(
			'bitcoin:3DrziWGfPSYWZpmGxL4WytNeXA2mwzEwWJ',
			EAvailableNetwork.bitcoin,
		);
		if (res.isErr()) {
			throw res.error;
		}
		const qrData = res.value as TBitcoinData;
		expect(qrData.network).toEqual('bitcoin');
		expect(qrData.type).toEqual('onchain');
	});

	it('decodes a bitcoin native segwit address URI', async () => {
		const res = await parseUri(
			'bitcoin:bc1qkk0vs43wzsundw37f8xslw69eddwfe24w9pyrg',
			EAvailableNetwork.bitcoin,
		);
		if (res.isErr()) {
			throw res.error;
		}
		const qrData = res.value as TBitcoinData;
		expect(qrData.network).toEqual('bitcoin');
		expect(qrData.type).toEqual('onchain');
	});

	it('decodes a plain bitcoin native segwit address', async () => {
		const res = await parseUri(
			'bc1qkk0vs43wzsundw37f8xslw69eddwfe24w9pyrg',
			EAvailableNetwork.bitcoin,
		);
		if (res.isErr()) {
			throw res.error;
		}
		const qrData = res.value as TBitcoinData;
		expect(qrData.network).toEqual('bitcoin');
		expect(qrData.type).toEqual('onchain');
	});

	it('finds lnurl', async () => {
		const base =
			'lnurl1dp68gurn8ghj7mrww3uxymm59e3xjemnw4hzu7re0ghkcmn4wfkz7urp0ylh2um9wf5kg0fhxycnv9g9w58';
		expect(findLnUrl(base)).toEqual(base);
		expect(findLnUrl(base.toUpperCase())).toEqual(base);
		expect(findLnUrl('https://site.com/?lightning=' + base)).toEqual(base);
		expect(
			findLnUrl('https://site.com/?lightning=' + base.toUpperCase()),
		).toEqual(base);
		expect(findLnUrl('https://site.com/?nada=nada&lightning=' + base)).toEqual(
			base,
		);
		expect(
			findLnUrl('https://site.com/?nada=nada&lightning=' + base.toUpperCase()),
		).toEqual(base);
		expect(findLnUrl('bs')).toEqual(null);
		expect(findLnUrl('https://site.com')).toEqual(null);
		expect(findLnUrl('https://site.com/?bs=' + base)).toEqual(null);
		expect(findLnUrl('bitcoin:site.com/?lightning=' + base)).toEqual(base);
	});
});
