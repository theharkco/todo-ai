export type Priority = 'high' | 'medium' | 'low';

export interface ParsedTask {
  title: string;
  dueDate?: string; // YYYY-MM-DD
  dueDateLabel?: string;
  priority: Priority;
  tags: string[];
}

export function parseNaturalLanguageTask(input: string): ParsedTask {
  let cleaned = input.trim();
  let priority: Priority = 'medium';
  const tags: string[] = [];
  let dueDate: string | undefined = undefined;
  let dueDateLabel: string | undefined = undefined;

  // 1. Detect tags (#tag)
  const tagMatches = cleaned.match(/#([a-zA-Z0-9_\-]+)/g);
  if (tagMatches) {
    tagMatches.forEach((t) => {
      tags.push(t.replace('#', '').toLowerCase());
      cleaned = cleaned.replace(t, '');
    });
  }

  // 2. Detect priority (!urgent, !high, !low, etc.)
  if (/(?:^|\s)(!high|!urgent|!p1|urgent|asap)(?:$|\s)/i.test(cleaned)) {
    priority = 'high';
    cleaned = cleaned.replace(/(?:^|\s)(!high|!urgent|!p1|urgent|asap)(?:$|\s)/i, ' ');
  } else if (/(?:^|\s)(!low|!p3)(?:$|\s)/i.test(cleaned)) {
    priority = 'low';
    cleaned = cleaned.replace(/(?:^|\s)(!low|!p3)(?:$|\s)/i, ' ');
  } else if (/(?:^|\s)(!med|!medium|!p2)(?:$|\s)/i.test(cleaned)) {
    priority = 'medium';
    cleaned = cleaned.replace(/(?:^|\s)(!med|!medium|!p2)(?:$|\s)/i, ' ');
  }

  // 3. Detect date phrases
  const today = new Date();
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  if (/(?:^|\s)(today|tonight)(?:$|\s)/i.test(cleaned)) {
    dueDate = formatDate(today);
    dueDateLabel = 'Today';
    cleaned = cleaned.replace(/(?:^|\s)(today|tonight)(?:$|\s)/i, ' ');
  } else if (/(?:^|\s)tomorrow(?:$|\s)/i.test(cleaned)) {
    const tmrw = new Date(today);
    tmrw.setDate(today.getDate() + 1);
    dueDate = formatDate(tmrw);
    dueDateLabel = 'Tomorrow';
    cleaned = cleaned.replace(/(?:^|\s)tomorrow(?:$|\s)/i, ' ');
  } else if (/(?:^|\s)in (\d+) days?(?:$|\s)/i.test(cleaned)) {
    const match = cleaned.match(/(?:^|\s)in (\d+) days?(?:$|\s)/i);
    if (match) {
      const days = parseInt(match[1], 10);
      const target = new Date(today);
      target.setDate(today.getDate() + days);
      dueDate = formatDate(target);
      dueDateLabel = `In ${days} days`;
      cleaned = cleaned.replace(match[0], ' ');
    }
  } else if (/(?:^|\s)next week(?:$|\s)/i.test(cleaned)) {
    const target = new Date(today);
    target.setDate(today.getDate() + 7);
    dueDate = formatDate(target);
    dueDateLabel = 'Next week';
    cleaned = cleaned.replace(/(?:^|\s)next week(?:$|\s)/i, ' ');
  }

  // Clean extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return {
    title: cleaned || input.trim(),
    dueDate,
    dueDateLabel,
    priority,
    tags,
  };
}

export function generateSmartSubtasks(taskTitle: string): string[] {
  const lower = taskTitle.toLowerCase();

  if (lower.includes('launch') || lower.includes('release') || lower.includes('deploy')) {
    return [
      'Run end-to-end typecheck and build',
      'Verify mobile responsiveness and viewport scaling',
      'Check SSL certificate and reverse proxy routing',
      'Publish changelog and notify users',
    ];
  }

  if (lower.includes('crypto') || lower.includes('xrp') || lower.includes('wallet') || lower.includes('token')) {
    return [
      'Check testnet contract and transaction signatures',
      'Verify wallet connection and balance updates',
      'Audit decimal precision and slippage protection',
      'Perform sanity test with small amount',
    ];
  }

  if (lower.includes('write') || lower.includes('report') || lower.includes('document')) {
    return [
      'Outline core problem and key objectives',
      'Draft primary sections and code snippets',
      'Proofread and polish clarity',
      'Share draft for peer review',
    ];
  }

  if (lower.includes('meeting') || lower.includes('call') || lower.includes('sync')) {
    return [
      'Prepare agenda and discussion points',
      'Gather relevant links and metrics',
      'Document action items and assign owners',
    ];
  }

  // General fallback breakdown
  return [
    `Clarify requirements for ${taskTitle.slice(0, 24)}...`,
    'Execute initial implementation',
    'Review and verify completion',
  ];
}
