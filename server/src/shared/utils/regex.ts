// Makes user input safe to embed in a RegExp / MongoDB $regex.
export const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
