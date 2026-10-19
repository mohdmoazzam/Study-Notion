interface TimedSubSection {
  timeDuration?: string | null;
}

interface SectionWithSubSections {
  subSection: TimedSubSection[];
}

export const convertSecondsToDuration = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

export const getTotalSeconds = (sections: SectionWithSubSections[]): number =>
  sections.reduce(
    (total, section) =>
      total + section.subSection.reduce((sum, sub) => sum + (parseFloat(sub.timeDuration ?? "") || 0), 0),
    0
  );

export const countSubSections = (sections: SectionWithSubSections[]): number =>
  sections.reduce((count, section) => count + section.subSection.length, 0);
