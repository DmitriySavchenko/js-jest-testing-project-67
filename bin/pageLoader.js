#!/usr/bin/env node

import { pageLoader } from '../src/index.js';
import { program } from 'commander';

program
  .name('pageLoad')
  .version('0.0.1')
  .option('-o, --output <path>')
  .argument('<url>', 'target page url')
  .action(async (url, options) => {
    pageLoader(url, options.output)
    .then((filePath) => {
      console.info(filePath);
    })
    .catch((e) => {
      console.error(`Error code:${e?.code ?? 'unknown'}; message:${e?.message ?? 'unknown'}`);
    })    
  });

program.parseAsync();