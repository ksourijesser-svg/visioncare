import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { patientFilesApi } from '@/lib/api'

export interface PatientFile {
  id: number
  patient_id: number
  filename: string
  content_type: string | null
  size: number
  created_at: string
}

function transform(f: Record<string, unknown>): PatientFile {
  return {
    id: f.id as number,
    patient_id: f.patient_id as number,
    filename: (f.filename as string) || 'document',
    content_type: (f.content_type as string) || null,
    size: Number(f.size) || 0,
    created_at: (f.created_at as string) || '',
  }
}

export function usePatientFiles(patientId: number | null) {
  return useQuery({
    queryKey: ['patient-files', patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const res = await patientFilesApi.list(patientId as number)
      return (res.data as Record<string, unknown>[]).map(transform)
    },
  })
}

export function useUploadPatientFile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ patientId, file }: { patientId: number; file: File }) =>
      patientFilesApi.upload(patientId, file),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['patient-files', v.patientId] }),
  })
}

export function useDeletePatientFile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ patientId, fileId }: { patientId: number; fileId: number }) =>
      patientFilesApi.delete(patientId, fileId),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['patient-files', v.patientId] }),
  })
}

/** Fetch a file as an object URL (auth header is required, so we can't use a
 *  plain <img src> / link — we download the blob then create a local URL). */
export async function fetchFileObjectUrl(patientId: number, fileId: number): Promise<string> {
  const res = await patientFilesApi.download(patientId, fileId)
  return URL.createObjectURL(res.data as Blob)
}
