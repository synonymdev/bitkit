import { findLnUrl } from '../src/utils/lnurl';
import { processUri, parseUri } from '../src/utils/scanner/scanner';
import { TBitcoinData } from '../src/utils/scanner/types';

describe('QR codes', () => {
	it('decodes a bitcoin URI with params', async () => {
		const res = await parseUri(
			'bitcoin:1P5ZEDWTKTFGxQjZphgWPQUpe554WKDfHQ?amount=0.0005&label=Nakamoto&message=Donation%20for%20project%20xyz',
		);
		if (res.isErr()) {
			throw res.error;
		}
		const qrData = res.value[0] as TBitcoinData;
		expect(qrData.network).toEqual('bitcoin');
		expect(qrData.type).toEqual('onchain');
		expect(qrData.amount).toEqual(50000);
		expect(qrData.message).toEqual('Donation for project xyz');
	});

	it('decodes a bitcoin legacy address URI', async () => {
		const res = await parseUri('bitcoin:1P5ZEDWTKTFGxQjZphgWPQUpe554WKDfHQ');
		if (res.isErr()) {
			throw res.error;
		}
		const qrData = res.value[0] as TBitcoinData;
		expect(qrData.network).toEqual('bitcoin');
		expect(qrData.type).toEqual('onchain');
	});

	it('decodes a bitcoin wrapped segwit address URI', async () => {
		const res = await parseUri('bitcoin:3DrziWGfPSYWZpmGxL4WytNeXA2mwzEwWJ');
		if (res.isErr()) {
			throw res.error;
		}
		const qrData = res.value[0] as TBitcoinData;
		expect(qrData.network).toEqual('bitcoin');
		expect(qrData.type).toEqual('onchain');
	});

	it('decodes a bitcoin native segwit address URI', async () => {
		const res = await parseUri(
			'bitcoin:bc1qkk0vs43wzsundw37f8xslw69eddwfe24w9pyrg',
		);
		if (res.isErr()) {
			throw res.error;
		}
		const qrData = res.value[0] as TBitcoinData;
		expect(qrData.network).toEqual('bitcoin');
		expect(qrData.type).toEqual('onchain');
	});

	it('decodes a plain bitcoin native segwit address', async () => {
		const res = await parseUri('bc1qkk0vs43wzsundw37f8xslw69eddwfe24w9pyrg');
		if (res.isErr()) {
			throw res.error;
		}
		const qrData = res.value[0] as TBitcoinData;
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

	// it('validates empty address', async () => {
	// 	const res = await processUri({ uri: '', validateOnly: true });
	// 	expect(res.isErr()).toBeTruthy();
	// });

	// it('validates invalid data', async () => {
	// 	const res = await processUri({ uri: 'test123', validateOnly: true });
	// 	expect(res.isErr()).toBeTruthy();
	// });

	// it('validates invalid address', async () => {
	// 	const res = await processUri({ uri: 'bitcoin:bs', validateOnly: true });
	// 	expect(res.isErr()).toBeTruthy();
	// });

	// it('validates amount greater than balance', async () => {
	// 	const res = await processUri({
	// 		uri: 'bitcoin:1P5ZEDWTKTF',
	// 		validateOnly: true,
	// 	});
	// 	expect(res.isOk()).toBeTruthy();
	// });

	// it('validates expired invoice', async () => {
	// 	const invoice =
	// 		'lnbcrt1pn3zpqpdqqnp4qfh2x8nyvvzq4kf8j9wcaau2chr580l93pnyrh5027l8f7qtm48h6pp5lmwkulnpze4ek4zqwfepguahcr2ma3vfhwa6uepxfd378xlldprssp5wnq34d553g50suuvfy387csx5hx6mdv8zezem6f4tky7rhezycas9qyysgqcqpcxqrrssrzjqtr7pzpunxgwjddwdqucegdphm6776xcarz60gw9gxva0rhal5ntmapyqqqqqqqqpqqqqqlgqqqqqqgq2ql9zpeakxvff9cz5rd6ssc3cngl256u8htm860qv3r28vqkwy9xe3wp0l9ms3zcqvys95yf3r34ytmegz6zynuthh5s0kh7cueunm3mspg3uwpt';
	// 	const res = await processUri({ uri: invoice, validateOnly: true });
	// 	expect(res.isOk()).toBeTruthy();
	// });

	// it('validates lnurl', async () => {
	// 	const res = await processUri({
	// 		uri: 'lnurl1dp68gurn8ghj7mrww3uxymm59e3xjemnw4hzu7re0ghkcmn4wfkz7urp0ylh2um9wf5kg0fhxycnv9g9w58',
	// 		validateOnly: true,
	// 	});
	// 	expect(res.isOk()).toBeTruthy();
	// });

	// it('validates slashpay', async () => {
	// 	const res = await processUri({
	// 		uri: 'slashpay:1P5EDWTKTFGxQjZphgWPQUpe554WKDfHQ',
	// 		validateOnly: true,
	// 	});
	// 	expect(res.isOk()).toBeTruthy();
	// });
});
