import Link from "next/link";

interface CityCardProps {
  name: string;
  slug: string;
  neighborhoodCount: number;
}

export default function CityCard({ name, slug, neighborhoodCount }: CityCardProps) {
  return (
    <Link
      href={`/${slug}`}
      className="group flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5"
    >
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-emerald-700">
          {name}
        </h3>
        <p className="mt-1 text-sm text-zinc-500">
          {neighborhoodCount} {neighborhoodCount === 1 ? "wijk" : "wijken"}
        </p>
      </div>
      <svg
        className="size-5 text-zinc-300 transition-colors group-hover:text-emerald-500"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m9 6.75 6.75 6.75L9 20.25"
        />
      </svg>
    </Link>
  );
}
