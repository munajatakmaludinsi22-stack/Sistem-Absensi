export interface User {
  id: string;
  username: string;
  nama: string;
  role: "admin" | "guru" | "kepsek";
  status: string;
  nip?: string;
  foto?: string;
  createdAt?: string;
}

export interface Guru {
  id: string;
  nip: string;
  nama: string;
  email: string;
  kelasDiampu: string;
  status: "aktif" | "tidak aktif";
  foto: string;
}

export interface Siswa {
  id: string;
  nis: string;
  nisn: string;
  nama: string;
  kelas: string;
  jenisKelamin: "L" | "P";
  namaAyah: string;
  namaIbu: string;
  alamat: string;
  status: "aktif" | "tidak aktif";
  foto: string;
}

export interface Kelas {
  id: string;
  nama: string;
  waliKelasId: string;
  waliKelasNama: string;
  kapasitas: number;
}

export interface AbsensiRecord {
  id: string;
  tanggal: string;
  nis: string;
  namaSiswa: string;
  kelas: string;
  status: "Hadir" | "Izin" | "Sakit" | "Alpha" | "Terlambat";
  catatan: string;
  dibuatOleh: string;
  timestamp: string;
}

export interface AttendanceStudentRow {
  studentId: string;
  nis: string;
  nama: string;
  jenisKelamin: "L" | "P";
  kelas: string;
  status: "Hadir" | "Izin" | "Sakit" | "Alpha" | "Terlambat";
  catatan: string;
  isRecorded: boolean;
  lastUpdated: string | null;
  dibuatOleh: string | null;
}

export interface Pengumuman {
  id: string;
  judul: string;
  isi: string;
  tanggal: string;
  dibuatOleh: string;
  target: "Semua" | "Guru" | "Wali Kelas";
}

export interface KalenderAkademik {
  id: string;
  tanggal: string;
  kegiatan: string;
  tipe: "Libur" | "Ujian" | "Kegiatan Sekolah";
}

export interface LogAktivitas {
  id: string;
  timestamp: string;
  pengguna: string;
  role: string;
  aktivitas: string;
  ipAddress: string;
}

export interface AppSettings {
  namaSekolah: string;
  npsn: string;
  alamat: string;
  kepalaSekolah: string;
  nipKepalaSekolah: string;
  logoSekolah: string;
  semesterAktif: string;
  tahunAjaranAktif: string;
}

export interface BackupRecord {
  id: string;
  namaFile: string;
  tanggalBackup: string;
  ukuran: string;
  status: string;
}
