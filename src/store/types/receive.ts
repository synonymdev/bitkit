import { ICJitEntry } from '@synonymdev/blocktank-lsp-http-client';

export interface IReceive {
	id: string; // uuid used to identify the invoice 'session'
	amount: number;
	numberPadText: string;
	message: string;
	tags: string[];
	jitOrder: ICJitEntry | null;
}
