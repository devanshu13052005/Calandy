export default function PageLoader({ label = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div
        className="w-10 h-10 border-[3px] border-[#E5E7EB] border-t-[#006BFF] rounded-full animate-spin"
        role="status"
        aria-label={label}
      />
      <p className="text-sm text-[#6B7280]">{label}</p>
    </div>
  );
}
