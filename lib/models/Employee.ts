import mongoose, { Schema, InferSchemaType, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const AttemptSchema = new Schema(
  {
    date: { type: String, required: true }, // YYYY-MM-DD
    success: { type: Boolean, required: true },
    message: { type: String, default: '' },
    at: { type: Date, default: () => new Date() },
  },
  { _id: false }
);

const AutoPresensiScheduleSchema = new Schema(
  {
    active: { type: Boolean, default: false },
    fotoBase64: { type: String, default: '' }, // <=10KB JPEG
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    daysCount: { type: Number, default: 1 },
    completedCheckins: { type: [AttemptSchema], default: [] },
    completedCheckouts: { type: [AttemptSchema], default: [] },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: false }
);

const EmployeeSchema = new Schema(
  {
    _id: { type: String, default: () => uuidv4() },
    nomorInduk: { type: String, required: true, unique: true, index: true, trim: true },
    passwordEnc: { type: String, required: true },
    deviceId: { type: String, required: true, trim: true },
    authorization: { type: String, default: null },
    caraddeUserId: { type: String, default: null },
    employeeName: { type: String, default: null },
    instansi: { type: String, default: null },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    jabatan: { type: String, default: null },
    email: { type: String, default: null },
    lastLogin: { type: Date, default: null },
    // Auto Presensi feature
    autoPresensiEnabled: { type: Boolean, default: false, index: true },
    autoPresensiSchedule: { type: AutoPresensiScheduleSchema, default: () => ({}) },
  },
  { timestamps: true, _id: false }
);

export type EmployeeDoc = InferSchemaType<typeof EmployeeSchema> & {
  _id: string;
  save: () => Promise<EmployeeDoc>;
};

// Force re-register if schema fields changed (dev hot-reload). In production
// this branch only executes once at startup.
if (mongoose.models.Employee) {
  delete mongoose.models.Employee;
  if (mongoose.modelSchemas) delete mongoose.modelSchemas.Employee;
}

export const Employee: Model<EmployeeDoc> = mongoose.model<EmployeeDoc>('Employee', EmployeeSchema);
