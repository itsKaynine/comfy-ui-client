import { program } from 'commander';

import { txt2img } from './txt2img.js';
import { exampleTxt2ImgPrompt } from './prompts.js';

program
  .name('comfy-ui-client')
  .description('CLI to comfy-ui-client')
  .version('0.0.0');

program.command('txt2img').action(async () => {
  await txt2img(exampleTxt2ImgPrompt(), './tmp');
});

program.parse();
