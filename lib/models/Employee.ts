import mongoose, { Schema, InferSchemaType, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const EmployeeSchema = new Schema(
  {
    _id: { type: String, default: () => uuidv4() },
    nomorInduk: { type: String, required: true, unique: true, index: true, trim: true },
    passwordEnc: { type: String, required: true },
    deviceId: { type: String, required: true, trim: true },
    authorization: { type: String, default: null }, // "Bearer xxx"
    caraddeUserId: { type: String, default: null },
    employeeName: { type: String, default: null },
    instansi: { type: String, default: null },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    jabatan: { type: String, default: null },
    email: { type: String, default: null },
    lastLogin: { type: Date, default: null },
  },
  { timestamps: true, _id: false }
);

export type EmployeeDoc = InferSchemaType<typeof EmployeeSchema> & { _id: string; save: () => Promise<EmployeeDoc> };

export const Employee: Model<EmployeeDoc> =
  (mongoose.models.Employee as Model<EmployeeDoc>) ||
  mongoose.model<EmployeeDoc>('Employee', EmployeeSchema);
