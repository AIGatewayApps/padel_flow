import Image from "next/image";

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: number;
  className?: string;
}

export function Avatar({ src, name, size = 36, className = "" }: AvatarProps) {
  const initials = name
    ? name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";
  const bg = ["bg-green-100 text-green-700","bg-blue-100 text-blue-700","bg-purple-100 text-purple-700","bg-orange-100 text-orange-700"];
  const colorClass = name ? bg[name.charCodeAt(0) % bg.length] : bg[0];

  return (
    <span
      style={{ width: size, height: size }}
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full overflow-hidden ${!src ? colorClass : ""} ${className}`}
    >
      {src ? (
        <Image src={src} alt={name ?? "Avatar"} width={size} height={size} className="object-cover" />
      ) : (
        <span className="text-xs font-semibold">{initials}</span>
      )}
    </span>
  );
}
