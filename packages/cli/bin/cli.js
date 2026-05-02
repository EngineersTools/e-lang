#!/usr/bin/env node

import mainModule from '../out/main.cjs';
const main = mainModule.default || mainModule;
main();
