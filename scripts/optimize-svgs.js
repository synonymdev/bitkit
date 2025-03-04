const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directory constants
const DIRS = {
	RAW_SVGS: path.join(__dirname, '../src/assets/svgs/raw'),
	OPTIMIZED_SVGS: path.join(__dirname, '../src/assets/svgs/optimized'),
	INDEX: path.join(__dirname, '../src/assets/icons/index.ts'),
};

/**
 * Clean and recreate the optimized SVGs directory
 */
function setupDirectories() {
	if (fs.existsSync(DIRS.OPTIMIZED_SVGS)) {
		fs.rmSync(DIRS.OPTIMIZED_SVGS, { recursive: true, force: true });
	}
	fs.mkdirSync(DIRS.OPTIMIZED_SVGS, { recursive: true });
}

/**
 * Optimize SVGs using SVGO
 */
function optimizeSvgs() {
	console.log('\nOptimizing SVGs with SVGO...');
	try {
		execSync(`npx svgo -rf "${DIRS.RAW_SVGS}" -o "${DIRS.OPTIMIZED_SVGS}"`, {
			stdio: 'inherit',
		});
		console.log('\nSVG optimization completed successfully!');
	} catch (error) {
		throw new Error(`SVGO optimization failed: ${error.message}`);
	}
}

/**
 * Generate the icons/index.ts file with optimized SVGs
 */
function generateIndexFile() {
	console.log('\nGenerating index.ts...');
	const optimizedSvgs = fs
		.readdirSync(DIRS.OPTIMIZED_SVGS)
		.filter((file) => file.endsWith('.svg'));

	const indexContent = `/**
 * This file is auto-generated. Do not edit it manually.
 * Run \`node scripts/optimize-svgs.js\` to regenerate.
 */

${optimizedSvgs
	.map((file) => {
		const name = path.basename(file, '.svg');
		const svgContent = fs.readFileSync(
			path.join(DIRS.OPTIMIZED_SVGS, file),
			'utf8',
		);
		return `export const ${name}Icon = (color = 'white'): string => \`\n${svgContent}\`;`;
	})
	.join('\n\n')}\n`;

	fs.writeFileSync(DIRS.INDEX, indexContent);
	console.log(`Generated index.ts with ${optimizedSvgs.length} icons!`);
}

function main() {
	try {
		// Setup directories
		setupDirectories();

		// Optimize and generate index
		optimizeSvgs();
		generateIndexFile();
	} catch (error) {
		console.error('\nError:', error.message);
		process.exit(1);
	}
}

main();
