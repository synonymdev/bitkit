import { decodeQRData } from '../src/utils/scanner';

describe('QR codes', () => {
	it('decodes a bitcoin URI with params', async () => {
		const res = await decodeQRData(
			'bitcoin:1P5ZEDWTKTFGxQjZphgWPQUpe554WKDfHQ?amount=0.0005&label=Nakamoto&message=Donation%20for%20project%20xyz',
		);
		if (res.isErr()) {
			throw res.error;
		}
		const qrData = res.value[0];
		expect(qrData.network).toEqual('bitcoin');
		expect(qrData.qrDataType).toEqual('bitcoinAddress');
		expect(qrData.sats).toEqual(50000);
		expect(qrData.message).toEqual('Donation for project xyz');
	});

	it('decodes a bitcoin legacy address URI', async () => {
		const res = await decodeQRData(
			'bitcoin:1P5ZEDWTKTFGxQjZphgWPQUpe554WKDfHQ',
		);
		if (res.isErr()) {
			throw res.error;
		}
		const qrData = res.value[0];
		expect(qrData.network).toEqual('bitcoin');
		expect(qrData.qrDataType).toEqual('bitcoinAddress');
	});

	it('decodes a bitcoin wrapped segwit address URI', async () => {
		const res = await decodeQRData(
			'bitcoin:3DrziWGfPSYWZpmGxL4WytNeXA2mwzEwWJ',
		);
		if (res.isErr()) {
			throw res.error;
		}
		const qrData = res.value[0];
		expect(qrData.network).toEqual('bitcoin');
		expect(qrData.qrDataType).toEqual('bitcoinAddress');
	});

	it('decodes a bitcoin native segwit address URI', async () => {
		const res = await decodeQRData(
			'bitcoin:bc1qkk0vs43wzsundw37f8xslw69eddwfe24w9pyrg',
		);
		if (res.isErr()) {
			throw res.error;
		}
		const qrData = res.value[0];
		expect(qrData.network).toEqual('bitcoin');
		expect(qrData.qrDataType).toEqual('bitcoinAddress');
	});

	it('decodes a plain bitcoin native segwit address', async () => {
		const res = await decodeQRData(
			'bc1qkk0vs43wzsundw37f8xslw69eddwfe24w9pyrg',
		);
		if (res.isErr()) {
			throw res.error;
		}
		const qrData = res.value[0];
		expect(qrData.network).toEqual('bitcoin');
		expect(qrData.qrDataType).toEqual('bitcoinAddress');
	});
});
