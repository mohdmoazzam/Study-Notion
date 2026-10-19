import { Schema, Types, model } from "mongoose";

export interface ICategory {
  name: string;
  description: string;
  course: Types.ObjectId[];
}

const categorySchema = new Schema<ICategory>({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  course: [{ type: Schema.Types.ObjectId, ref: "Course" }],
});

export const Category = model<ICategory>("Category", categorySchema);
