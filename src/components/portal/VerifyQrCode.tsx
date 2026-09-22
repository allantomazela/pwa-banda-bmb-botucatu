import QRCode from 'react-qr-code'
import { cn } from '@/lib/utils'

type VerifyQrCodeProps = {
  value: string
  size?: number
  className?: string
  logoSrc?: string
  title?: string
}

/** QR gerado no cliente, com brasão central e ECC alto para leitura estável. */
export function VerifyQrCode({
  value,
  size = 160,
  className,
  logoSrc = '/brand-logo.png',
  title = 'QR Code de verificação',
}: VerifyQrCodeProps) {
  const logoBox = Math.round(size * 0.28)
  const logoPad = Math.max(4, Math.round(logoBox * 0.12))

  return (
    <div
      className={cn('relative flex items-center justify-center bg-white', className)}
      style={{ width: size, height: size }}
    >
      <QRCode
        value={value}
        size={size}
        level="H"
        bgColor="#FFFFFF"
        fgColor="#0B1220"
        title={title}
        style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
      />
      <div
        className="pointer-events-none absolute flex items-center justify-center rounded-md bg-white shadow-sm ring-1 ring-black/5"
        style={{
          width: logoBox,
          height: logoBox,
          padding: logoPad,
        }}
        aria-hidden
      >
        <img src={logoSrc} alt="" className="h-full w-full object-contain" />
      </div>
    </div>
  )
}
