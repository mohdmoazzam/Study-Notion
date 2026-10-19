import { Schema, Types, model } from "mongoose";

export interface ISection {
  sectionName?: string;
  subSection: Types.ObjectId[];
}

const sectionSchema = new Schema<ISection>({
  sectionName: { type: String, trim: true },
  subSection: [{ type: Schema.Types.ObjectId, required: true, ref: "SubSection" }],
});

export const Section = model<ISection>("Section", sectionSchema);
