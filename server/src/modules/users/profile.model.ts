import { Schema, model } from "mongoose";

export interface IProfile {
  gender?: string | null;
  dateOfBirth?: string | null;
  about?: string | null;
  contactNumber?: string | null;
}

const profileSchema = new Schema<IProfile>({
  gender: { type: String },
  dateOfBirth: { type: String },
  about: { type: String, trim: true },
  contactNumber: { type: String, trim: true },
});

export const Profile = model<IProfile>("Profile", profileSchema);
