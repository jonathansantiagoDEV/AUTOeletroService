export function Logo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="Autoserviços"
      className={className}
      style={{ objectFit: 'contain' }}
    />
  )
}
