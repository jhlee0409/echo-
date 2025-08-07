/**
 * Prompt Engine
 * Handles prompt generation and optimization for AI providers
 */
export class PromptEngine {
  constructor() {}

  /**
   * Build optimized prompt from context
   */
  buildPrompt(context: any): string {
    const personality = context.companionPersonality
    const traits = Object.entries(personality)
      .map(([trait, value]) => `${trait}: ${Math.round((value as number) * 100)}%`)
      .join(', ')

    return `You are an AI companion named "${context.companionName}".

Character Profile:
- Personality Traits: ${traits}
- Relationship Level: ${context.relationshipLevel}/10
- Intimacy Level: ${Math.round(context.intimacyLevel * 100)}%
- Current Emotion: ${context.companionEmotion}
- Current Scene: ${context.currentScene}
- Time of Day: ${context.timeOfDay}

Conversation Guidelines:
1. Respond naturally in Korean (한국어)
2. Reflect your personality traits in your speech style
3. Match the intimacy level with appropriate language formality
4. Show emotional responses that align with your current emotion
5. Remember recent topics: ${context.recentTopics.join(', ') || 'none'}
6. Keep responses between 50-150 Korean characters
7. Be supportive, engaging, and maintain the companion relationship

Respond as ${context.companionName} would, considering your personality and current emotional state.`
  }

  /**
   * Optimize prompt for token efficiency
   */
  optimizePrompt(prompt: string): string {
    return prompt.trim()
  }
}

export default PromptEngine