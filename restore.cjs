const fs = require('fs');
const lines = fs.readFileSync('C:/Users/herdi/.gemini/antigravity-ide/brain/60c3c78c-5e60-4438-98d8-3a8c3352f852/.system_generated/logs/transcript.jsonl', 'utf-8').split('\n');
for (let line of lines) {
  if (line.includes('\"step_index\":213')) {
    const obj = JSON.parse(line);
    fs.writeFileSync('src/components/onboarding/OnboardingFlow.tsx', obj.tool_calls[0].args.CodeContent, 'utf-8');
    console.log('Restored!');
    break;
  }
}
