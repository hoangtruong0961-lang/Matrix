import { regexService } from './services/regexService';

const stRule = {
    id: "test",
    name: "ST Rule",
    pattern: "<card>([\\s\\S]*?)</card>",
    replacement: "<div class=\"card\">$1</div>",
    flags: "gi",
    enabled: true,
    order: 1,
    placement: [2],
    scope: 'preset' as const
};

regexService.setActiveScripts([stRule]);

const input = "Here is a <card>hello world</card> text.";
const res = regexService.applyScripts(input, { isMarkdown: true });
console.log("Output:", res);
