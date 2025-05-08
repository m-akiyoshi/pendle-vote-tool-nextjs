import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col gap-2 items-center justify-center h-screen">
      Links:
      <Link href="/get-vote" className="text-xl font-semibold underline">
        Get Vote info from tx hash
      </Link>
      <Link href="/latest-vote" className="text-xl font-semibold underline">
        Get the last transaction from the address
      </Link>
    </div>
  );
}
