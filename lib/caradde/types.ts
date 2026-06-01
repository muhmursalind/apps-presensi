export interface CaraddeMeta {
  code: number;
  status: 'success' | 'failed';
  message: string;
}
export interface CaraddeResponse<T> {
  meta: CaraddeMeta;
  data: T;
}
export interface CaraddeLoginData {
  is_leader: string;
  access_token: string;
  verifikasi: string;
  has_changed_pin: boolean;
  token_type: string;
  embedding_b64: string;
  user: {
    id: string;
    email: string | null;
    name: string;
    avatar: string | null;
    jabatan: string | null;
    use_face_recognition: boolean;
  };
}
export interface CaraddeBerandaData {
  can_presence: { status: boolean; reason?: string };
  settings?: Record<string, unknown>;
  date: { bulan: string; hari: string; tgl: string };
  status_minggu_ini: Record<string, string | null>;
  kehadiran?: number;
  cuti?: number;
  berlangsung?: string;
  operator_instansi?: Array<{ id: string; name: string; phone_number: string | null; avatar_url: string | null }>;
}
export interface CaraddeStatusHariIniData {
  sudah_presensi_datang: boolean;
  sudah_presensi_pulang: boolean;
  tanggal: string;
  jam_kerja: { jam_masuk_normal: string; jam_keluar_normal: string };
}
export interface CaraddeLocationsData {
  locations: Array<{
    id_instansi: string;
    agency_name: string;
    is_home: boolean;
    schedule_id: string | null;
    latitude: number;
    longitude: number;
    nama_lokasi: string;
    radius: number;
    is_primary: boolean;
  }>;
  is_assistance: boolean;
}
export interface CaraddeCheckinData {
  message: string;
  tanggal: string;
  waktu: string;
  lokasi: string;
  jarak_meter?: number;
  maksimal?: number;
  is_assistance?: boolean;
}
export interface CaraddeRiwayatItem {
  id: string;
  type: string;
  title: string;
  tanggal: string;
  hari: string;
  date_label: string;
  jam_masuk: string | null;
  jam_keluar: string | null;
  status: string;
  jenis: string;
  instansi: { id: string; name: string } | null;
  attendance_records: unknown[];
}
export interface CaraddeRiwayatData {
  items: CaraddeRiwayatItem[];
  pagination: { current_page: number; total_pages: number; total_items: number; items_per_page: number };
}
