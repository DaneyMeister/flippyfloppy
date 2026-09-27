function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Next default name for a new purchase group of this type: the type plus one
 * more than the highest number already used, e.g. "PC Set 1".."PC Set 5" ->
 * "PC Set 6". Gaps are not reused, so a deleted "PC Set 3" never comes back
 * as a confusing duplicate of an old sale record.
 */
export function nextGroupName(groupType: string, existingNames: string[]): string {
  const pattern = new RegExp(`^${escapeRegExp(groupType)}\\s+(\\d+)$`, 'i');
  let highest = 0;
  for (const name of existingNames) {
    const match = pattern.exec(name.trim());
    if (match) highest = Math.max(highest, Number(match[1]));
  }
  return `${groupType} ${highest + 1}`;
}
