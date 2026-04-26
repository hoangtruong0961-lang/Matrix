import { regexService } from './services/regexService.js';
import { DEFAULT_GLOBAL_REGEXES } from './constants/defaultRegexes.js';

// Setup regexes
regexService.setActiveScripts(DEFAULT_GLOBAL_REGEXES);

const testText = `Hệ thống:
[Mở đầu]
Đây là form
`;

const result = regexService.applyScripts(testText, { isMarkdown: true, depth: 1 });
console.log("Result:", result);
