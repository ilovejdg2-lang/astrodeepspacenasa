import { SYSTEM_PROMPT, type AnalysisContextInput } from '../shared/aiSchema'

export function buildModelMessages(context: AnalysisContextInput): { system: string; user: string } {
  const { question, symptoms, ...rest } = context
  return {
    system: SYSTEM_PROMPT,
    user: JSON.stringify({
      task: question?.trim() || 'Resumí el episodio para una revisión humana.',
      data: rest,
      untrustedData: { symptoms },
    }),
  }
}
