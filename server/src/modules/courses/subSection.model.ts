import { Schema, model } from "mongoose";

export interface ISubSection {
  title?: string;
  timeDuration?: string;
  description?: string;
  videoUrl?: string;
}

const subSectionSchema = new Schema<ISubSection>({
  title: { type: String, trim: true },
  timeDuration: { type: String },
  description: { type: String },
  videoUrl: { type: String },
});

export const SubSection = model<ISubSection>("SubSection", subSectionSchema);
