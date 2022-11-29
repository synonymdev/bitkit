/* eslint-disable @typescript-eslint/explicit-function-return-type */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, 'node_modules/@synonymdev/slashtags-sdk');
const index = path.join(root, './index.js');
const old = path.join(root, './index.old.js');

module.exports = async function postInstallSlashtags() {
	console.log('== postInstallSlashtags.js');
	// 1- keep a copy of the original index.js file
	if (fs.readdirSync(root).includes('index.old.js')) {
		console.log('   skip: sdk seemingly already bundled');
	} else {
		fs.copyFileSync(index, old);

		// 2- bundle the SDK with "esbuild" to avoid import shenanigans
		await bundle();
		console.log('   esbuild: bundled slashtags-sdk in place...');
	}

	// 3- Fix the stream async iterator problem in a very hacky but working way.
	transform();
	console.log('   hack: transformed problematic for await of stream');
};

function transform() {
	const bundled = path.join(root, './index.bundled.js');
	fs.copyFileSync(index, bundled);
	let src = fs.readFileSync(bundled).toString();

	[
		// Async iterables
		[
			`
            for await (const data of this._activeQuery) {
              if (!this.isClient)
                continue;
              for (const peer of data.peers) {
                this._onpeer(peer, data);
              }
            }
      `,
			`
  					await new Promise((resolve, reject) => {
    					const s = this._activeQuery;
    					s.on('data', async (data) => {
              	if (!this.isClient) return;
              	for (const peer of data.peers) {
                	this._onpeer(peer, data);
              	}
    					});
    					s.on('end', resolve);
    					s.on('error', reject);
  					})
      `,
		],
		[
			`
          for await (const block of this.createReadStream(id, opts)) {
            res.push(block);
          }
      `,
			`
      		await new Promise((resolve, reject) => {
      			const s = this.createReadStream(id, opts);
      			s.on('data', (block) => { res.push(block) });
      			s.on('end', resolve);
      			s.on('error', reject);
      		})
      `,
		],
		// Make autoClose false in Corestore.. solves undefined is not a function
		// in case of saving profile while relay socket is closing!
		['autoClose: true', 'autoClose: false'],
		// Sigh.. I don't know what is the point of Babel?
		['let result = 0n', 'let result = BigInt(0)'],
	].forEach(([prev, target]) => {
		src = src.replace(prev, target);
	});

	fs.writeFileSync(index, src);
}

function bundle() {
	const globalName = 'SynonymdevSlashtagsSdk';
	const umdPre = `(function (root, factory) {(typeof module === 'object' && module.exports) ? module.exports = factory() : root.${globalName} = factory()}(typeof self !== 'undefined' ? self : this, function () {`;
	const umdPost = `return ${globalName}}));`;

	return require('esbuild').build({
		entryPoints: [old],
		format: 'iife',
		bundle: true,
		globalName,
		banner: { js: umdPre },
		footer: { js: umdPost },
		outfile: index,
		minify: false,
		sourcemap: 'inline',
	});
}
