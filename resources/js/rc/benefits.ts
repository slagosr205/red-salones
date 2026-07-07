import axios from 'axios';

export type Benefit = {
  id: string;
  title: string;
  kind: string;
  pointsCost: number;
  description: string | null;
  instructor: string | null;
  date: string | null;
  modality: string | null;
  seats: number | null;
  imagePath: string | null;
  active: boolean;
  targetRole: string | null;
  createdAt?: string;
};

export async function fetchBenefits(): Promise<Benefit[]> {
  const res = await axios.get('/api/beneficios/admin');
  return res.data as Benefit[];
}

function toFormData(data: Record<string, any>): FormData {
  const fd = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      fd.append(key, value);
    }
  });
  return fd;
}

export async function createBenefit(data: {
  title: string;
  kind: string;
  points_cost: number;
  description?: string;
  instructor?: string;
  date?: string;
  modality?: string;
  seats?: number;
  image?: File | null;
  active?: boolean;
  target_role?: string | null;
}): Promise<Benefit> {
  const fd = toFormData({
    title: data.title,
    kind: data.kind,
    points_cost: data.points_cost,
    description: data.description || '',
    instructor: data.instructor || '',
    date: data.date || '',
    modality: data.modality || '',
    seats: data.seats || '',
    active: data.active ? '1' : '0',
    target_role: data.target_role || '',
    ...(data.image ? { image: data.image } : {}),
  });
  const res = await axios.post('/api/beneficios/admin', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function updateBenefit(
  id: string | number,
  data: {
    title: string;
    kind: string;
    points_cost: number;
    description?: string;
    instructor?: string;
    date?: string;
    modality?: string;
    seats?: number;
    image?: File | null;
    active?: boolean;
    target_role?: string | null;
  },
): Promise<Benefit> {
  const fd = toFormData({
    title: data.title,
    kind: data.kind,
    points_cost: data.points_cost,
    description: data.description || '',
    instructor: data.instructor || '',
    date: data.date || '',
    modality: data.modality || '',
    seats: data.seats || '',
    active: data.active ? '1' : '0',
    target_role: data.target_role || '',
    ...(data.image ? { image: data.image } : {}),
  });
  fd.append('_method', 'PUT');
  const res = await axios.post(`/api/beneficios/admin/${id}`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function deleteBenefit(id: string | number): Promise<void> {
  await axios.delete(`/api/beneficios/admin/${id}`);
}

export async function toggleBenefit(id: string | number): Promise<void> {
  await axios.post(`/api/beneficios/admin/${id}/toggle`);
}
