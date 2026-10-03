/** Class descriptions are free text ("Morning Yoga: bring a mat"); the part before a colon is the name. */
export function classTitle(description: string): string {
  const head: string = (description ?? '').split(':')[0].trim();
  return head || description;
}
