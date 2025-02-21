# Deployment Checks

A comprehensive checklist to prevent common deployment issues.

## 1. TypeScript Type Safety

### Check for Implicit 'any' Types
- [ ] Map/filter/find callbacks have explicit types
```typescript
// ❌ Bad
array.map(item => item.value)

// ✅ Good
array.map((item: ItemType) => item.value)
```

- [ ] Function parameters have explicit types
```typescript
// ❌ Bad
function process(data) { }

// ✅ Good
function process(data: DataType) { }
```

### Check Import/Export Consistency
- [ ] All imported names match their exports
- [ ] No undefined imports
- [ ] No circular dependencies

## 2. Environment Variables

### Required Variables Present
- [ ] Check all required ENV vars:
  - NEXT_PUBLIC_SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY
  - OPENAI_API_KEY
  - ANTHROPIC_API_KEY
  - REPLICATE_API_KEY

### Variable Format Validation
- [ ] API keys follow expected formats:
```typescript
// Example validation
if (!process.env.ANTHROPIC_API_KEY?.startsWith('sk-')) {
  throw new Error('Invalid Anthropic API key format');
}
```

## 3. API Routes

### Error Handling
- [ ] All API routes have try/catch blocks
- [ ] Error responses include proper status codes
- [ ] Error messages are client-friendly

### Response Types
- [ ] API responses have consistent formats
- [ ] Response data is properly typed

## 4. Recent Issues & Solutions

### March 2024

#### Build Error: Multiple Template Response Parsing
Issue: Build failed due to type errors in Anthropic and OpenAI chat routes

Root causes:
1. Anthropic route had implicit 'any' types in template parsing
2. OpenAI route was importing non-existent MEME_SYSTEM_PROMPT

Solutions:
```typescript
// 1. Add proper typing for template details
interface TemplateDetail {
  number: number;
  name: string;
}

// 2. Fix template parsing with explicit types
const templateDetails = templateMatches?.map((match: string) => {
  const matchResult = match.match(/(\d+)\.\s+(.+)/);
  const [_, number, name] = matchResult || ['', '', ''];
  return { number: parseInt(number || '0'), name: name || '' };
});

// 3. Update OpenAI route imports
import { getMemeSystemPromptA } from '@/lib/utils/prompts';
// Instead of
// import { MEME_SYSTEM_PROMPT } from '@/lib/utils/prompts';
```

Key Learnings:
- Always add explicit types to array method callbacks
- Double check import names match exports exactly
- Use proper error handling for regex matches
- Validate all template parsing results

#### Template Selection Component Type Safety
Issue: Implicit 'any' types in template mapping and selection

Solution:
```typescript
// Add interface for templates with indices
interface TemplateWithIndex extends MemeTemplate {
  originalIndex: number;
}

// Add explicit types to map callbacks
console.log('Templates with indices:', templatesWithIndices.map((t: TemplateWithIndex) => ({
  name: t.name,
  originalIndex: t.originalIndex
})));

// Add explicit types to template selection
const templateA = templatesWithIndices.find(
  (t: TemplateWithIndex) => t.originalIndex === dataA.template
);
```

#### Component State Management Conflict
Issue: Captions not displaying in UI due to competing state management systems

Root cause: Component had both useChat hook and direct API calls trying to handle responses differently

Solution:
- Remove unused chat hook and its parsing logic
- Rely on structured API responses
- Ensure state updates are properly logged

Key Learning:
- When refactoring from hooks to direct API calls, remove unused hook logic
- Add console logs for state updates to track data flow
- Ensure API response structure matches component expectations

#### AI Response Parsing Error
Issue: Captions not being parsed from multi-line AI responses

Root cause: Complex regex pattern was too brittle for varying AI response formats

Before (too complex):
```typescript
const captionMatches = content.match(/CAPTIONS?:[\s\n]*((?:(?:\d+\.\s*|")[^"\n]+(?:"|$)\n?)+)/i);
const captions = captionMatches?.[1]
  .split('\n')
  .map(line => line.trim())
  .filter(line => line.length > 0)
  .map(line => line.replace(/^\d+\.\s*"|"$/g, '').trim()) || [];
```

After (more robust):
```typescript
const captions = content
  .split('\n')
  .map(line => line.trim())
  // Match lines that start with a number followed by a dot and possibly quotes
  .filter(line => /^\d+\.\s*"?.+?"?$/.test(line))
  .map(line => {
    // Remove number prefix, dots, and quotes
    return line.replace(/^\d+\.\s*"|"$/g, '').trim();
  });
```

Key Learning:
- Prefer simple, robust parsing over complex regex
- Handle each line independently
- Add fallback values for empty results
- Test with various AI response formats

## 5. Pre-deployment Commands

```bash
# 1. Type check
npm run build

# 2. Lint check
npm run lint

# 3. Test API routes
curl http://localhost:3000/api/test-env
curl http://localhost:3000/api/test-anthropic

# 4. Check ENV vars
echo "Checking ENV vars..."
[ -z "$ANTHROPIC_API_KEY" ] && echo "Missing ANTHROPIC_API_KEY"
[ -z "$OPENAI_API_KEY" ] && echo "Missing OPENAI_API_KEY"
```

## 6. Common Error Messages & Solutions

### "Parameter implicitly has an 'any' type"
- Add explicit type annotations to function parameters
- Create interfaces for complex data structures
- Use type inference where appropriate

### "X is not exported from Y"
- Double check export names in source files
- Verify import paths are correct
- Check for circular dependencies

### "ENV variable X is not configured"
- Verify .env file is present
- Check variable names match exactly
- Ensure variables are properly set in deployment platform

## 7. Post-deployment Verification

- [ ] Test all API endpoints
- [ ] Verify ENV variables are set
- [ ] Check console for type errors
- [ ] Validate API responses 