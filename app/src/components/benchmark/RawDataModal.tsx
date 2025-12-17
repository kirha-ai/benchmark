import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

function formatRawData(data: string): string {
  try {
    const parsed = JSON.parse(data)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return data
  }
}

interface RawDataModalProps {
  data: { title: string; data: string } | null
  onClose: () => void
}

export function RawDataModal({ data, onClose }: RawDataModalProps) {
  return (
    <Dialog open={!!data} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-2rem)] sm:w-full sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-sm sm:text-base">{data?.title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <pre className="whitespace-pre-wrap font-mono text-[10px] sm:text-xs leading-relaxed bg-muted/50 p-3 sm:p-4 rounded">
            {data && formatRawData(data.data)}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  )
}
